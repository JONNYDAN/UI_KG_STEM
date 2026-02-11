import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';
import type { ChartOptions } from 'src/components/chart';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fNumber, fPercent, fShortenNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  color?: PaletteColorKey;
  icon: React.ReactNode;
  topIcon?: React.ReactNode;
};

export function CardPortal({
  sx,
  icon,
  title,
  topIcon,
  color = 'primary',
  ...other
}: Props) {
  const theme = useTheme();

  const chartColors = [theme.palette[color].dark];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    grid: {
      padding: {
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,
      },
    },
    tooltip: {
      y: { formatter: (value: number) => fNumber(value), title: { formatter: () => '' } },
    },
    markers: {
      strokeWidth: 0,
    },
  });


  return (
    <Card
  sx={[
    {
      p: 3,
      boxShadow: 'none',
      position: 'relative',
      color: `${color}.darker`,
      backgroundColor: 'common.white',
      backgroundImage: '/hcmue_white_bg.png',
      minHeight: 180,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      textAlign: 'center',             
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ]}
>

      {/* <Box sx={{ width: 48, height: 48, mb: 3 }}></Box> */}

      {/* {renderTrending()} */}

           {topIcon && (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      mb: 2, // spacing from title
    }}
  >
    {topIcon}
  </Box>
)}


      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 112 }}>
          <Box sx={{ mb: 1, tfontSize: '1.25rem', fontWeight: 700, }}>{title}</Box>
        </Box>

      </Box>

      <SvgColor
        src="/assets/background/shape-square.svg"
        
        sx={{
          top: 0,
          left: -20,
          width: 240,
          zIndex: -1,
          height: 240,
          opacity: 0.24,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />
    </Card>
  );
}
