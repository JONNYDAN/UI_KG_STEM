import { CONFIG } from 'src/config-global';

import { CreateEvaluateView } from 'src/sections/evaluate/view';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Tạo form đánh giá chất lượng công chức - ${CONFIG.appName}`}</title>

      <CreateEvaluateView />
    </>
  );
}
