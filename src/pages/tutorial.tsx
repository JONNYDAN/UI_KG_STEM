import { CONFIG } from 'src/config-global';

import { OverviewTutorialView as OverviewTutorialView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Dashboard - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Phiếu đánh giá, xếp loại chất lượng viên chức HCMUE"
      />
      <meta name="keywords" content="react,material,kit,application,dashboard,admin,template" />

      <OverviewTutorialView />
    </>
  );
}
