import api from './api';

export type StemQueryResponse = {
  success: boolean;
  log_id?: string;
  query?: {
    type?: string;
    text?: string | null;
    normalized_text?: string | null;
    routing_mode?: string | null;
    phase?: string | null;
    image_url?: string | null;
  };
  final_output?: {
    diagram?: { diagram_id?: string; image_path?: string; category_id?: number } | null;
    description?: string;
    video_recommendations?: Array<{ title?: string; url?: string }>;
    diagram_explanation?: {
      title?: string;
      overview?: string;
      process_steps?: string[];
      key_takeaways?: string[];
      applications?: string[];
      glossary?: Array<{ term?: string; definition?: string }>;
      learning_prompt?: string;
      source_query?: string | null;
    };
    scientific_analysis?: {
      summary?: string;
      key_points?: string[];
      reasoning_steps?: string[];
      applications?: string[];
      glossary?: Array<{ term?: string; definition?: string }>;
      recommended_queries?: string[];
    };
  } | null;
  pending_review?: {
    _id?: string;
    status?: string;
    reason?: string;
  } | null;
  triples?: Array<{ subject: string; relationship: string; object: string }>;
  model_output?: any;
  query_results?: Array<{
    triple: { subject: string; relationship: string; object: string };
    results: {
      postgres?: { categories?: any[]; diagrams?: any[] };
      neo4j?: any[];
      mongo?: any[];
      descriptions?: string[];
      diagrams?: any[];
    };
  }>;
};

export const submitStemQuery = async (payload: {
  queryText?: string;
  imageFile?: File | null;
  userId?: string;
}) => {
  const formData = new FormData();
  if (payload.queryText) formData.append('query_text', payload.queryText);
  if (payload.imageFile) formData.append('image', payload.imageFile);
  if (payload.userId) formData.append('user_id', payload.userId);

  const response = await api.post('/integration/query', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data as StemQueryResponse;
};

export const getQueryLogs = async (limit = 50) => {
  const response = await api.get('/integration/query/logs', {
    params: { limit },
  });
  return response.data as { success: boolean; total: number; logs: any[] };
};

export type PendingLearningItem = {
  _id: string;
  query_text?: string | null;
  normalized_query_text?: string | null;
  query_type?: string | null;
  image_url?: string | null;
  user_id?: string | null;
  reason?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | string;
  model_output?: any;
  created_at?: string;
  updated_at?: string;
};

export const getPendingLearningItems = async (params?: { limit?: number; status?: string }) => {
  const response = await api.get('/integration/query/pending-learning', {
    params: {
      limit: params?.limit ?? 50,
      status: params?.status,
    },
  });
  return response.data as { success: boolean; total: number; items: PendingLearningItem[] };
};

export const approvePendingLearningItem = async (
  itemId: string,
  payload?: {
    approved_by?: string;
    category_name?: string;
    root_subject_name?: string;
    relationship_name?: string;
    subject_names?: string[];
    note?: string;
  }
) => {
  const response = await api.post(`/integration/query/pending-learning/${itemId}/approve`, payload || {});
  return response.data as { success: boolean; message?: string; item?: PendingLearningItem; result?: any };
};

export const rejectPendingLearningItem = async (
  itemId: string,
  payload?: {
    rejected_by?: string;
    reason?: string;
    note?: string;
  }
) => {
  const response = await api.post(`/integration/query/pending-learning/${itemId}/reject`, payload || {});
  return response.data as { success: boolean; message?: string; item?: PendingLearningItem };
};
