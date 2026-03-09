import api from './api';

export type RootCategory = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  created_at?: string;
};

export type Category = {
  id: number;
  name: string;
  root_category_id: string;
  level?: number;
  description?: string;
  created_at?: string;
};

export type Diagram = {
  id: string;
  category_id: number;
  image_path?: string | null;
  processed?: boolean;
  created_at?: string;
};

export type GraphNode = {
  id: string;
  label: string;
  type: 'root_category' | 'category' | 'diagram' | 'subject' | string;
  payload?: Record<string, any>;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  type?: string;
  payload?: Record<string, any>;
};

export type DiagramKnowledgeGraphResponse = {
  success: boolean;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  summary?: {
    triple_count?: number;
    node_count?: number;
    edge_count?: number;
  };
};

export const getRootCategories = async () => {
  const response = await api.get('/postgres/root-categories/');
  return response.data as RootCategory[];
};

export const getCategoriesByRoot = async (rootCategoryId: string) => {
  const response = await api.get(`/postgres/categories/root/${rootCategoryId}`);
  return response.data as Category[];
};

export const getDiagramsByCategory = async (categoryId: number) => {
  const response = await api.get(`/postgres/diagrams/category/${categoryId}`);
  return response.data as Diagram[];
};

export const getKnowledgeGraphByDiagram = async (payload: {
  diagramId: string;
  rootCategoryId: string;
  categoryName?: string;
}) => {
  const response = await api.get(`/neo4j/graph/diagram/${payload.diagramId}`, {
    params: {
      root_category_id: payload.rootCategoryId,
      category_name: payload.categoryName,
    },
  });
  return response.data as DiagramKnowledgeGraphResponse;
};
