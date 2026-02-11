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

// Mock data fallback trong trường hợp API không hoạt động
const mockEvaluationData: EvaluationFormData = {
  header: [
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

export const evaluation12Service = {
  // Get all evaluation data với role parameter
  getAllEvaluationData: async (role?: string): Promise<EvaluationFormData> => {
    try {
      const params = role ? { role } : {};
      const response = await api.get('/evaluation/12', { params });
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
      const response = await api.get(`/evaluation/12/role/${role}`, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${storedToken}`
        },
      });
      return response.data || mockEvaluationData;
    } catch (error) {
      console.error(`Error fetching evaluation data for role ${role}:`, error);
      // Fallback: thử với query parameter
      return evaluation12Service.getAllEvaluationData(role);
    }
  },

  // Get evaluation data by user role
  getEvaluationByGroup: async (groupName: string): Promise<any> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      
      const response = await api.post(`/evaluation/12/submitted`, 
        { group: groupName }, // Gửi JSON object
        {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json' // Thêm content type
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching group evaluations:', error);
      // Nếu lỗi, trả về object có success: false
      return {
        success: false,
      };
    }
  },

  // Get evaluation section by index
  getEvaluationSection: async (sectionIndex: number, role?: string): Promise<EvaluationSection> => {
    try {
      const url = role
        ? `/evaluation/12/section/${sectionIndex}?role=${role}`
        : `/evaluation/12/section/${sectionIndex}`;

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
        ? `/evaluation/12/section/${sectionIndex}/item/${itemId}?role=${role}`
        : `/evaluation/12/section/${sectionIndex}/item/${itemId}`;

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
      principalScore?: number;
      subItemScores?: { [key: string]: number };
    },
    role?: string
  ): Promise<EvaluationItem> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const url = role
        ? `/evaluation/12/section/${sectionIndex}/item/${itemId}/scores?role=${role}`
        : `/evaluation/12/section/${sectionIndex}/item/${itemId}/scores`;

      const response = await api.put(url, scores, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        },
      });
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
    scores: { selfScore: number; principalScore?: number },
    role?: string
  ): Promise<EvaluationItem> => {
    try {
      const url = role
        ? `/evaluation/12/section/${sectionIndex}/item/${itemId}/selection?role=${role}`
        : `/evaluation/12/section/${sectionIndex}/item/${itemId}/selection`;

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
    scores: { selfScore: number; principalScore?: number },
    role?: string
  ): Promise<EvaluationItem> => {
    try {
      const url = role
        ? `/evaluation/12/section/${sectionIndex}/item/${itemId}/content/${contentIndex}/scores?role=${role}`
        : `/evaluation/12/section/${sectionIndex}/item/${itemId}/content/${contentIndex}/scores`;

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
        ? `/evaluation/12/section/${sectionIndex}/item/${itemId}/evidence?role=${role}`
        : `/evaluation/12/section/${sectionIndex}/item/${itemId}/evidence`;

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
        ? `/evaluation/12/section/${sectionIndex}/item/${itemId}/evidence/${fileIndex}?role=${role}`
        : `/evaluation/12/section/${sectionIndex}/item/${itemId}/evidence/${fileIndex}`;

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
        `/evaluation/12/section/${sectionIndex}/item/${itemId}/justification`,
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
      const response = await api.post('/evaluation/12/submit', formData);
      return response.data;
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      throw error;
    }
  },

  saveEvaluationAsJSON: async (data: any) => {
    const storedToken = localStorage.getItem('authToken');
    const response = await api.post('/evaluation/12/save-json', data, {
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
      const response = await api.get(`/evaluation/12/download/${fileName}`, {
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
      const response = await api.post('/evaluation/12/save-draft', data, {
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
      const response = await api.get('/evaluation/12/check-draft', {
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
      const response = await api.delete('/evaluation/12/delete-draft', {
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

  // Thêm vào evaluation12Service.ts - chỉ cần thêm các hàm này

  addActivity: async (
    sectionIndex: number,
    itemId: string,
    activity: any,
    role?: string
  ): Promise<any> => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const url = role
        ? `/evaluation/12/section/${sectionIndex}/item/${itemId}/activities?role=${role}`
        : `/evaluation/12/section/${sectionIndex}/item/${itemId}/activities`;

      const response = await api.post(url, { activity }, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  },

  // Các hàm khác sử dụng các hàm hiện có với itemId đặc biệt cho activities
  updateActivityJustification: async (
    sectionIndex: number,
    itemId: string,
    activityIndex: number,
    justification: string,
    role?: string
  ): Promise<any> => {
    // Sử dụng updateJustification với itemId đặc biệt cho activity
    const activityItemId = `${itemId}_activity_${activityIndex}`;
    return evaluation12Service.updateJustification(sectionIndex, activityItemId, justification, role);
  },

  updateActivityScore: async (
    sectionIndex: number,
    itemId: string,
    activityIndex: number,
    scoreType: 'selfScore' | 'principalScore' | 'hieuTruongScore',
    scoreValue: number,
    role?: string
  ): Promise<any> => {
    // Sử dụng updateEvaluationScores với itemId đặc biệt cho activity
    const activityItemId = `${itemId}_activity_${activityIndex}`;
    const scores = { [scoreType]: scoreValue };
    return evaluation12Service.updateEvaluationScores(sectionIndex, activityItemId, scores, role);
  },

  uploadActivityEvidence: async (
    sectionIndex: number,
    itemId: string,
    activityIndex: number,
    files: File[],
    role?: string
  ): Promise<any> => {
    // Sử dụng uploadEvidence với itemId đặc biệt cho activity
    const activityItemId = `${itemId}_activity_${activityIndex}`;
    return evaluation12Service.uploadEvidence(sectionIndex, activityItemId, files, role);
  },

  removeActivityEvidence: async (
    sectionIndex: number,
    itemId: string,
    activityIndex: number,
    fileIndex: number,
    role?: string
  ): Promise<any> => {
    // Sử dụng deleteEvidence với itemId đặc biệt cho activity
    const activityItemId = `${itemId}_activity_${activityIndex}`;
    return evaluation12Service.deleteEvidence(sectionIndex, activityItemId, fileIndex, role);
  },

  saveReviewerEvaluation: async (data: any) => {
    const storedToken = localStorage.getItem('authToken');
    try {
      const response = await api.post('/evaluation/12/save-reviewer', data, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error saving reviewer evaluation:', error);
      throw error;
    }
  },
  
  // Thêm hàm lấy dữ liệu chấm điểm đã lưu
  getReviewerEvaluation: async (groupName: string, reviewerRole: string) => {
    const storedToken = localStorage.getItem('authToken');
    try {
      const response = await api.get(`/evaluation/12/reviewer/${groupName}/${reviewerRole}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reviewer evaluation:', error);
      throw error;
    }
  },

  // Thêm hàm kiểm tra xem reviewer đã chấm điểm chưa
  checkReviewerSubmitted: async (groupName: string, reviewerRole: string) => {
    const storedToken = localStorage.getItem('authToken');
    try {
      const response = await api.get(`/evaluation/12/check-reviewer/${groupName}/${reviewerRole}`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error checking reviewer submission:', error);
      throw error;
    }
  },


};