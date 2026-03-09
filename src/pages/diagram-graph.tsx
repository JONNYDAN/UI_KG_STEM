import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DiagramGraphView } from 'src/sections/diagram-graph/view';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{`Diagram Graph - ${CONFIG.appName}`}</title>
      </Helmet>

      <DiagramGraphView />
    </>
  );
}
