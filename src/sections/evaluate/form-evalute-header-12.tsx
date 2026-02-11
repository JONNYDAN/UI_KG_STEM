import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

interface HeaderField {
  title: string;
  answer: string;
}

interface EvaluateFormHeaderProps {
  headerData: HeaderField[];
  titleRole: string;
  onHeaderDataChange?: (headerData: HeaderField[]) => void;
  readOnly?: boolean;
  userGroup?: string[];
  isReviewData?: boolean; // Thêm prop mới để xác định có phải reviewData không
}

export function EvaluateFormHeader12({ 
  headerData,
  titleRole, 
  onHeaderDataChange, 
  readOnly = false,
  userGroup = [],
  isReviewData = false // Mặc định là false
}: EvaluateFormHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallDesktop = useMediaQuery(theme.breakpoints.down('lg'));

  // Hàm chuyển đổi group name thành tên hiển thị
  const getDisplayGroupName = (groups: string[]): string => {
    if (groups.length === 0) return 'Chưa có thông tin đơn vị';
    const group = groups[0];
    const groupNameMap: { [key: string]: string } = {
      'Khoa_khoa_hoc_giao_duc': 'Khoa học Giáo dục',
      'Khoa_tam_ly_hoc': 'Khoa Tâm lý học',
      'Khoa_giao_duc_mam_non': 'Khoa Giáo dục Mầm non',
      'Khoa_giao_duc_tieu_hoc': 'Khoa Giáo dục Tiểu học',
      'Khoa_giao_duc_dac_biet': 'Khoa Giáo dục Đặc biệt',
      'Truong_thth': 'Trường Trung Học Thực Hành',
      'Trung_tam_tkt_thuan_an': 'Trung tâm TKT Thuận An',
      'Khoa_toan_tin_hoc': 'Khoa Toán - Tin học',
      'Khoa_cntt': 'Khoa Công nghệ Thông Tin',
      'Khoa_gdqp': 'Khoa Giáo dục Quốc phòng',
      'Khoa_gdct': 'Khoa Giáo Dục Chính Trị',
      'Khoa_gdtc': 'Khoa Giáo Dục Thể Chất',
      'Phan_hieu_long_an': 'Phân hiệu Long An',
      'Khoa_tieng_anh': 'Khoa Tiếng Anh',
      'Khoa_tieng_phap': 'Khoa Tiếng Pháp',
      'Khoa_tieng_nhat': 'Khoa Tiếng Nhật',
      'Khoa_tieng_han': 'Khoa Tiếng Hàn',
      'Khoa_tieng_trung': 'Khoa Tiếng Trung',
      'Khoa_tieng_nga': 'Khoa Tiếng Nga',
      'To_giao_duc_nu_cong': 'Tổ Giáo dục Nữ công',
      'Phgl': 'Phân Hiệu Gia Lai',
      'Khoa_vat_ly': 'Khoa Vật lý',
      'Khoa_hoa_hoc': 'Khoa Hóa học',
      'Khoa_sinh_hoc': 'Khoa Sinh học',
      'Khoa_dia_ly': 'Khoa Địa lý',
      'Khoa_lich_su': 'Khoa Lịch sử',
      'Khoa_ngu_van': 'Khoa Ngữ văn',
      'Phong_tc_hc': 'Phòng Tổ chức - Hành chính',
      'Phong_kh_tc': 'Phòng Kế hoạch - Tài chính',
      'Phong_dao_tao': 'Phòng Đào tạo',
      'Nha_xuat_ban': 'Nhà xuất bản',
      'Vien_ncsp': 'Viện Nghiên Cứu Giáo Dục',
      'Trung_tam_ptknsp': 'Trung tâm Phát triển kỹ năng sư phạm',
      'Phong_qttb': 'Phòng Quản trị Thiết Bị',
      'Phong_cntt': 'Phòng Công Nghệ Thông Tin',
      'Phong_khao_thi_dbcl': 'Phòng Khảo thí và ĐBCL',
      'Tram_y_te': 'Trạm Y tế',
      'Trung_tam_tin_hoc': 'Trung tâm Tin học',
      'Phong_htqt': 'Phòng HTQT',
      'Phong_sdh': 'Phòng SDH',
      'Trung_tam_ngoai_ngu': 'Trung tâm Ngoại Ngữ',
      'Trung_tam_htsv_ptkn': 'TT HTSV&PTKN',
      'Phong_khcn_mt_tckh': 'Phòng KHCN&MT-TCKH',
      'Phong_ctct_hssv': 'Phòng CTCT&HSSV',
      'Phong_thanh_tra_dao_tao': 'Thanh tra Đào tạo',
      'Ky_tuc_xa': 'Ký túc xá',
      'Thu_vien': 'Thư viện'
    };

    return groupNameMap[group] || group;
  };

  // Tự động update header với group name - CHỈ KHI KHÔNG PHẢI REVIEW DATA
  useEffect(() => {
    // Nếu là reviewData thì không tự động điền
    if (isReviewData || !userGroup.length || !onHeaderDataChange) {
      return;
    }
    
    const displayGroupName = getDisplayGroupName(userGroup);
    
    const donViField = headerData.find(field => field.title === 'Đơn vị:');
    if (donViField && donViField.answer === displayGroupName) {
      return; 
    }
    
    const updatedHeader = headerData.map(field => 
      field.title === 'Đơn vị:' 
        ? { ...field, answer: displayGroupName }
        : field
    );
    onHeaderDataChange(updatedHeader);
  }, [userGroup, onHeaderDataChange, headerData, isReviewData]);

  // Hàm lấy giá trị hiển thị cho trường "Đơn vị:"
  const getUnitValue = (): string => {
    // Nếu là reviewData, lấy từ headerData
    if (isReviewData) {
      const donViField = headerData.find(field => field.title === 'Đơn vị:');
      return donViField?.answer || '';
    }
    
    // Nếu không phải reviewData, sử dụng userGroup
    return getDisplayGroupName(userGroup);
  };

  if (isMobile) {
    // Mobile: Hiển thị dọc
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: 1.5,
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }}
      >
        {/* Tiêu đề */}
        <Box sx={{ mb: 1.5, textAlign: 'center' }}>
          <Typography 
            variant="subtitle2" 
            component="div"
            sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              mb: 0.5
            }}
          >
            PHIẾU CHẤM ĐIỂM ĐÁNH GIÁ
          </Typography>
          <Typography 
            variant="caption" 
            component="div"
            sx={{ 
              color: 'text.secondary',
              mb: 0.25
            }}
          >
            {titleRole}
          </Typography>
          <Typography 
            variant="caption" 
            component="div"
            sx={{ 
              color: 'text.secondary'
            }}
          >
            Năm: <span style={{ textDecoration: 'underline' }}>{new Date().getFullYear()}</span>
          </Typography>
        </Box>
        
        {/* Các trường thông tin */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {headerData.map((field, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold',
                  minWidth: '70px',
                  flexShrink: 0
                }}
              >
                {field.title}
              </Typography>
              
              <TextField
                variant="outlined"
                size="small"
                value={field.title === 'Đơn vị:' ? getUnitValue() : field.answer}
                disabled
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'action.hover',
                    height: '32px'
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.875rem',
                    color: 'text.primary',
                    py: 0.5,
                    px: 1
                  }
                }}
                InputProps={{
                  sx: { borderRadius: 0.5 },
                  readOnly: true
                }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  // Tablet và Desktop
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2,
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: 'background.paper',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isTablet ? 'column' : 'row',
        gap: isTablet ? 1.5 : 2,
        alignItems: isTablet ? 'flex-start' : 'center'
      }}>
        {/* Tiêu đề bên trái */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          flexShrink: 0,
          minWidth: isTablet ? '100%' : '280px'
        }}>
          <Typography 
            variant={isTablet ? "subtitle2" : "subtitle1"}
            sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              lineHeight: 1.2,
              mb: 0.5
            }}
          >
            PHIẾU ĐÁNH GIÁ XẾP LOẠI, CHẤT LƯỢNG ĐƠN VỊ
          </Typography>
          <Typography 
            variant="body2"
            sx={{ 
              color: 'text.secondary',
              lineHeight: 1.2,
              mb: 0.5
            }}
          >
            {titleRole}
          </Typography>
          <Typography 
            variant="body2"
            sx={{ 
              color: 'text.secondary'
            }}
          >
            Năm: <span style={{ textDecoration: 'underline' }}>{new Date().getFullYear()}</span>
          </Typography>
        </Box>

        {/* Các trường thông tin bên phải */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isTablet ? 'column' : 'row',
          gap: isTablet ? 1 : 2,
          flexWrap: isSmallDesktop ? 'wrap' : 'nowrap',
          alignItems: isTablet ? 'flex-start' : 'center',
          flexGrow: 1,
          width: isTablet ? '100%' : 'auto'
        }}>
          {headerData.map((field, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
                minWidth: isTablet ? '100%' : 'auto'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  minWidth: isTablet ? '80px' : 'auto'
                }}
              >
                {field.title}
              </Typography>
              
              <TextField
                variant="outlined"
                size="small"
                value={field.title === 'Đơn vị:' ? getUnitValue() : field.answer}
                disabled
                sx={{
                  width: isTablet ? '100%' : (isSmallDesktop ? '180px' : '220px'),
                  flexShrink: 1,
                  minWidth: isTablet ? 'auto' : '150px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'action.hover',
                    height: '36px'
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.875rem',
                    color: 'text.primary',
                    py: 0.75,
                    px: 1
                  }
                }}
                InputProps={{
                  sx: { borderRadius: 0.75 },
                  readOnly: true
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}