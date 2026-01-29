import { Layers, Zap, Shield, TrendingUp, Users, Cpu, Code, Database, Cloud, ShoppingBag, GraduationCap, Bot, ArrowUpRight } from 'lucide-react';

export const NAV_LINKS = [
  { name: 'Roadmap', href: '/docs' },
  { name: 'Pricing', href: '/pricing' },
];

export const SERVICES = [
  {
    title: 'Cloud Consulting',
    description: 'Strategic guidance for AWS, Azure, and GCP. We optimize your infrastructure for cost-efficiency and scalability.',
    icon: Cloud,
  },
  {
    title: 'App Development',
    description: 'Bespoke web and mobile applications tailored to your business needs, focusing on performance and user experience.',
    icon: Code,
  },
  {
    title: 'Managed Services',
    description: 'Ongoing support, monitoring, and maintenance to ensure your digital assets are always performant and secure.',
    icon: Layers,
  },
  {
    title: 'Digital Workshops',
    description: 'Training and workshops to upskill your internal teams in the latest cloud technologies and agile methodologies.',
    icon: Users,
  },
];

export const SECTORS = [
  {
    name: 'Fintech',
    description: 'Secure, compliant, and high-frequency trading platforms and banking solutions.',
    icon: TrendingUp,
  },
  {
    name: 'Health Tech',
    description: 'HIPAA-compliant telemedicine apps and patient data management systems.',
    icon: Shield,
  },
  {
    name: 'Logistics',
    description: 'Real-time tracking, fleet management, and supply chain optimization tools.',
    icon: Zap,
  },
  {
    name: 'Ecommerce',
    description: 'High-conversion storefronts, headless commerce architectures, and payment integrations.',
    icon: ShoppingBag,
  },
  {
    name: 'E-learning',
    description: 'Interactive LMS platforms, virtual classrooms, and educational content delivery.',
    icon: GraduationCap,
  },
  {
    name: 'AI Applications',
    description: 'LLM integration, predictive analytics, and intelligent automation agents.',
    icon: Bot,
  },
];

export const CASE_STUDIES = [
    {
        title: 'AI-Powered Therapy Management',
        client: 'Lumi',
        description: 'Building a secure, AI-driven clinic management platform with hybrid LLM architecture and HIPAA-compliant infrastructure.',
        tags: ['AI', 'Healthcare', 'DevOps'],
        link: '/case-studies/lumi',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Healthcare E-commerce Strategy',
        client: 'Saudi German Hospital',
        description: 'Digital transformation consulting to launch a seamless medical e-commerce experience integrated with hospital systems.',
        tags: ['Healthcare', 'Strategy', 'Integration'],
        link: '/case-studies/sgh',
        image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2128&auto=format&fit=crop'
    },
    {
        title: 'Cloud Learning Platform',
        client: 'Abu Dhabi School of Government',
        description: 'Scalable 3-tier AWS architecture delivering video streaming to 60,000+ government employees.',
        tags: ['GovTech', 'AWS', 'Video Streaming'],
        link: '/case-studies/adsg',
        image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Secure Fintech E-Learning',
        client: 'Arab Finance Corp',
        description: 'Democratizing finance with a secure, high-performance LMS and video streaming pipeline on AWS.',
        tags: ['EdTech', 'Fintech', 'AWS'],
        link: '/case-studies/afc',
        image: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Solar Energy Digital Transformation',
        client: 'AE MENA',
        description: 'A custom CMS and scalable AWS architecture for a leading solar power provider, ensuring rapid global asset delivery.',
        tags: ['Energy', 'CMS', 'AWS'],
        link: '/case-studies/ae-mena',
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop'
    },
    {
        title: 'SaaS Platform Scale',
        client: 'Vendorsify',
        description: 'Multi-tenant SaaS architecture with full-cycle consulting: sourcing, management, and AWS implementation.',
        tags: ['SaaS', 'AWS', 'Consulting'],
        link: '/case-studies/vendorsify',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop'
    },
];

export const ENGAGEMENT_MODELS = [
  {
    type: 'Project-Based',
    detail: 'Fixed scope and timeline for clear deliverables.',
  },
  {
    type: 'Subscription',
    detail: 'Monthly access to development resources and tools.',
  },
  {
    type: 'Staff Augmentation',
    detail: 'Expert talent integration into your existing teams.',
  }
];

export const PARTNERS = [
  'AWS Partner Network',
  'Google Cloud Platform',
  'Microsoft Azure',
];

export const FAQ_ITEMS = [
    {
        question: "How do you handle project engagement?",
        answer: "We offer flexible engagement models tailored to your needs, including fixed-scope projects for defined deliverables, dedicated teams for ongoing development, and staff augmentation to scale your existing workforce."
    },
    {
        question: "Which industries do you specialize in?",
        answer: "While we are technology-agnostic, we have deep expertise in Fintech, Healthcare (HIPAA compliant), Logistics, and E-learning. Our team understands the specific regulatory and technical challenges of these sectors."
    },
    {
        question: "Do you provide post-launch support?",
        answer: "Absolutely. We believe software is a living entity. We offer comprehensive maintenance packages, including security updates, performance monitoring, and feature enhancements to ensure your product evolves with your business."
    },
    {
        question: "What is your typical project timeline?",
        answer: "Timelines vary by complexity. A typical MVP can take 8-12 weeks, while enterprise-grade transformations may span 6 months or more. We provide a detailed roadmap during our initial discovery phase so you always know what to expect."
    },
    {
        question: "What technology stack do you use?",
        answer: "We focus on modern, scalable technologies. our core stack includes React/Next.js for frontend, Node.js/Python for backend, and AWS/Azure for cloud infrastructure. We select the best tools based on performance, scalability, and your specific requirements."
    }
];