terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "eu-central-1" # Changed region
  profile = "chkmate"
}

# --- Variables ---

variable "domain_name" {
  default = "chkmate.net"
}

variable "api_subdomain" {
  default = "api"
}

# Secrets for Environment Variables
variable "database_url" { sensitive = true }
variable "clerk_publishable_key" {}
variable "clerk_secret_key" { sensitive = true }
variable "gemini_api_key" { sensitive = true }
variable "posthog_key" { sensitive = true }
variable "posthog_host" { default = "https://app.posthog.com" }
variable "paddle_api_key" { sensitive = true }
variable "paddle_webhook_secret" { sensitive = true }
variable "paddle_env" { default = "sandbox" }


# --- Data Sources ---

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_route53_zone" "main" {
  name = var.domain_name
}

# --- VPC & Networking ---

# Using default VPC for simplicity, but in prod create a new VPC
resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

resource "aws_default_subnet" "default_az1" {
  availability_zone = "eu-central-1a"
}

resource "aws_default_subnet" "default_az2" {
  availability_zone = "eu-central-1b"
}

resource "aws_security_group" "lb_sg" {
  name        = "chkmate-lb-sg"
  description = "Load Balancer Security Group"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  name        = "chkmate-ecs-sg"
  description = "ECS Tasks Security Group"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port       = 3002
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id] # Allow only from LB
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- ECR Repository ---

resource "aws_ecr_repository" "repo" {
  name                 = "chkmate-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

# --- Load Balancer (ALB) ---

resource "aws_lb" "main" {
  name               = "chkmate-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = [aws_default_subnet.default_az1.id, aws_default_subnet.default_az2.id]
}

resource "aws_lb_target_group" "app" {
  name        = "chkmate-tg"
  port        = 3002
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
  target_type = "ip" # Required for Fargate

  health_check {
    path                = "/" # Adjust if you have a specific health path
    matcher             = "200-499" # Accepting 404 as healthy for 'cannot get /'
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Note: Using ACM certificate requires manual validation usually. 
# We assume a cert *might* exist or we generate one. 
# To automate fully, we request a cert here.

resource "aws_acm_certificate" "cert" {
  domain_name       = "${var.api_subdomain}.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => dvo
  }

  allow_overwrite = true
  name            = each.value.resource_record_name
  records         = [each.value.resource_record_value]
  ttl             = 60
  type            = each.value.resource_record_type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "cert_valid" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
  
  depends_on = [aws_acm_certificate_validation.cert_valid]
}

# --- ECS Cluster & Task ---

resource "aws_ecs_cluster" "main" {
  name = "chkmate-cluster"
}

# IAM Role for Task Execution (Pull images, logs)
resource "aws_iam_role" "execution_role" {
  name = "chkmate-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "execution_role_policy" {
  role       = aws_iam_role.execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_cloudwatch_log_group" "ecs_log_group" {
  name              = "/ecs/chkmate-backend"
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "app" {
  family                   = "chkmate-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.execution_role.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = "${aws_ecr_repository.repo.repository_url}:latest"
    portMappings = [{
      containerPort = 3002
      hostPort      = 3002
    }]
    environment = [
        { name = "DATABASE_URL", value = var.database_url },
        { name = "VITE_CLERK_PUBLISHABLE_KEY", value = var.clerk_publishable_key },
        { name = "CLERK_PUBLISHABLE_KEY", value = var.clerk_publishable_key },
        { name = "CLERK_SECRET_KEY", value = var.clerk_secret_key },
        { name = "VITE_GEMINI_API_KEY", value = var.gemini_api_key },
        { name = "GEMINI_API_KEY", value = var.gemini_api_key },
        { name = "VITE_POSTHOG_KEY", value = var.posthog_key },
        { name = "VITE_POSTHOG_HOST", value = var.posthog_host },
        { name = "PADDLE_API_KEY", value = var.paddle_api_key },
        { name = "PADDLE_WEBHOOK_SECRET", value = var.paddle_webhook_secret },
        { name = "PADDLE_ENV", value = var.paddle_env },
        { name = "PORT", value = "3002" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_log_group.name
        "awslogs-region"        = "eu-central-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "app" {
  name            = "chkmate-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_default_subnet.default_az1.id, aws_default_subnet.default_az2.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "backend"
    container_port   = 3002
  }
}

# --- DNS Record ---

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.api_subdomain}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# --- Outputs ---

output "ecr_repo_url" {
  value = aws_ecr_repository.repo.repository_url
}

output "api_endpoint" {
  value = "https://${aws_route53_record.api.name}"
}

resource "aws_iam_role_policy" "ecs_logging" {
  name = "chkmate-ecs-logging"
  role = aws_iam_role.execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup"
        ]
        Resource = "*"
      }
    ]
  })
}

