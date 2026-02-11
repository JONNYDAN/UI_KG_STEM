import api from './api';

export type StemQueryResponse = {
  success: boolean;
  log_id?: string;
  query?: {
    type?: string;
    text?: string | null;
    image_url?: string | null;
  };
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
