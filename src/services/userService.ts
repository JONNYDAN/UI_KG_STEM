import api from './api';

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  try {
    const storedToken = localStorage.getItem('authToken');
    const res = await api.post(
      '/auth/12/change-password',
      {
        oldPassword,
        newPassword,
        confirmPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      }
    );
    return res.data;
  } catch (err: any) {
    return err.response?.data || { success: false, message: 'Lỗi không xác định' };
  }
};
