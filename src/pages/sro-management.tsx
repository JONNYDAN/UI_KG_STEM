import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { SROManagementView } from 'src/sections/sro-management/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Triple Management - ${CONFIG.appName}`}</title>
      </Helmet>

      <SROManagementView />
    </>
  );
}
