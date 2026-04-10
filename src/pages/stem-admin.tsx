import { CONFIG } from 'src/config-global';

import { StemAdminView } from 'src/sections/stem-admin/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Quản trị STEM - ${CONFIG.appName}`}</title>
      <StemAdminView />
    </>
  );
}
