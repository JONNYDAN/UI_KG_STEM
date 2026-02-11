import * as React from 'react';

import Box from '@mui/material/Box';

type PortalContainerProps = {
  children: React.ReactNode;
  maxWidth?: number | string;
  centerY?: boolean;
};

export function PortalContainer({
  children,
  maxWidth = 960,
  centerY = false,
}: PortalContainerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems:  'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth,          
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: 3,
           minHeight: '500px',
          p: 3,
          
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
