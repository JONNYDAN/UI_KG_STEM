import { Typography } from '@mui/material';

import { CONFIG } from 'src/config-global';
import { useAuth } from 'src/contexts/AuthContext';

import { ChangePasswordView } from 'src/sections/profile/view';

export default function Page() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Typography variant="h6" align="center" mt={5}>
        Vui lòng đăng nhập để đổi mật khẩu
      </Typography>
    );
  }

  return (
    <>
      <title>{`Đổi mật khẩu - ${CONFIG.appName}`}</title>
      <ChangePasswordView user={user} />
    </>
  );
}
