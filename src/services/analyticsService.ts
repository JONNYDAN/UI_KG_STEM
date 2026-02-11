import api from './api';

export interface UnitStats {
  id: string;
  khoi: string;
  name: string;
  selfScore: number;
  thamDinhScore: number;
  hieuTruongScore: number;
  fileName?: string;
  staffCode?: string;
}

export interface StatsOverview {
  totalUnits: number;
  avgSelfScore: number;
  avgThamDinhScore: number;
  avgHieuTruongScore: number;
}

export interface AnalyticsResponse {
  success: boolean;
  unitsData: UnitStats[];
  statsOverview: StatsOverview;
  totalFilesProcessed?: number;
  message?: string;
}

export const getAnalyticsData = async (): Promise<AnalyticsResponse> => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Không tìm thấy token đăng nhập');
    }

    const response = await api.get('/analytics/overview', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching analytics data:', error);
    
    // Trả về lỗi dạng chuẩn
    return {
      success: false,
      unitsData: [],
      statsOverview: {
        totalUnits: 0,
        avgSelfScore: 0,
        avgThamDinhScore: 0,
        avgHieuTruongScore: 0
      },
      message: error.response?.data?.message || error.message || 'Lỗi khi tải dữ liệu thống kê'
    };
  }
};

export const getStatsOverview = async (): Promise<{
  success: boolean;
  statsOverview: StatsOverview;
  processedUnits?: number;
  message?: string;
}> => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Không tìm thấy token đăng nhập');
    }

    const response = await api.get('/analytics/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error fetching stats overview:', error);
    
    return {
      success: false,
      statsOverview: {
        totalUnits: 0,
        avgSelfScore: 0,
        avgThamDinhScore: 0,
        avgHieuTruongScore: 0
      },
      message: error.response?.data?.message || error.message || 'Lỗi khi tải thống kê tổng quan'
    };
  }
};

// Hàm lấy dữ liệu mẫu khi API không hoạt động
export const getSampleAnalyticsData = (): AnalyticsResponse => ({
  success: true,
  unitsData: [
    {
      id: '1',
      khoi: 'Giảng dạy',
      name: 'Khoa Toán - Tin học',
      selfScore: 92,
      thamDinhScore: 0,
      hieuTruongScore: 0,
      staffCode: 'BOT001'
    },
    {
      id: '2',
      khoi: 'Giảng dạy',
      name: 'Khoa Hóa học',
      selfScore: 90,
      thamDinhScore: 0,
      hieuTruongScore: 0,
      staffCode: 'BOT003'
    },
    {
      id: '3',
      khoi: 'Giảng dạy',
      name: 'Khoa Lịch sử',
      selfScore: 86,
      thamDinhScore: 0,
      hieuTruongScore: 0,
      staffCode: 'BOT007'
    },
    {
      id: '4',
      khoi: 'Giảng dạy',
      name: 'Khoa Khoa học Giáo dục',
      selfScore: 86,
      thamDinhScore: 0,
      hieuTruongScore: 0,
      staffCode: 'BOT009'
    },
    {
      id: '5',
      khoi: 'Giảng dạy',
      name: 'Khoa Địa lý',
      selfScore: 88,
      thamDinhScore: 0,
      hieuTruongScore: 0,
      staffCode: 'BOT008'
    },
  ],
  statsOverview: {
    totalUnits: 5,
    avgSelfScore: 88.4,
    avgThamDinhScore: 0,
    avgHieuTruongScore: 0
  },
  totalFilesProcessed: 5
});

export const exportAnalyticsToExcel = async (): Promise<Blob> => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Không tìm thấy token đăng nhập');
    }

    const response = await api.get('/analytics/export-excel', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob' 
    });

    return response.data;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};