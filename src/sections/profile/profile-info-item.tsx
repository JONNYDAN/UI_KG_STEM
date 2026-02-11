import { Box, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  icon: string;
  label: string;
  value?: string;
};

export type IUserProfile = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
  title?: string;
  phone?: string;
  location?: string;
  joinDate?: string;
  bio?: string;
  currentPosition?: string;
  company?: string;
  skills?: string[];
  experience?: {
    position: string;
    company: string;
    period: string;
    description?: string;
  }[];
  education?: {
    degree: string;
    school: string;
    period: string;
    description?: string;
  }[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  verified?: boolean;
  cccdFront?: string;
  cccdBack?: string;
}

export function ProfileInfoItem({ icon, label, value }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Iconify icon={icon as any} width={20} sx={{ mr: 2, color: 'text.secondary' }} />
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2">
          {value || 'Not specified'}
        </Typography>
      </Box>
    </Box>
  );
}