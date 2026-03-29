import { CONFIG } from 'src/config-global';

import { SignUpView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Thông tin tài khoản - ${CONFIG.appName}`}</title>

      <SignUpView />
    </>
  );
}
