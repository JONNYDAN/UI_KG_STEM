import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { getQueryLogs } from 'src/services/stemQueryService';

const API_URL = import.meta.env.VITE_API_URL as string;

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

export function StemAdminView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getQueryLogs(50);
      setLogs(result.logs || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Không thể tải logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Card sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Quản lý truy vấn STEM</Typography>
          <Button variant="contained" onClick={loadLogs} disabled={loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Làm mới'}
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Lịch sử truy vấn
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {logs.length === 0 && !loading && (
          <Typography variant="body2">Chưa có dữ liệu truy vấn.</Typography>
        )}

        <List>
          {logs.map((log) => (
            <ListItem key={log._id} alignItems="flex-start" sx={{ mb: 2, display: 'block' }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  {log.type?.toUpperCase()} • {log.created_at || log.timestamp}
                </Typography>
                {log.query_text && (
                  <Typography variant="body2">Text: {log.query_text}</Typography>
                )}
                {log.image_url && (
                  <Box
                    component="img"
                    src={toAbsoluteUrl(log.image_url)}
                    alt={log._id}
                    sx={{ width: 240, borderRadius: 1, border: '1px solid #eee' }}
                  />
                )}
                {log.triples?.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {log.triples.map((t: any, idx: number) => (
                      <Chip key={`${log._id}-${idx}`} label={`${t.subject} ${t.relationship} ${t.object}`} sx={{ mb: 1 }} />
                    ))}
                  </Stack>
                )}
                {log.user_id && (
                  <Typography variant="caption">User ID: {log.user_id}</Typography>
                )}
              </Stack>
            </ListItem>
          ))}
        </List>
      </Card>
    </Box>
  );
}
