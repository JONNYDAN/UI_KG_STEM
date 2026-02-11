import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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
}

export function EvaluateFormHeader({ 
  headerData,
  titleRole, 
  onHeaderDataChange, 
  readOnly = false 
}: EvaluateFormHeaderProps) {
  const [localHeaderData, setLocalHeaderData] = useState<HeaderField[]>(headerData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setLocalHeaderData(headerData);
  }, [headerData]);

  const handleFieldChange = (index: number, value: string) => {
    const updatedData = localHeaderData.map((field, i) => 
      i === index ? { ...field, answer: value } : field
    );
    
    setLocalHeaderData(updatedData);
    
    if (onHeaderDataChange) {
      onHeaderDataChange(updatedData);
    }
  };

  // Xác định width dựa trên breakpoint
  const getInputWidth = () => {
    if (isMobile) return '100%'; // Full width trên mobile
    if (isTablet) return '400px'; // Tablet
    return '500px'; // Desktop
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: { xs: 2, sm: 3 },
        mb: 3,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Tiêu đề chính */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          PHIẾU ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG VIÊN CHỨC
        </Typography>
        
        <Typography 
          variant="subtitle1" 
          gutterBottom 
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {titleRole}
        </Typography>

        {/* Năm */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              display: 'inline',
              fontWeight: 'bold',
              mr: 1
            }}
          >
            Năm:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              display: 'inline',
              textDecoration: 'underline'
            }}
          >
            {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>

      {/* Form fields layout dọc */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {localHeaderData.map((field, index) => (
          <Box 
            key={index}
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1, sm: 3 }
            }}
          >
            {/* Label */}
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 'bold',
                minWidth: { xs: 'auto', sm: '200px' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {field.title}
            </Typography>
            
            {/* Input field */}
            <TextField
              variant="outlined"
              size="small"
              value={field.answer}
              onChange={(e) => handleFieldChange(index, e.target.value)}
              disabled={readOnly}
              placeholder={`Nhập ${field.title.toLowerCase()}`}
              sx={{
                width: getInputWidth(),
                '& .MuiOutlinedInput-root': {
                  backgroundColor: readOnly ? 'action.hover' : 'background.paper',
                  '&:hover': {
                    backgroundColor: readOnly ? 'action.hover' : 'background.paper',
                  }
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
              InputProps={{
                sx: {
                  borderRadius: 1
                }
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}