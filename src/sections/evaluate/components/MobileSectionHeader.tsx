import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';

export const MobileSectionHeader = ({ title }: { title: string }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      color: theme.palette.primary.contrastText,
      padding: 2,
      borderRadius: 1,
      marginBottom: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}>
      <Box sx={{
        width: 4,
        height: 24,
        backgroundColor: theme.palette.secondary.main,
        borderRadius: 2,
      }} />
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
  );
};