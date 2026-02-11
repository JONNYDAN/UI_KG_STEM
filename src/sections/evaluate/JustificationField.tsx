import React, { useState, useRef, useEffect } from 'react';

import { TextField, Box } from '@mui/material';

interface JustificationFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  delay?: number;
  immediateUpdate?: boolean; // Thêm prop mới cho các trường cần update ngay lập tức
}

export const JustificationField: React.FC<JustificationFieldProps> = React.memo(({
  value,
  onChange,
  disabled = false,
  placeholder = "Hãy nhập nội dung thuyết minh...",
  rows = 2,
  delay = 1000,
  immediateUpdate = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  
  // Sync localValue with prop value when it changes externally
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Cleanup
  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (immediateUpdate) {
      // Nếu cần update ngay lập tức (cho radio buttons, selectors)
      isTypingRef.current = false;
      if (newValue !== value) {
        onChange(newValue);
      }
    } else {
      // Debounce cho text input
      isTypingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        if (newValue !== value) {
          onChange(newValue);
        }
      }, delay);
    }
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    isTypingRef.current = false;
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isTypingRef.current = false;
      if (localValue !== value) {
        onChange(localValue);
      }
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        multiline
        rows={rows}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        fullWidth
        disabled={disabled}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& textarea': {
              resize: 'vertical',
              minHeight: '50px',
            }
          },
        }}
      />
    </Box>
  );
});