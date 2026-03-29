import { CONFIG } from 'src/config-global';

import { StemQueryView } from 'src/sections/stem-query/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Truy vấn STEM - ${CONFIG.appName}`}</title>
      <StemQueryView />
    </>
  );
}
