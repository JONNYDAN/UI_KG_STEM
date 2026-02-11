import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  appVersion: string;
};

export const CONFIG: ConfigValue = {
  appName: 'Phiếu đánh giá, xếp loại chất lượng viên chức HCMUE',
  appVersion: packageJson.version,
};
