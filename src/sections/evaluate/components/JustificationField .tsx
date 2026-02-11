import React, { useState, useEffect, useRef } from 'react';

import { 
  TextField,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

interface JustificationFieldProps {
  value: string;
  onBlur: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  size?: 'small' | 'medium';
  maxRows?: number;
}

export const JustificationField: React.FC<JustificationFieldProps> = ({
  value: initialValue,
  onBlur,
  placeholder = "Nhập thuyết minh...",
  rows = 2,
  disabled = false,
  size = 'small',
  maxRows = 10
}) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentRows, setCurrentRows] = useState(rows);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Cập nhật khi prop thay đổi từ bên ngoài
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Tự động điều chỉnh số dòng dựa trên nội dung
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const lineHeight = 20; // Giả định line-height mặc định
      const padding = size === 'small' ? 16 : 20; // Padding của TextField
      
      // Tính số dòng thực tế
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const calculatedRows = Math.max(
        rows,
        Math.min(
          Math.floor((scrollHeight - padding) / lineHeight),
          maxRows
        )
      );
      
      setCurrentRows(calculatedRows);
    }
  }, [localValue, rows, maxRows, size]);

  const handleBlur = () => {
    if (onBlur && localValue !== initialValue) {
      onBlur(localValue);
    }
  };

  const handleExpandToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setCurrentRows(newExpanded ? maxRows : rows);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl + Enter để toggle expand/collapse
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleExpandToggle();
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        multiline
        rows={currentRows}
        inputRef={textareaRef}
        value={localValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setLocalValue(newValue);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        fullWidth
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& textarea': {
              resize: 'vertical',
              minHeight: '40px',
              maxHeight: `${maxRows * 24}px`,
              transition: 'height 0.2s ease',
            },
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              }
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
          },
          '&:hover .resize-indicator': {
            opacity: 1,
          }
        }}
        size={size}
        InputProps={{
          endAdornment: (
            <Tooltip title={isExpanded ? "Thu nhỏ (Ctrl+Enter)" : "Mở rộng (Ctrl+Enter)"}>
              <IconButton
                size="small"
                onClick={handleExpandToggle}
                disabled={disabled}
                sx={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  opacity: 0.6,
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'action.hover'
                  },
                  transition: 'opacity 0.2s',
                  zIndex: 1
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          ),
        }}
      />
      
      {/* Resize indicator ở góc dưới bên phải */}
      <Box
        className="resize-indicator"
        sx={{
          position: 'absolute',
          right: 6,
          bottom: 6,
          width: 12,
          height: 12,
          borderRight: '2px solid',
          borderBottom: '2px solid',
          borderColor: 'action.active',
          opacity: 0.3,
          pointerEvents: 'none',
          transition: 'opacity 0.2s',
        }}
      />
    </Box>
  );
};