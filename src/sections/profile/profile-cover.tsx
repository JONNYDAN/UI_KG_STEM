import { Box, IconButton } from '@mui/material';

import { Iconify } from 'src/components/iconify';

type Props = {
  coverUrl?: string;
  isOwnProfile?: boolean;
};

export function ProfileCover({ coverUrl, isOwnProfile }: Props) {
  return (
    <Box
      sx={{
        height: 200,
        position: 'relative',
        background: coverUrl 
          ? `url(${coverUrl}) center/cover`
          : (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        borderRadius: 2,
        overflow: 'hidden',
        mb: 4,
      }}
    >
      {isOwnProfile && (
        <IconButton
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <Iconify icon="custom:menu-duotone" />
        </IconButton>
      )}
    </Box>
  );
}