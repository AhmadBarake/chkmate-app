export enum CloudProvider {
  AWS = 'AWS',
  AZURE = 'Azure',
  GCP = 'GCP'
}

export interface ResourceNode {
  id: string;
  label: string;
  type: string; // e.g., 'compute', 'database', 'storage', 'network'
  details?: string;
}

export interface ResourceLink {
  source: string;
  target: string;
}

export interface InfrastructurePlan {
  id: string;
  name: string;
  provider: CloudProvider;
  prompt: string;
  terraformCode: string;
  costEstimate: number;
  resources: {
    name: string;
    type: string;
    cost: number;
  }[];
  architecture: {
    nodes: ResourceNode[];
    links: ResourceLink[];
  };
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  templates: InfrastructurePlan[];
  deployments: Deployment[];
}

export interface Deployment {
  id: string;
  templateId: string;
  status: 'deploying' | 'active' | 'failed' | 'destroyed';
  region: string;
  deployedAt: string;
  health: number; // 0-100
}

export enum AppView {
  LANDING = 'LANDING',
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_SIGNUP = 'AUTH_SIGNUP',
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  GENERATOR = 'GENERATOR',
  MONITORING = 'MONITORING'
}
