import {
  EvaluationSubSubItem,
  EvaluationSubItem,
  EvaluationHasContentItem,
  UploadedFileInfo,
  EvaluationItem,
  EvaluationSection,
  HeaderField,
  FooterField,
  EvaluationFormData
} from 'src/services/type';

import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Mock data fallback trong trường hợp API không hoạt động
const mockEvaluationData: EvaluationFormData = {
  header: [
    {
      title: 'Họ và tên:',
      answer: '',
    },
    {
      title: 'Chức danh nghề nghiệp:',
      answer: '',
    },
    {
      title: 'Đơn vị:',
      answer: '',
    }
  ],
  body: [
    {
      title: 'I. CHẤP HÀNH PHÁP LUẬT VÀ ĐẠO ĐỨC, TÁC PHONG LÀM VIỆC (30 điểm)',
      items: [
        {
          id: '1.1',
          title: 'Chính trị tư tưởng',
          content: 'Nội dung đánh giá...',
          points: '7,5',
          selfScore: 0,
          thamDinhScore: 0,
          hieuTruongScore: 0,
          hasEvidence: false,
        },
      ],
    },
  ],
  footer: [
    {
      title: '1. Tự nhận xét ưu, khuyết điểm:',
      answer: '',
    },
    {
      title: '2. Tự xếp loại chất lượng:',
      hasType: 'single-choice',
      options: [
        'Xuất sắc',
        'Tốt',
        'Khá',
        'Trung bình',
        'Yếu',
        'Kém'
      ],
      answer: '',
    }
  ]
};

