import type { StackProps } from '@mui/material/Stack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function NavUpgrade({ sx, ...other }: StackProps) {
  return (
    <Box
      sx={[
        {
          mb: 4,
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Typography
        variant="body1"
        sx={[
          (theme) => ({
            background: `linear-gradient(to right, ${theme.vars.palette.secondary.main}, ${theme.vars.palette.warning.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            color: 'transparent',
          }),
        ]}
      >
        Chất lượng - Sáng tạo - Nhân văn
      </Typography>

      <Box
        component="img"
        alt="Minimal dashboard"
        src="/assets/illustrations/illustration-dashboard.webp"
        sx={{ width: 200, my: 2 }}
      />

    </Box>
  );
}
