import React from 'react';

import {
  TextField,
  Typography,
  Box,
  useTheme,
} from '@mui/material';

interface MobileScoreDisplayProps {
  label: string;
  value: number;
  maxValue: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'warning' | 'error' | 'info' | 'success';
}

export const MobileScoreDisplay: React.FC<MobileScoreDisplayProps> = ({
  label,
  value,
  maxValue,
  onChange,
  disabled = false,
  color = 'primary',
}) => {
  const theme = useTheme();
  
  const getColor = () => {
    switch (color) {
      case 'primary': return theme.palette.primary.main;
      case 'secondary': return theme.palette.secondary.main;
      case 'warning': return theme.palette.warning.main;
      default: return theme.palette.primary.main;
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {onChange && !disabled ? (
        <TextField
          type="number"
          size="small"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          inputProps={{
            min: 0,
            max: maxValue,
            style: { 
              textAlign: 'center',
              padding: '4px 8px',
              fontSize: '0.875rem',
              color: getColor(),
              fontWeight: 'bold'
            }
          }}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              height: 32,
            },
            '& input': {
              fontWeight: 'bold',
            }
          }}
        />
      ) : (
        <Box
          sx={{
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
            border: `1px solid ${disabled ? 'action.disabled' : 'divider'}`,
            borderRadius: 1,
            color: disabled ? 'text.disabled' : getColor(),
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          {value}
        </Box>
      )}
    </Box>
  );
};