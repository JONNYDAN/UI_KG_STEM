import type { BoxProps } from '@mui/material/Box';
import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import ListItemText from '@mui/material/ListItemText';

import { fToNow } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: {
    id: string;
    title: string;
    coverUrl: string;
    description: string;
    postedAt: string | number | null;
  }[];
};

export function AnalyticsGuide({ title, subheader, list, sx, ...other }: Props) {
  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 1 }} />

      <Box sx={{ px: 3, pt: 1, pb: 2 }}>
        <Typography variant="h4" color="primary" gutterBottom>
          KÍNH CHÀO QUÝ THẦY CÔ!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Chào mừng Thầy/ Cô đến với Hệ thống đánh giá, xếp loại chất lượng viên chức. Dưới đây là
          hướng dẫn sử dụng hệ thống.
        </Typography>
      </Box>

      <Scrollbar sx={{ minHeight: 420 }}>
        <Box sx={{ minWidth: 640 }}>
          {list.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </Box>
      </Scrollbar>

      <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px dashed', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          💡 Cần hỗ trợ thêm? Vui lòng liên hệ Phòng Tổ chức - Hành chính
        </Typography>
        <Button
          size="small"
          color="primary"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
        >
          Liên hệ hỗ trợ
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

type ItemProps = BoxProps & {
  item: Props['list'][number];
};

function Item({ item, sx, ...other }: ItemProps) {
  const getStepIcon = (id: string) => {
    const iconMap: { [key: string]: string } = {
      '1': '📋',
      '2': '👤',
      '3': '✅',
      '4': '📊',
      '5': '💾',
      '6': '👀',
    };
    return iconMap[id] || '📌';
  };

  return (
    <Box
      sx={[
        (theme) => ({
          py: 2,
          px: 3,
          gap: 2,
          display: 'flex',
          alignItems: 'flex-start',
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Avatar
        variant="rounded"
        alt={item.title}
        src={item.coverUrl}
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          backgroundColor: 'primary.lighter',
          color: 'primary.dark',
          fontSize: '1.5rem',
          fontWeight: 'bold',
        }}
      >
        {getStepIcon(item.id)}
      </Avatar>

      <ListItemText
        primary={
          <Typography variant="subtitle1" color="text.primary" fontWeight="medium">
            {item.title}
          </Typography>
        }
        secondary={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {item.description}
          </Typography>
        }
        slotProps={{
          primary: { noWrap: true },
          secondary: {
            noWrap: true,
            sx: { mt: 0.5 },
          },
        }}
      />

      {/* <Box sx={{ flexShrink: 0, typography: 'caption', color: 'text.disabled', mt: 0.5 }}>
        {fToNow(item.postedAt)}
      </Box> */}
    </Box>
  );
}
