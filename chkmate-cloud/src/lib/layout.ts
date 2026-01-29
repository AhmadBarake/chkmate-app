import { CloudResource } from './api';
import dagre from 'dagre';
import { Position, MarkerType } from '@xyflow/react';

const DAGRE_GRAPH_DEFAULTS = {
  rankdir: 'TB',
  align: 'UL',
  nodesep: 80,
  ranksep: 100,
};

const NODE_WIDTH = 250;
const NODE_HEIGHT = 80;

export const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    ...DAGRE_GRAPH_DEFAULTS,
    rankdir: direction,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const transformResourcesToGraph = (resources: CloudResource[]) => {
  const nodes: any[] = [];
  const edges: any[] = [];

  // Group by type for easier processing
  const vpcs = resources.filter(r => r.resourceType === 'vpc');
  const subnets = resources.filter(r => r.resourceType === 'subnet');
  const instances = resources.filter(r => ['ec2_instance', 'rds_instance', 'lambda_function'].includes(r.resourceType));
  const others = resources.filter(r => !['vpc', 'subnet', 'ec2_instance', 'rds_instance', 'lambda_function'].includes(r.resourceType));

  // 1. VPC Nodes (Groups)
  vpcs.forEach(vpc => {
    nodes.push({
      id: vpc.id,
      type: 'default', // Using default type for now, but could be 'group' if we want containment
      data: { 
        label: `${vpc.name || vpc.resourceId}\n(${vpc.region})`,
        resource: vpc
      },
      style: {
        background: '#0f172a', // slate-950
        color: '#f8fafc', // slate-50
        border: '1px solid #334155', // slate-700
        borderRadius: '12px',
        padding: '10px',
        width: 250,
      }
    });
  });
  
  // 2. Subnet Nodes
  subnets.forEach(subnet => {
    nodes.push({
      id: subnet.id,
      type: 'default',
      data: { 
        label: `${subnet.name || subnet.resourceId}`,
        resource: subnet
      },
      style: {
        background: '#1e293b', // slate-800
        color: '#94a3b8', // slate-400
        border: '1px dashed #475569', // slate-600
        borderRadius: '8px',
        padding: '10px',
        width: 200,
        fontSize: '12px'
      }
    });

    // Edge: VPC -> Subnet
    if (subnet.metadata?.vpcId) {
       const parentVpc = vpcs.find(v => v.resourceId === subnet.metadata?.vpcId);
       if (parentVpc) {
         edges.push({
            id: `${parentVpc.id}-${subnet.id}`,
            source: parentVpc.id,
            target: subnet.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#475569' }
         });
       }
    }
  });

  // 3. Instances / Resources
  instances.forEach(instance => {
      let label = instance.name || instance.resourceId;
      let borderColor = '#334155';
      let icon = '';

      if (instance.resourceType === 'ec2_instance') {
        borderColor = '#f97316'; // orange
        icon = '🖥️ ';
      } else if (instance.resourceType === 'rds_instance') {
        borderColor = '#3b82f6'; // blue
        icon = '🗄️ ';
      } else if (instance.resourceType === 'lambda_function') {
        borderColor = '#f59e0b'; // amber
        icon = '⚡ ';
      }

      nodes.push({
        id: instance.id,
        type: 'default',
        data: { 
            label: `${icon}${label}`,
            resource: instance
        },
        style: {
            background: '#020617', // slate-950
            color: '#e2e8f0', // slate-200
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '8px',
            width: 180,
            fontSize: '12px',
            boxShadow: `0 0 10px ${borderColor}20`
        }
      });

      // Edge: Subnet -> Instance
      if (instance.metadata?.subnetId) {
         const parentSubnet = subnets.find(s => s.resourceId === instance.metadata?.subnetId);
         if (parentSubnet) {
            edges.push({
                id: `${parentSubnet.id}-${instance.id}`,
                source: parentSubnet.id,
                target: instance.id,
                type: 'smoothstep',
                animated: false,
                style: { stroke: borderColor },
                markerEnd: { type: MarkerType.ArrowClosed, color: borderColor }
            });
         }
      } 
      // Handle RDS subnet groups if needed, but simple mapping is usually direct subnetId for EC2
  });

  // 4. Other global/unconnected resources
  others.forEach(other => {
      // Only add if not already added (sanity check)
      if (nodes.find(n => n.id === other.id)) return;

      const isS3 = other.resourceType === 's3_bucket';
      
      nodes.push({
          id: other.id,
          type: 'default',
          data: {
              label: `${isS3 ? '🪣 ' : ''}${other.name || other.resourceId}`,
              resource: other
          },
          style: {
              background: '#0f172a',
              color: '#cbd5e1',
              border: isS3 ? '1px solid #22c55e' : '1px solid #64748b',
              borderRadius: '20px', // pill shape for buckets
              padding: '8px 16px',
              width: isS3 ? 200 : 180,
              fontSize: '12px'
          }
      });
      // No edges for these usually, or maybe link to VPC if there's a VPC endpoint (complex)
  });

  return getLayoutedElements(nodes, edges);
};
