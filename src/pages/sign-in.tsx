import { CONFIG } from 'src/config-global';

import { SignInView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Đăng nhập - ${CONFIG.appName}`}</title>

      <SignInView />
    </>
  );
}
