import { CONFIG } from 'src/config-global';

import { PortalView } from 'src/sections/portal/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Cổng thông tin - ${CONFIG.appName}`}</title>

      <PortalView />
    </>
  );
}
