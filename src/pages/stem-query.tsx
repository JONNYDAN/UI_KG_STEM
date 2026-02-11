import { CONFIG } from 'src/config-global';

import { StemQueryView } from 'src/sections/stem-query/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`STEM Query - ${CONFIG.appName}`}</title>
      <StemQueryView />
    </>
  );
}
