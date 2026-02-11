import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import useMediaQuery from '@mui/material/useMediaQuery';
import Select, { SelectChangeEvent } from '@mui/material/Select';

interface FooterField {
  title: string;
  answer: string;
  hasType?: string;
  options?: string[];
}

interface EvaluateFormFooterProps {
  footerData: FooterField[];
  onFooterDataChange?: (footerData: FooterField[]) => void;
  readOnly?: boolean;
}

export function EvaluateFormFooter12({ 
  footerData, 
  onFooterDataChange, 
  readOnly = false 
}: EvaluateFormFooterProps) {
  const [localFooterData, setLocalFooterData] = useState<FooterField[]>(footerData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setLocalFooterData(footerData);
  }, [footerData]);

  const handleFieldChange = (index: number, value: string) => {
    const updatedData = localFooterData.map((field, i) => 
      i === index ? { ...field, answer: value } : field
    );
    
    setLocalFooterData(updatedData);
    
    if (onFooterDataChange) {
      onFooterDataChange(updatedData);
    }
  };

  const handleSelectChange = (index: number, event: SelectChangeEvent) => {
    handleFieldChange(index, event.target.value);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: { xs: 2, sm: 3 },
        mt: 3,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Tiêu đề section */}
      <Typography 
        variant="h6" 
        component="h3" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1,
          fontSize: { xs: '1.125rem', sm: '1.25rem' }
        }}
      >
        II. TỰ NHẬN XÉT, XẾP LOẠI CHẤT LƯỢNG
      </Typography>

      {/* Form fields */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        mt: 2
      }}>
        {localFooterData.map((field, index) => (
          <Box key={index}>
            {/* Label */}
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {field.title}
            </Typography>
            
            {/* Select field - Single choice hoặc textarea */}
            {field.hasType === 'single-choice' && field.options ? (
              <FormControl 
                fullWidth 
                disabled={readOnly} 
                sx={{ 
                  maxWidth: { xs: '100%', sm: '500px' },
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              >
                <InputLabel id={`select-label-${index}`}>Chọn một tùy chọn</InputLabel>
                <Select
                  labelId={`select-label-${index}`}
                  value={field.answer}
                  label="Chọn một tùy chọn"
                  onChange={(e) => handleSelectChange(index, e)}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: readOnly ? 'action.hover' : 'background.paper',
                  }}
                >
                  {field.options.map((option, optionIndex) => (
                    <MenuItem 
                      key={optionIndex} 
                      value={option}
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={12}
                variant="outlined"
                value={field.answer}
                onChange={(e) => handleFieldChange(index, e.target.value)}
                disabled={readOnly}
                placeholder="Nhập nội dung tự nhận xét..."
                sx={{
                  maxWidth: { xs: '100%', sm: '500px' },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: readOnly ? 'action.hover' : 'background.paper',
                    '&:hover': {
                      backgroundColor: readOnly ? 'action.hover' : 'background.paper',
                    },
                    '& textarea': {
                      resize: 'vertical',
                      minHeight: '50px',
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }
                }}
                InputProps={{
                  sx: {
                    borderRadius: 1
                  }
                }}
              />
            )}
          </Box>
        ))}
      </Box>

    </Paper>
  );
}