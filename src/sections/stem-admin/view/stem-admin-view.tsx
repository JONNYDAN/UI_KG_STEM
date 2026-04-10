import { useEffect, useMemo, useState } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import CloseIcon from '@mui/icons-material/Close';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/contexts/AuthContext';
import {
  getQueryLogs,
  getPendingLearningItems,
  approvePendingLearningItem,
  rejectPendingLearningItem,
} from 'src/services/stemQueryService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PAGE_SIZE = 12;

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

const truncate = (text: string | undefined | null, max = 110) => {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const statusColor = (status: string): 'success' | 'error' | 'warning' => {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  return 'warning';
};

export function StemAdminView() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);

  // ── Logs state ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // ── Pending state ──
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [pendingStatusFilter, setPendingStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [pendingKeyword, setPendingKeyword] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [selectedPending, setSelectedPending] = useState<any | null>(null);
  const [actionLoadingById, setActionLoadingById] = useState<Record<string, boolean>>({});
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
      setPendingPage(1);
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
      setSelectedPending(null);
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
      setSelectedPending(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const pendingPageCount = Math.max(1, Math.ceil(filteredPendingItems.length / PAGE_SIZE));
  const pagedPendingItems = filteredPendingItems.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);

  const logsPageCount = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = logs.slice((logsPage - 1) * PAGE_SIZE, logsPage * PAGE_SIZE);

  const pendingItemId = selectedPending?._id ?? '';
  const pendingLoadingItem = Boolean(actionLoadingById[pendingItemId]);
  const isPendingStatus = (selectedPending?.status || 'pending') === 'pending';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── Header ── */}
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

      {/* ── Tab container ── */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={`Vùng chờ duyệt (${filteredPendingItems.length})`} />
          <Tab label={`Lịch sử truy vấn (${logs.length})`} />
        </Tabs>

        {/* ── Tab 0: Vùng chờ duyệt ── */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }} alignItems={{ sm: 'center' }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
                  <Chip
                    key={s}
                    clickable
                    color={pendingStatusFilter === s ? (s === 'all' ? 'primary' : statusColor(s)) : 'default'}
                    label={{ all: 'Tất cả', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }[s]}
                    onClick={() => { setPendingStatusFilter(s); setPendingPage(1); }}
                  />
                ))}
              </Stack>
              <TextField
                size="small"
                label="Tìm kiếm"
                placeholder="ladybug, water cycle..."
                value={pendingKeyword}
                onChange={(e) => { setPendingKeyword(e.target.value); setPendingPage(1); }}
                sx={{ minWidth: 220 }}
              />
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {pendingLoading && (
              <Stack alignItems="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            )}

            {!pendingLoading && pagedPendingItems.length === 0 && (
              <Alert severity="info">Không có dữ liệu phù hợp với bộ lọc hiện tại.</Alert>
            )}

            <Grid container spacing={2}>
              {pagedPendingItems.map((item) => {
                const modelOutput = item?.model_output || {};
                const topCategory = modelOutput?.category_candidates?.[0]?.category_name;
                const status = item?.status || 'pending';

                return (
                  <Grid key={item._id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.18s',
                        '&:hover': { borderColor: 'primary.main', boxShadow: 3 },
                      }}
                    >
                      <CardActionArea
                        onClick={() => setSelectedPending(item)}
                        sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-start' }}
                      >
                        <CardContent sx={{ width: '100%' }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Chip size="small" color={statusColor(status)} label={status} />
                              <Typography variant="caption" color="text.secondary">
                                {item.query_type?.toUpperCase() || 'TEXT'}
                              </Typography>
                            </Stack>

                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                              {truncate(item.query_text || item.normalized_query_text)}
                            </Typography>

                            {topCategory && (
                              <Typography variant="caption" color="primary.main">
                                📁 {topCategory}
                              </Typography>
                            )}

                            {item.reason && (
                              <Typography variant="caption" color="text.secondary">
                                {truncate(item.reason, 80)}
                              </Typography>
                            )}

                            <Typography variant="caption" color="text.disabled">
                              {item.created_at || item.updated_at || ''}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {pendingPageCount > 1 && (
              <Stack alignItems="center" sx={{ mt: 3 }}>
                <Pagination
                  count={pendingPageCount}
                  page={pendingPage}
                  onChange={(_, p) => setPendingPage(p)}
                  color="primary"
                />
              </Stack>
            )}
          </Box>
        )}

        {/* ── Tab 1: Lịch sử truy vấn ── */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {loading && (
              <Stack alignItems="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            )}

            {!loading && logs.length === 0 && (
              <Alert severity="info">Chưa có dữ liệu truy vấn.</Alert>
            )}

            <Grid container spacing={2}>
              {pagedLogs.map((log) => (
                <Grid key={log._id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: 'primary.main', boxShadow: 3 },
                    }}
                  >
                    <CardActionArea
                      onClick={() => setSelectedLog(log)}
                      sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-start' }}
                    >
                      <CardContent sx={{ width: '100%' }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Chip size="small" variant="outlined" label={log.type?.toUpperCase() || 'QUERY'} />
                            {log.triples?.length > 0 && (
                              <Chip size="small" color="primary" label={`${log.triples.length} triples`} />
                            )}
                          </Stack>

                          {log.query_text && (
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {truncate(log.query_text)}
                            </Typography>
                          )}

                          {log.image_url && (
                            <Box
                              component="img"
                              src={toAbsoluteUrl(log.image_url)}
                              alt={log._id}
                              sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 1 }}
                            />
                          )}

                          <Typography variant="caption" color="text.disabled">
                            {log.created_at || log.timestamp || ''}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {logsPageCount > 1 && (
              <Stack alignItems="center" sx={{ mt: 3 }}>
                <Pagination
                  count={logsPageCount}
                  page={logsPage}
                  onChange={(_, p) => setLogsPage(p)}
                  color="primary"
                />
              </Stack>
            )}
          </Box>
        )}
      </Card>

      {/* ── Modal: Pending Item Detail ── */}
      <Dialog
        open={Boolean(selectedPending)}
        onClose={() => setSelectedPending(null)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        {selectedPending && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Chi tiết item</Typography>
                  <Chip
                    size="small"
                    color={statusColor(selectedPending?.status || 'pending')}
                    label={selectedPending?.status || 'pending'}
                  />
                </Stack>
                <IconButton onClick={() => setSelectedPending(null)} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">ID</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{pendingItemId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Loại</Typography>
                    <Typography variant="body2">{selectedPending.query_type?.toUpperCase() || 'TEXT'}</Typography>
                  </Box>
                </Stack>

                {selectedPending.query_text && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Input</Typography>
                    <Typography variant="body2">{selectedPending.query_text}</Typography>
                  </Box>
                )}

                {selectedPending.normalized_query_text && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Normalized</Typography>
                    <Typography variant="body2">{selectedPending.normalized_query_text}</Typography>
                  </Box>
                )}

                {selectedPending.reason && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Lý do thêm vào pending</Typography>
                    <Typography variant="body2">{selectedPending.reason}</Typography>
                  </Box>
                )}

                {selectedPending.image_url && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hình ảnh</Typography>
                    <Box
                      component="img"
                      src={toAbsoluteUrl(selectedPending.image_url)}
                      alt={pendingItemId}
                      sx={{
                        mt: 0.5,
                        width: '100%',
                        maxHeight: 280,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </Box>
                )}

                {(selectedPending?.model_output?.category_candidates || []).length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Category gợi ý</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {(selectedPending?.model_output?.category_candidates || []).map((c: any, i: number) => (
                        <Chip
                          key={i}
                          size="small"
                          color={i === 0 ? 'primary' : 'default'}
                          label={`${c.category_name}${c.confidence ? ` (${(c.confidence * 100).toFixed(0)}%)` : ''}`}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {(selectedPending?.model_output?.subject_candidates || []).length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Subject gợi ý</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {(selectedPending?.model_output?.subject_candidates || []).slice(0, 8).map((s: any, i: number) => (
                        <Chip
                          key={i}
                          size="small"
                          label={`${s.subject_name}${s.confidence ? ` (${(s.confidence * 100).toFixed(0)}%)` : ''}`}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedPending.created_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Thời gian tạo</Typography>
                    <Typography variant="body2">{selectedPending.created_at}</Typography>
                  </Box>
                )}

                {isPendingStatus && (
                  <>
                    <Divider />
                    <TextField
                      size="small"
                      label="Ghi chú duyệt (optional)"
                      value={approvalNoteById[pendingItemId] || ''}
                      onChange={(e) => setApprovalNoteById((prev) => ({ ...prev, [pendingItemId]: e.target.value }))}
                      disabled={pendingLoadingItem}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Lý do từ chối (optional)"
                      value={rejectReasonById[pendingItemId] || ''}
                      onChange={(e) => setRejectReasonById((prev) => ({ ...prev, [pendingItemId]: e.target.value }))}
                      disabled={pendingLoadingItem}
                      fullWidth
                    />
                  </>
                )}
              </Stack>
            </DialogContent>

            {isPendingStatus ? (
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleReject(selectedPending)}
                  disabled={pendingLoadingItem}
                >
                  {pendingLoadingItem ? <CircularProgress size={18} color="inherit" /> : 'Từ chối'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleApprove(selectedPending)}
                  disabled={pendingLoadingItem}
                >
                  {pendingLoadingItem ? <CircularProgress size={18} color="inherit" /> : 'Duyệt & Đồng bộ'}
                </Button>
              </DialogActions>
            ) : (
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setSelectedPending(null)}>Đóng</Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>

      {/* ── Modal: Log Detail ── */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        {selectedLog && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Chi tiết log</Typography>
                  <Chip size="small" variant="outlined" label={selectedLog.type?.toUpperCase() || 'QUERY'} />
                </Stack>
                <IconButton onClick={() => setSelectedLog(null)} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">ID</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{selectedLog._id}</Typography>
                </Box>

                {(selectedLog.created_at || selectedLog.timestamp) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                    <Typography variant="body2">{selectedLog.created_at || selectedLog.timestamp}</Typography>
                  </Box>
                )}

                {selectedLog.query_text && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nội dung truy vấn</Typography>
                    <Typography variant="body2">{selectedLog.query_text}</Typography>
                  </Box>
                )}

                {selectedLog.image_url && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hình ảnh</Typography>
                    <Box
                      component="img"
                      src={toAbsoluteUrl(selectedLog.image_url)}
                      alt={selectedLog._id}
                      sx={{
                        mt: 0.5,
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </Box>
                )}

                {selectedLog.triples?.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Kết quả triples ({selectedLog.triples.length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {selectedLog.triples.map((t: any, idx: number) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={`${t.subject} ${t.relationship} ${t.object}`}
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedLog.user_id && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">User ID</Typography>
                    <Typography variant="body2">{selectedLog.user_id}</Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setSelectedLog(null)}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
