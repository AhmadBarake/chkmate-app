#!/bin/bash
set -e

# Region and Profile
REGION="eu-central-1"
PROFILE="chkmate"

# Login to ECR
echo "🔑 Logging into ECR..."
aws ecr get-login-password --region $REGION --profile $PROFILE | docker login --username AWS --password-stdin $(aws sts get-caller-identity --profile $PROFILE --query "Account" --output text).dkr.ecr.$REGION.amazonaws.com

# Get Repo URL (assume it exists from terraform)
REPO_URL=$(aws ecr describe-repositories --repository-names chkmate-backend --region $REGION --profile $PROFILE --query "repositories[0].repositoryUri" --output text)

echo "📦 Building Docker Image..."
# Build from project root (server context)
cd "$(dirname "$0")/../server"
docker build --platform linux/amd64 -t chkmate-backend .

echo "🏷️ Tagging Image..."
docker tag chkmate-backend:latest $REPO_URL:latest

echo "Ep Pushing Image..."
docker push $REPO_URL:latest

echo "♻️ Forcing New Deployment in ECS..."
aws ecs update-service --cluster chkmate-cluster --service chkmate-service --force-new-deployment --region $REGION --profile $PROFILE

echo "✅ Done!"
