// portal/options.tsx
import type { ReactNode } from 'react';

export type PortalOption = {
  key:
    | 'admission'
    | 'process'
    | 'exam'
    | 'career'
    | 'special'
    | 'certificate';
  label: string;
  image?: string;
  topIcon?: ReactNode;
};

export const OPTIONS: PortalOption[] = [
  {
    key: 'admission',
    label: 'THÔNG TIN TUYỂN SINH',
    topIcon: <img src="/portal1_logo.png" alt="admission" width={70} height={70} />,
  },
  {
    key: 'process',
    label: 'QUY TRÌNH TUYỂN SINH',
    topIcon: <img src="/portal2_logo.png" alt="admission" width={70} height={70} />,
  },
    {
    key: 'exam',
   label: 'XÉT ĐIỂM THI THPT',
    topIcon: <img src="/portal3_logo.png" alt="admission" width={70} height={70} />,
  },
  {
    key: 'career',
    label: 'HƯỚNG NGHIỆP',
    topIcon: <img src="/portal4_logo.png" alt="admission" width={70} height={70} />,
  },
  {
    key: 'special',
    label: 'KỲ THI ĐGNL CHUYÊN BIỆT',
    topIcon: <img src="/portal5_logo.png" alt="admission" width={70} height={70} />,
  },
   {
    key: 'certificate',
    label: 'CHỨNG CHỈ NGOẠI NGỮ',
    topIcon: <img src="/portal6_logo.png" alt="admission" width={70} height={70} />,
  },
];