export const evaluationService = {
  // Get all evaluation data với role parameter
  getAllEvaluationData: async (role?: string): Promise<EvaluationFormData> => {
    try {
      const params = role ? { role } : {};
      const response = await api.get('/evaluation', { params });
      return response.data || mockEvaluationData;
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      return mockEvaluationData;
    }
  },

  // Get evaluation data by user role
  getEvaluationDataByRole: async (role: string): Promise<EvaluationFormData> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const response = await api.get(`/evaluation/role/${role}`, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${storedToken}`
        },
      });
      return response.data || mockEvaluationData;
    } catch (error) {
      console.error(`Error fetching evaluation data for role ${role}:`, error);
      // Fallback: thử với query parameter
      return evaluationService.getAllEvaluationData(role);
    }
  },

  // Get evaluation section by index
  getEvaluationSection: async (sectionIndex: number, role?: string): Promise<EvaluationSection> => {
    try {
      const url = role
        ? `/evaluation/section/${sectionIndex}?role=${role}`
        : `/evaluation/section/${sectionIndex}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluation section:', error);
      throw error;
    }
  },

  // Get evaluation item by section index and item id
  getEvaluationItem: async (sectionIndex: number, itemId: string, role?: string): Promise<EvaluationItem> => {
    try {
      const url = role
        ? `/evaluation/section/${sectionIndex}/item/${itemId}?role=${role}`
        : `/evaluation/section/${sectionIndex}/item/${itemId}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluation item:', error);
      throw error;
    }
  },

  // Update scores for an evaluation item
  updateEvaluationScores: async (
    sectionIndex: number,
    itemId: string,
    scores: {
      selfScore?: number;
      thamDinhScore?: number;
      subItemScores?: { [key: string]: number };
    },
    role?: string
  ): Promise<EvaluationItem> => {
    try {
      const url = role
        ? `/evaluation/section/${sectionIndex}/item/${itemId}/scores?role=${role}`
        : `/evaluation/section/${sectionIndex}/item/${itemId}/scores`;

      const response = await api.put(url, scores);
      return response.data.data;
    } catch (error) {
      console.error('Error updating evaluation scores:', error);
      throw error;
    }
  },
  
  // Thêm hàm xử lý single-choice selection
  updateSingleChoiceSelection: async (
    sectionIndex: number,
    itemId: string,
    selectedOption: string,
    scores: { selfScore: number; thamDinhScore?: number },
    role?: string
  ): Promise<EvaluationItem> => {
    try {
      const url = role
        ? `/evaluation/section/${sectionIndex}/item/${itemId}/selection?role=${role}`
        : `/evaluation/section/${sectionIndex}/item/${itemId}/selection`;

      const response = await api.put(url, {
        selectedOption,
        ...scores
      });
      return response.data;
    } catch (error) {
      console.error('Error updating single choice selection:', error);
      throw error;
    }
  },

  // Thêm hàm xử lý hasContent scoring
  updateHasContentScores: async (
    sectionIndex: number,
    itemId: string,
    contentIndex: number,
    scores: { selfScore: number; thamDinhScore?: number },
    role?: string
  ): Promise<EvaluationItem> => {
    try {
      const url = role
        ? `/evaluation/section/${sectionIndex}/item/${itemId}/content/${contentIndex}/scores?role=${role}`
        : `/evaluation/section/${sectionIndex}/item/${itemId}/content/${contentIndex}/scores`;

      const response = await api.put(url, scores);
      return response.data;
    } catch (error) {
      console.error('Error updating hasContent scores:', error);
      throw error;
    }
  },

  uploadEvidence: async (
    sectionIndex: number,
    itemId: string,
    files: File[],
    role?: string
  ): Promise<any> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const formData = new FormData();
      files.forEach(file => {
        formData.append('evidence', file); // Đúng: append File objects
      });

      const url = role
        ? `/evaluation/section/${sectionIndex}/item/${itemId}/evidence?role=${role}`
        : `/evaluation/section/${sectionIndex}/item/${itemId}/evidence`;

      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  },

  deleteEvidence: async (
    sectionIndex: number,
    itemId: string,
    fileIndex: number,
    role?: string
  ): Promise<any> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const url = role
        ? `/evaluation/section/${sectionIndex}/item/${itemId}/evidence/${fileIndex}?role=${role}`
        : `/evaluation/section/${sectionIndex}/item/${itemId}/evidence/${fileIndex}`;

      const response = await api.delete(url, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting evidence:', error);
      throw error;
    }
  },

  // Update justification
  updateJustification: async (
    sectionIndex: number,
    itemId: string,
    justification: string,
    role?: string
  ): Promise<EvaluationItem> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const response = await api.put(
        `/evaluation/section/${sectionIndex}/item/${itemId}/justification`,
        { justification },
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating justification:', error);
      throw error;
    }
  },

  // Submit evaluation form
  submitEvaluation: async (formData: EvaluationFormData): Promise<{ success: boolean; message: string; fileName?: string }> => {
    try {
      const response = await api.post('/evaluation/submit', formData);
      return response.data;
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      throw error;
    }
  },

  saveEvaluationAsJSON: async (data: any) => {
    const storedToken = localStorage.getItem('authToken');
    const response = await api.post('evaluation/save-json', data, {
      headers: {
         Authorization: `Bearer ${storedToken}`,
      },
      withCredentials: true,
    });
    return response.data;
  },

  // Download evaluation JSON file
  downloadEvaluationJSON: async (fileName: string): Promise<Blob> => {
    try {
      const response = await api.get(`/evaluation/download/${fileName}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading evaluation JSON:', error);
      throw error;
    }
  },

  // Lưu nháp - SỬA LẠI: Sử dụng api instance thay vì fetch trực tiếp
  saveEvaluationAsDraft: async (data: any) => {
    const storedToken = localStorage.getItem('authToken');
    try {
      const response = await api.post('/evaluation/save-draft', data, {
        headers: {
          // 'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  },

  // Kiểm tra bản nháp
  checkDraft: async () => {
    const storedToken = localStorage.getItem('authToken');
    try {
      const response = await api.get('/evaluation/check-draft', {
        headers: {
          'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error checking draft:', error);
      throw error;
    }
  },

  // Xóa bản nháp
  deleteDraft: async () => {
    const storedToken = localStorage.getItem('authToken');
    try {
      const response = await api.delete('/evaluation/delete-draft', {
        headers: {
          'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  },


};