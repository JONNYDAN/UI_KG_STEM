import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/contexts/AuthContext';
import {
  getQueryLogs,
  getPendingLearningItems,
  approvePendingLearningItem,
  rejectPendingLearningItem,
} from 'src/services/stemQueryService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

export function StemAdminView() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [actionLoadingById, setActionLoadingById] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [pendingError, setPendingError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [pendingStatusFilter, setPendingStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});
  const [approvalNoteById, setApprovalNoteById] = useState<Record<string, string>>({});

  const setItemLoading = (itemId: string, value: boolean) => {
    setActionLoadingById((prev) => ({ ...prev, [itemId]: value }));
  };

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

  const loadPendingItems = async () => {
    setPendingLoading(true);
    setPendingError('');
    try {
      const result = await getPendingLearningItems({
        limit: 100,
        status: pendingStatusFilter === 'all' ? undefined : pendingStatusFilter,
      });
      setPendingItems(result.items || []);
    } catch (err: any) {
      setPendingError(err?.response?.data?.detail || err?.message || 'Không thể tải vùng chờ duyệt');
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApprove = async (item: any) => {
    const itemId = item?._id;
    if (!itemId) return;

    setItemLoading(itemId, true);
    setPendingError('');
    setActionMessage('');
    try {
      const modelOutput = item?.model_output || {};
      const topCategory = modelOutput?.category_candidates?.[0]?.category_name;
      const suggestedSubjects = (modelOutput?.subject_candidates || [])
        .map((s: any) => s?.subject_name)
        .filter(Boolean)
        .slice(0, 5);

      await approvePendingLearningItem(itemId, {
        approved_by: user?.id || user?.username || user?.name || 'admin',
        category_name: topCategory,
        subject_names: suggestedSubjects.length ? suggestedSubjects : undefined,
        note: approvalNoteById[itemId] || undefined,
      });

      setActionMessage(`Đã duyệt item ${itemId} và đồng bộ vào hệ tri thức.`);
      await loadPendingItems();
      await loadLogs();
    } catch (err: any) {
      setPendingError(err?.response?.data?.detail || err?.message || `Không thể duyệt item ${itemId}`);
    } finally {
      setItemLoading(itemId, false);
    }
  };

  const handleReject = async (item: any) => {
    const itemId = item?._id;
    if (!itemId) return;

    setItemLoading(itemId, true);
    setPendingError('');
    setActionMessage('');
    try {
      await rejectPendingLearningItem(itemId, {
        rejected_by: user?.id || user?.username || user?.name || 'admin',
        reason: rejectReasonById[itemId] || 'Không phù hợp để bổ sung tri thức',
      });

      setActionMessage(`Đã từ chối item ${itemId}.`);
      await loadPendingItems();
    } catch (err: any) {
      setPendingError(err?.response?.data?.detail || err?.message || `Không thể từ chối item ${itemId}`);
    } finally {
      setItemLoading(itemId, false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    loadPendingItems();
  }, [pendingStatusFilter]);

  const filteredPendingItems = useMemo(() => {
    const keyword = pendingKeyword.trim().toLowerCase();
    if (!keyword) return pendingItems;

    return pendingItems.filter((item) => {
      const modelOutput = item?.model_output || {};
      const categoryNames = (modelOutput?.category_candidates || [])
        .map((c: any) => c?.category_name)
        .filter(Boolean)
        .join(' ');
      const subjectNames = (modelOutput?.subject_candidates || [])
        .map((s: any) => s?.subject_name)
        .filter(Boolean)
        .join(' ');

      const searchable = [
        item?._id,
        item?.query_text,
        item?.normalized_query_text,
        item?.reason,
        item?.status,
        categoryNames,
        subjectNames,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [pendingItems, pendingKeyword]);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Card sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Quản lý truy vấn STEM</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadPendingItems} disabled={pendingLoading}>
              {pendingLoading ? <CircularProgress size={20} color="inherit" /> : 'Làm mới vùng chờ'}
            </Button>
            <Button variant="contained" onClick={loadLogs} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Làm mới logs'}
            </Button>
          </Stack>
        </Stack>
        {actionMessage && <Alert severity="success" sx={{ mt: 2 }}>{actionMessage}</Alert>}
        {pendingError && <Alert severity="error" sx={{ mt: 2 }}>{pendingError}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Vùng chờ học tri thức (Pending Learning)
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              clickable
              color={pendingStatusFilter === 'all' ? 'primary' : 'default'}
              label="Tất cả"
              onClick={() => setPendingStatusFilter('all')}
            />
            <Chip
              clickable
              color={pendingStatusFilter === 'pending' ? 'warning' : 'default'}
              label="Pending"
              onClick={() => setPendingStatusFilter('pending')}
            />
            <Chip
              clickable
              color={pendingStatusFilter === 'approved' ? 'success' : 'default'}
              label="Approved"
              onClick={() => setPendingStatusFilter('approved')}
            />
            <Chip
              clickable
              color={pendingStatusFilter === 'rejected' ? 'error' : 'default'}
              label="Rejected"
              onClick={() => setPendingStatusFilter('rejected')}
            />
          </Stack>
          <TextField
            size="small"
            label="Tìm kiếm theo từ khóa"
            placeholder="Ví dụ: ladybug, water cycle..."
            value={pendingKeyword}
            onChange={(e) => setPendingKeyword(e.target.value)}
            fullWidth
          />
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {filteredPendingItems.length === 0 && !pendingLoading && (
          <Typography variant="body2">Không có dữ liệu phù hợp với bộ lọc hiện tại.</Typography>
        )}

        <List>
          {filteredPendingItems.map((item) => {
            const itemId = item._id;
            const loadingItem = Boolean(actionLoadingById[itemId]);
            const isPending = (item?.status || 'pending') === 'pending';
            const modelOutput = item?.model_output || {};
            const topCategory = modelOutput?.category_candidates?.[0]?.category_name;
            const subjectHints = (modelOutput?.subject_candidates || [])
              .map((s: any) => s?.subject_name)
              .filter(Boolean)
              .slice(0, 5);

            return (
              <ListItem key={itemId} alignItems="flex-start" sx={{ mb: 2, display: 'block', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="subtitle2">{item.query_type?.toUpperCase() || 'TEXT'} • {item.created_at || item.updated_at || 'N/A'}</Typography>
                    <Chip
                      size="small"
                      color={
                        item.status === 'approved'
                          ? 'success'
                          : item.status === 'rejected'
                            ? 'error'
                            : 'warning'
                      }
                      label={item.status || 'pending'}
                    />
                  </Stack>

                  {item.query_text && <Typography variant="body2"><strong>Input:</strong> {item.query_text}</Typography>}
                  {item.normalized_query_text && <Typography variant="body2"><strong>Normalized:</strong> {item.normalized_query_text}</Typography>}
                  {item.reason && <Typography variant="body2" color="text.secondary">{item.reason}</Typography>}

                  {!!topCategory && (
                    <Typography variant="body2"><strong>Category gợi ý:</strong> {topCategory}</Typography>
                  )}
                  {!!subjectHints.length && (
                    <Typography variant="body2"><strong>Subject gợi ý:</strong> {subjectHints.join(', ')}</Typography>
                  )}

                  {item.image_url && (
                    <Box
                      component="img"
                      src={toAbsoluteUrl(item.image_url)}
                      alt={itemId}
                      sx={{ width: 240, borderRadius: 1, border: '1px solid #eee' }}
                    />
                  )}

                  {isPending ? (
                    <>
                      <TextField
                        size="small"
                        label="Ghi chú duyệt (optional)"
                        value={approvalNoteById[itemId] || ''}
                        onChange={(e) => setApprovalNoteById((prev) => ({ ...prev, [itemId]: e.target.value }))}
                        disabled={loadingItem}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Lý do từ chối (optional)"
                        value={rejectReasonById[itemId] || ''}
                        onChange={(e) => setRejectReasonById((prev) => ({ ...prev, [itemId]: e.target.value }))}
                        disabled={loadingItem}
                        fullWidth
                      />

                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleApprove(item)}
                          disabled={loadingItem}
                        >
                          {loadingItem ? <CircularProgress size={18} color="inherit" /> : 'Duyệt & Đồng bộ'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(item)}
                          disabled={loadingItem}
                        >
                          {loadingItem ? <CircularProgress size={18} color="inherit" /> : 'Từ chối'}
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Item này đã được xử lý, chỉ hiển thị để tra cứu.
                    </Typography>
                  )}
                </Stack>
              </ListItem>
            );
          })}
        </List>
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
