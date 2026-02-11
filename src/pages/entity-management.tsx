import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { EntityManagementView } from 'src/sections/entity-management/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Entity Management - ${CONFIG.appName}`}</title>
      </Helmet>

      <EntityManagementView />
    </>
  );
}
