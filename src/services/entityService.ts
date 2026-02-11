import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface RootCategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  root_category_id?: string;
  level?: number;
  description?: string;
  diagram_count?: number;
  created_at?: string;
}

export interface RootSubject {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level?: number;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  root_subject_id?: number;
  synonyms?: string[];
  description?: string;
  categories?: string[];
  created_at?: string;
}

export interface Relationship {
  id: number;
  code: string;
  name: string;
  description?: string;
  inverse_relationship?: string;
  semantic_type?: string;
  created_at?: string;
}

export interface Diagram {
  id: string;
  category_id?: number;
  image_path?: string;
  processed?: boolean;
  diagram_metadata?: any;
  created_at?: string;
}

export interface Triple {
  id: number;
  subject_id: number;
  relationship_id: number;
  object_id: number;
  diagram_id?: string;
  confidence_score?: number;
  context?: string;
  created_at?: string;
}

// RootCategory API
export const getRootCategories = () => axios.get<RootCategory[]>(`${API_URL}/entities/root-categories`);
export const createRootCategory = (data: Omit<RootCategory, 'created_at'>) => 
  axios.post<RootCategory>(`${API_URL}/entities/root-categories`, data);
export const updateRootCategory = (id: string, data: Partial<RootCategory>) => 
  axios.put<RootCategory>(`${API_URL}/entities/root-categories/${id}`, data);
export const deleteRootCategory = (id: string) => 
  axios.delete(`${API_URL}/entities/root-categories/${id}`);

// Category API
export const getCategories = () => axios.get<Category[]>(`${API_URL}/entities/categories`);
export const createCategory = (data: Omit<Category, 'id' | 'created_at'>) => 
  axios.post<Category>(`${API_URL}/entities/categories`, data);
export const updateCategory = (id: number, data: Partial<Category>) => 
  axios.put<Category>(`${API_URL}/entities/categories/${id}`, data);
export const deleteCategory = (id: number) => 
  axios.delete(`${API_URL}/entities/categories/${id}`);

// RootSubject API
export const getRootSubjects = () => axios.get<RootSubject[]>(`${API_URL}/entities/root-subjects`);
export const createRootSubject = (data: Omit<RootSubject, 'id'>) => 
  axios.post<RootSubject>(`${API_URL}/entities/root-subjects`, data);
export const updateRootSubject = (id: number, data: Partial<RootSubject>) => 
  axios.put<RootSubject>(`${API_URL}/entities/root-subjects/${id}`, data);
export const deleteRootSubject = (id: number) => 
  axios.delete(`${API_URL}/entities/root-subjects/${id}`);

// Subject API
export const getSubjects = () => axios.get<Subject[]>(`${API_URL}/entities/subjects`);
export const createSubject = (data: Omit<Subject, 'id' | 'created_at'>) => 
  axios.post<Subject>(`${API_URL}/entities/subjects`, data);
export const updateSubject = (id: number, data: Partial<Subject>) => 
  axios.put<Subject>(`${API_URL}/entities/subjects/${id}`, data);
export const deleteSubject = (id: number) => 
  axios.delete(`${API_URL}/entities/subjects/${id}`);

// Relationship API
export const getRelationships = () => axios.get<Relationship[]>(`${API_URL}/entities/relationships`);
export const createRelationship = (data: Omit<Relationship, 'id' | 'created_at'>) => 
  axios.post<Relationship>(`${API_URL}/entities/relationships`, data);
export const updateRelationship = (id: number, data: Partial<Relationship>) => 
  axios.put<Relationship>(`${API_URL}/entities/relationships/${id}`, data);
export const deleteRelationship = (id: number) => 
  axios.delete(`${API_URL}/entities/relationships/${id}`);

// Diagram API
export const getDiagrams = () => axios.get<Diagram[]>(`${API_URL}/entities/diagrams`);
export const createDiagram = (data: Omit<Diagram, 'created_at'>) => 
  axios.post<Diagram>(`${API_URL}/entities/diagrams`, data);
export const updateDiagram = (id: string, data: Partial<Diagram>) => 
  axios.put<Diagram>(`${API_URL}/entities/diagrams/${id}`, data);
export const deleteDiagram = (id: string) => 
  axios.delete(`${API_URL}/entities/diagrams/${id}`);

// Triple API
export const getTriples = () => axios.get<Triple[]>(`${API_URL}/entities/triples`);
export const createTriple = (data: Omit<Triple, 'id' | 'created_at'>) => 
  axios.post<Triple>(`${API_URL}/entities/triples`, data);
