import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { Evaluate12View } from 'src/sections/evaluate/view';

// ----------------------------------------------------------------------

interface EvaluatePageProps {
  formType?: '12A' | '12B';
}

export default function EvaluatePage({ formType = '12A' }: EvaluatePageProps) {
  const { group } = useParams();
  
  // console.log('EvaluatePage - Group from URL:', group);
  // console.log('EvaluatePage - FormType:', formType);

  return (
    <>
      <title>{`Đánh giá chất lượng công chức - ${CONFIG.appName}`}</title>
      <Evaluate12View formType={formType} currentGroup={group} />
    </>
  );
}