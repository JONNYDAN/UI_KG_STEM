import type { StemAnalysisMode } from 'src/services/stemQueryService';

import DOMPurify from 'dompurify';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import ImageIcon from '@mui/icons-material/Image';
import RadioGroup from '@mui/material/RadioGroup';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import SearchIcon from '@mui/icons-material/Search';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import FormControlLabel from '@mui/material/FormControlLabel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { useAuth } from 'src/contexts/AuthContext';
import { submitStemQuery } from 'src/services/stemQueryService';

const API_URL = import.meta.env.VITE_API_URL as string;

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

const getDiagramPdfPath = (diagram?: any) =>
  diagram?.path_pdf || diagram?.pdf_path || diagram?.pdfUrl || '';

const renderSafeHtml = (value?: string) => ({
  __html: DOMPurify.sanitize(value || ''),
});

const getYouTubeEmbedUrl = (url?: string) => {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }

    if (host.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?#]+)/i);
      if (shortsMatch?.[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/i);
      if (embedMatch?.[1]) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`;
      }

      const searchQuery = parsed.searchParams.get('search_query');
      if (searchQuery) {
        return '';
      }
    }
  } catch (error) {
    return '';
  }

  return '';
};

const formatPriorityScore = (score?: number) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  return score.toFixed(2);
};

export function StemQueryView() {
  const { user } = useAuth();

  const [queryText, setQueryText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<StemAnalysisMode | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [zoomedDiagram, setZoomedDiagram] = useState<any | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setResponse(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview('');
    }
  };

  const handleSubmit = async () => {
    if (!queryText.trim() && !imageFile) {
      setError('Vui lòng nhập truy vấn hoặc chọn ảnh');
      return;
    }

    if (!analysisMode) {
      setError('Vui lòng chọn chế độ phân tích trước khi kích hoạt truy vấn');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await submitStemQuery({
        queryText: queryText.trim() || undefined,
        imageFile,
        userId: user?.id,
        analysisMode,
      });
      setResponse(result);
    } catch (err: any) {
      const rawMessage = String(err?.message || '');
      if (rawMessage.toLowerCase().includes('timeout')) {
        setError(
          'Yêu cầu xử lý đang quá thời gian chờ. Vui lòng thử lại hoặc tăng VITE_API_TIMEOUT_MS.'
        );
      } else {
        setError(err?.response?.data?.detail || err?.message || 'Không thể xử lý truy vấn');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQueryText('');
    setImageFile(null);
    setImagePreview('');
    setAnalysisMode('');
    setResponse(null);
    setError('');
    setZoomedDiagram(null);
  };

  const diagrams = useMemo(() => {
    if (!response?.query_results) return [] as any[];
    const list: any[] = [];
    response.query_results.forEach((item: any) => {
      (item?.results?.diagrams || []).forEach((d: any) => list.push(d));
    });
    const unique = new Map<string, any>();
    list.forEach((d) => {
      const key = d?.diagram_id;
      if (!key) return;
      const existing = unique.get(key) || {};
      unique.set(key, {
        ...existing,
        ...d,
        description: existing.description || d.description,
        path_pdf: existing.path_pdf || d.path_pdf || d.pdf_path || d.pdfUrl,
      });
    });
    return Array.from(unique.values());
  }, [response]);

  const triplesCount = response?.triples?.length || 0;
  const finalOutput = response?.final_output;
  const diagramExplanation = finalOutput?.diagram_explanation;
  const primaryDiagramId = finalOutput?.diagram?.diagram_id;
  const scientificAnalysis = finalOutput?.scientific_analysis;
  const videoRecommendations = finalOutput?.video_recommendations || [];
  const primaryVideo = videoRecommendations[0] || null;
  const secondaryVideos = videoRecommendations.slice(1);
  const hasResponse = Boolean(response);
  const primaryEmbedUrl = getYouTubeEmbedUrl(primaryVideo?.url);
  const descriptionsCount = useMemo(() => {
    if (!response?.query_results) return 0;
    return response.query_results.reduce(
      (total: number, item: any) => total + (item?.results?.descriptions?.length || 0),
      0
    );
  }, [response]);

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={1}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PsychologyIcon fontSize="large" />
            Truy vấn học liệu STEM
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nhập câu hỏi văn bản, tải ảnh (hoặc cả hai) để hệ thống phân tích và đề xuất diagram phù
            hợp.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={`Phase: ${response?.query?.phase || 'idle'}`} />
            <Chip size="small" label={`Routing: ${response?.query?.routing_mode || 'N/A'}`} />
            <Chip
              size="small"
              label={`Mode: ${response?.query?.analysis_mode || analysisMode || 'Chưa chọn'}`}
            />
            <Chip size="small" label={`Diagrams: ${diagrams.length}`} />
          </Stack>
        </Stack>
      </Card>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          width: '100%',
        }}
      >
        {/* Input Section */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0, // Prevents overflow
          }}
        >
          <Card
            elevation={3}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon />
                  Truy vấn của bạn
                </Typography>
              }
              subheader="Nhập truy vấn dạng văn bản và/hoặc tải lên hình ảnh STEM"
            />

            <CardContent sx={{ flexGrow: 1 }}>
              <Stack spacing={3}>
                <TextField
                  label="Truy vấn văn bản"
                  placeholder="Ví dụ: Can you explain how the water cycle works?"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />

                <FormControl component="fieldset" disabled={loading} required>
                  <FormLabel component="legend">Chế độ phân tích</FormLabel>
                  <RadioGroup
                    row
                    value={analysisMode}
                    onChange={(event) => {
                      setAnalysisMode(event.target.value as StemAnalysisMode);
                      setError('');
                    }}
                  >
                    <FormControlLabel
                      value="basic"
                      control={<Radio />}
                      label="Phân tích cơ bản (nhanh hơn)"
                    />
                    <FormControlLabel
                      value="gemini"
                      control={<Radio />}
                      label="Phân tích Gemini (chậm hơn, sâu hơn)"
                    />
                  </RadioGroup>
                  <Typography variant="caption" color="text.secondary">
                    Chọn Phân tích cơ bản để ưu tiên tốc độ phản hồi, hoặc Gemini để ưu tiên chiều
                    sâu phân tích.
                  </Typography>
                </FormControl>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <ImageIcon />
                    Hình ảnh minh họa
                  </Typography>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      borderColor: imagePreview ? 'primary.main' : 'grey.300',
                      backgroundColor: imagePreview ? 'primary.50' : 'transparent',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      disabled={loading}
                    />

                    {imagePreview ? (
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={imagePreview}
                          alt="Preview"
                          sx={{
                            maxWidth: '100%',
                            maxHeight: 200,
                            borderRadius: 1,
                            mb: 1,
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'background.paper',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClear();
                          }}
                          disabled={loading}
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Kéo thả hoặc nhấp để tải ảnh
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hỗ trợ: JPG, PNG, GIF
                        </Typography>
                      </>
                    )}
                  </Paper>
                </Box>

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: 1,
                      '& .MuiAlert-message': { width: '100%' },
                    }}
                  >
                    {error}
                  </Alert>
                )}
              </Stack>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0, gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || (!queryText.trim() && !imageFile) || !analysisMode}
                startIcon={
                  loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />
                }
                sx={{
                  minWidth: 140,
                  flex: 1,
                  borderRadius: 2,
                  py: 1,
                }}
              >
                {loading ? 'Đang xử lý...' : 'Kích hoạt truy vấn'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  minWidth: 100,
                }}
              >
                Xóa
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* Results Section */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0, // Prevents overflow
          }}
        >
          <Card
            elevation={3}
            sx={{
              height: '100%',
              opacity: hasResponse ? 1 : 0.88,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon />
                  Kết quả truy vấn
                </Typography>
              }
            />

            {loading && <LinearProgress sx={{ mx: 2 }} />}

            <CardContent
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                maxHeight: { xs: 500, md: 600 },
              }}
            >
              {!response ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    color: 'text.secondary',
                  }}
                >
                  <PsychologyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1" align="center">
                    Nhập truy vấn và nhấn Kích hoạt truy vấn để xem kết quả
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" variant="outlined" label={`Triples: ${triplesCount}`} />
                    <Chip size="small" variant="outlined" label={`Mô tả: ${descriptionsCount}`} />
                    <Chip size="small" variant="outlined" label={`Diagram: ${diagrams.length}`} />
                  </Stack>

                  {response?.pending_review && (
                    <Alert severity="warning" sx={{ borderRadius: 1 }}>
                      Nội dung chưa có trong kho tri thức hiện tại và đã được đưa vào vùng chờ admin
                      duyệt bổ sung.
                    </Alert>
                  )}

                  {/* Diagrams Section */}
                  {diagrams.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <ImageIcon />
                        Hình ảnh Diagram ({diagrams.length})
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                        {diagrams.map((d: any, index: number) => {
                          const shouldShowDetailedExplanation = Boolean(
                            diagramExplanation &&
                              (diagrams.length === 1 ||
                                (primaryDiagramId && d.diagram_id === primaryDiagramId))
                          );
                          const diagramPdfUrl = toAbsoluteUrl(getDiagramPdfPath(d));

                          return (
                            <Box
                              key={`${d.diagram_id}-${index}`}
                              sx={{
                                flex: '1 1 auto',
                                minWidth: { xs: '100%', sm: 200 },
                                maxWidth: { xs: '100%', sm: 460 },
                              }}
                            >
                              <Paper
                                elevation={0}
                                onClick={() => setZoomedDiagram(d)}
                                sx={{
                                  p: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 2,
                                  cursor: 'zoom-in',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    boxShadow: 2,
                                    borderColor: 'primary.light',
                                  },
                                }}
                              >
                                <Box
                                  component="img"
                                  src={toAbsoluteUrl(d.image_path)}
                                  alt={d.diagram_id}
                                  sx={{
                                    width: '100%',
                                    height: 160,
                                    objectFit: 'contain',
                                    borderRadius: 1,
                                    mb: 1,
                                    backgroundColor: 'grey.100',
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {d.diagram_id}
                                </Typography>

                                {diagramPdfUrl && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<PictureAsPdfIcon fontSize="small" />}
                                    sx={{ mt: 1, width: '100%' }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      window.open(diagramPdfUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                    Mở tài liệu PDF
                                  </Button>
                                )}
                              </Paper>

                              {/* Query Results */}
                              {response?.query_results?.map((item: any, idx: number) => (
                                <Paper
                                  key={`${item.triple?.subject}-${idx}`}
                                  variant="outlined"
                                  sx={{ p: 2 }}
                                >
                                  <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                                    <Box component="span" sx={{ color: 'primary.main' }}>
                                      {item.triple.subject}
                                    </Box>{' '}
                                    <Box component="span" sx={{ color: 'text.secondary' }}>
                                      {item.triple.relationship}
                                    </Box>{' '}
                                    <Box component="span" sx={{ color: 'secondary.main' }}>
                                      {item.triple.object}
                                    </Box>
                                  </Typography>

                                  {item?.results?.descriptions?.length > 0 && (
                                    <Box>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}
                                      >
                                        Mô tả ({item.results.descriptions.length})
                                      </Typography>
                                      <Stack spacing={1}>
                                        {item.results.descriptions.map(
                                          (desc: string, i: number) => (
                                            <Box
                                              key={`${desc}-${i}`}
                                              sx={{
                                                color: 'text.secondary',
                                                fontSize: (theme) =>
                                                  theme.typography.body2.fontSize,
                                                lineHeight: 1.6,
                                                pl: 1,
                                                borderLeft: '2px solid',
                                                borderColor: 'divider',
                                                '& p': { mt: 0, mb: 0.75 },
                                                '& p:last-of-type': { mb: 0 },
                                              }}
                                              dangerouslySetInnerHTML={renderSafeHtml(desc)}
                                            />
                                          )
                                        )}
                                      </Stack>
                                    </Box>
                                  )}

                                  {item?.results?.diagrams?.length > 0 && (
                                    <Box
                                      sx={{ mt: item?.results?.descriptions?.length > 0 ? 2 : 0 }}
                                    >
                                      <Stack spacing={1.25}>
                                        {item.results.diagrams.map((diagram: any, i: number) => {
                                          const relatedDiagramPdfUrl = toAbsoluteUrl(
                                            getDiagramPdfPath(diagram)
                                          );
                                          return (
                                            <Paper
                                              key={`${diagram?.diagram_id || 'diagram'}-${i}`}
                                              variant="outlined"
                                              sx={{ p: 1.25 }}
                                            >
                                              <Stack spacing={0.8}>
                                                {diagram?.description && (
                                                  <Box
                                                    sx={{
                                                      color: 'text.secondary',
                                                      fontSize: (theme) =>
                                                        theme.typography.body2.fontSize,
                                                      lineHeight: 1.6,
                                                      '& p': { mt: 0, mb: 0.75 },
                                                      '& p:last-of-type': { mb: 0 },
                                                    }}
                                                    dangerouslySetInnerHTML={renderSafeHtml(
                                                      diagram.description
                                                    )}
                                                  />
                                                )}
                                              </Stack>
                                            </Paper>
                                          );
                                        })}
                                      </Stack>
                                    </Box>
                                  )}
                                </Paper>
                              ))}
                            </Box>
                          );
                        })}
                      </Box>
                    </Paper>
                  )}

                  {finalOutput && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                        Kết quả đầu ra đề xuất
                      </Typography>
                      {finalOutput.description && (
                        <Box
                          sx={{
                            mb: 1.5,
                            fontSize: (theme) => theme.typography.body2.fontSize,
                            lineHeight: 1.6,
                            '& p': { mt: 0, mb: 1 },
                            '& p:last-of-type': { mb: 0 },
                          }}
                          dangerouslySetInnerHTML={renderSafeHtml(finalOutput.description)}
                        />
                      )}

                      {!!videoRecommendations.length && (
                        <Stack spacing={0.8} sx={{ mt: 1.5 }}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Video minh họa
                          </Typography>

                          {primaryVideo && (
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                                {primaryVideo?.title || 'Video chính'}
                              </Typography>

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                {primaryVideo?.keyword && (
                                  <Chip
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    label={`Keyword: ${primaryVideo.keyword}`}
                                  />
                                )}
                                {formatPriorityScore(primaryVideo?.priority_score) && (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`Priority: ${formatPriorityScore(primaryVideo?.priority_score)}`}
                                  />
                                )}
                              </Stack>

                              {primaryEmbedUrl ? (
                                <Box
                                  component="iframe"
                                  src={primaryEmbedUrl}
                                  title="youtube-preview-primary"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  sx={{
                                    width: '100%',
                                    height: { xs: 240, sm: 320 },
                                    border: 0,
                                    borderRadius: 1,
                                    mb: 1,
                                  }}
                                />
                              ) : (
                                <Alert severity="info" sx={{ mb: 1 }}>
                                  Video này không hỗ trợ nhúng trực tiếp. Vui lòng mở trên YouTube.
                                </Alert>
                              )}

                              <Link
                                href={primaryVideo?.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                underline="hover"
                                variant="body2"
                              >
                                Mở video chính trên YouTube
                              </Link>
                            </Paper>
                          )}

                          {!!secondaryVideos.length && (
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ mb: 1, fontWeight: 600 }}
                              >
                                Video tham khảo thêm ({secondaryVideos.length})
                              </Typography>
                              <Stack spacing={0.7}>
                                {secondaryVideos.map((video: any, idx: number) => (
                                  <Box key={`${video?.url}-${idx}`}>
                                    <Link
                                      href={video?.url || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      underline="hover"
                                      variant="body2"
                                    >
                                      {video?.title || `Video ${idx + 2}`}
                                    </Link>
                                    <Stack
                                      direction="row"
                                      spacing={0.8}
                                      flexWrap="wrap"
                                      useFlexGap
                                      sx={{ mt: 0.4 }}
                                    >
                                      {video?.keyword && (
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          label={`Keyword: ${video.keyword}`}
                                        />
                                      )}
                                      {formatPriorityScore(video?.priority_score) && (
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          label={`Priority: ${formatPriorityScore(video?.priority_score)}`}
                                        />
                                      )}
                                    </Stack>
                                  </Box>
                                ))}
                              </Stack>
                            </Paper>
                          )}
                        </Stack>
                      )}

                      {!!scientificAnalysis && (
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                          {scientificAnalysis.summary && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ fontWeight: 600 }}
                              >
                                Tóm tắt khoa học
                              </Typography>
                              <Typography variant="body2">{scientificAnalysis.summary}</Typography>
                            </Box>
                          )}

                          {!!scientificAnalysis.key_points?.length && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ fontWeight: 600 }}
                              >
                                Ý chính
                              </Typography>
                              <Stack spacing={0.5}>
                                {scientificAnalysis.key_points.map((point: string, idx: number) => (
                                  <Typography
                                    key={`${point}-${idx}`}
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    • {point}
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {!!scientificAnalysis.reasoning_steps?.length && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ fontWeight: 600 }}
                              >
                                Chuỗi phân tích
                              </Typography>
                              <Stack spacing={0.5}>
                                {scientificAnalysis.reasoning_steps.map(
                                  (step: string, idx: number) => (
                                    <Typography
                                      key={`${step}-${idx}`}
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {idx + 1}. {step}
                                    </Typography>
                                  )
                                )}
                              </Stack>
                            </Box>
                          )}

                          {!!scientificAnalysis.applications?.length && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ fontWeight: 600 }}
                              >
                                Ứng dụng thực tế
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {scientificAnalysis.applications.map((app: string, idx: number) => (
                                  <Chip
                                    key={`${app}-${idx}`}
                                    size="small"
                                    variant="outlined"
                                    label={app}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {!!scientificAnalysis.glossary?.length && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ fontWeight: 600, mb: 0.5 }}
                              >
                                Thuật ngữ
                              </Typography>
                              <Stack spacing={0.5}>
                                {scientificAnalysis.glossary.map((g: any, idx: number) => (
                                  <Typography
                                    key={`${g?.term}-${idx}`}
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    • <strong>{g?.term}</strong>: {g?.definition}
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {!!scientificAnalysis.recommended_queries?.length && (
                            <Box>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ fontWeight: 600 }}
                              >
                                Truy vấn gợi ý tiếp theo
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {scientificAnalysis.recommended_queries.map(
                                  (q: string, idx: number) => (
                                    <Chip
                                      key={`${q}-${idx}`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      label={q}
                                      onClick={() => setQueryText(q)}
                                    />
                                  )
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      )}
                    </Paper>
                  )}

                  {triplesCount > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <DescriptionIcon />
                        Bộ ba được trích xuất ({triplesCount})
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {response.triples.map((t: any, idx: number) => (
                          <Chip
                            key={`${t.subject}-${t.relationship}-${t.object}-${idx}`}
                            label={`${t.subject} ${t.relationship} ${t.object}`}
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  )}

                  {Boolean(diagramExplanation) && (
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 1.25 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        {diagramExplanation?.title || 'Giải thích chi tiết'}
                      </Typography>

                      {diagramExplanation?.overview && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {diagramExplanation.overview}
                        </Typography>
                      )}

                      {!!diagramExplanation?.process_steps?.length && (
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 700 }}
                          >
                            Quy trình
                          </Typography>
                          <Stack spacing={0.35} sx={{ mt: 0.4 }}>
                            {diagramExplanation.process_steps.map(
                              (step: string, stepIdx: number) => (
                                <Typography
                                  key={`${step}-${stepIdx}`}
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {stepIdx + 1}. {step}
                                </Typography>
                              )
                            )}
                          </Stack>
                        </Box>
                      )}

                      {!!diagramExplanation?.key_takeaways?.length && (
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 700 }}
                          >
                            Điểm cốt lõi
                          </Typography>
                          <Stack spacing={0.35} sx={{ mt: 0.4 }}>
                            {diagramExplanation.key_takeaways.map(
                              (point: string, pointIdx: number) => (
                                <Typography
                                  key={`${point}-${pointIdx}`}
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  • {point}
                                </Typography>
                              )
                            )}
                          </Stack>
                        </Box>
                      )}

                      {!!diagramExplanation?.applications?.length && (
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 700 }}
                          >
                            Ứng dụng
                          </Typography>
                          <Stack spacing={0.35} sx={{ mt: 0.4 }}>
                            {diagramExplanation.applications.map(
                              (application: string, appIdx: number) => (
                                <Typography
                                  key={`${application}-${appIdx}`}
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  • {application}
                                </Typography>
                              )
                            )}
                          </Stack>
                        </Box>
                      )}

                      {!!diagramExplanation?.glossary?.length && (
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 700 }}
                          >
                            Thuật ngữ
                          </Typography>
                          <Stack spacing={0.35} sx={{ mt: 0.4 }}>
                            {diagramExplanation.glossary.map((g: any, gIdx: number) => (
                              <Typography
                                key={`${g?.term}-${gIdx}`}
                                variant="caption"
                                color="text.secondary"
                              >
                                • <strong>{g?.term}</strong>: {g?.definition}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {diagramExplanation?.learning_prompt && (
                        <Alert severity="info" sx={{ py: 0.5, mt: 0.5 }}>
                          <Typography variant="caption">
                            {diagramExplanation.learning_prompt}
                          </Typography>
                        </Alert>
                      )}
                    </Paper>
                  )}
                </Stack>
              )}
            </CardContent>

            {response && (
              <CardActions
                sx={{
                  p: 2,
                  pt: 0,
                  justifyContent: 'space-between',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  mt: 'auto',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {descriptionsCount} mô tả • {diagrams.length} hình ảnh •{' '}
                  {response?.query?.phase || 'unknown phase'}
                </Typography>
                <Button size="small" onClick={handleClear} sx={{ borderRadius: 1 }}>
                  Xóa kết quả
                </Button>
              </CardActions>
            )}
          </Card>
        </Box>
      </Box>

      <Dialog
        open={Boolean(zoomedDiagram)}
        onClose={() => setZoomedDiagram(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 2, position: 'relative' }}>
          <IconButton
            size="small"
            onClick={() => setZoomedDiagram(null)}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'background.paper',
              zIndex: 1,
              '&:hover': { backgroundColor: 'grey.100' },
            }}
          >
            ✕
          </IconButton>
          {zoomedDiagram && (
            <Box
              component="img"
              src={toAbsoluteUrl(zoomedDiagram.image_path)}
              alt={zoomedDiagram.diagram_id}
              sx={{
                width: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: 1,
                backgroundColor: 'grey.100',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
