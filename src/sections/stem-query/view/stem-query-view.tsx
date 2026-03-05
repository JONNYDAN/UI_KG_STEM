import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import ImageIcon from '@mui/icons-material/Image';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import SearchIcon from '@mui/icons-material/Search';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';

import { useAuth } from 'src/contexts/AuthContext';
import { submitStemQuery } from 'src/services/stemQueryService';

const API_URL = import.meta.env.VITE_API_URL as string;

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

export function StemQueryView() {
  const { user } = useAuth();
  
  const [queryText, setQueryText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
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
    
    setLoading(true);
    setError('');
    try {
      const result = await submitStemQuery({
        queryText: queryText.trim() || undefined,
        imageFile,
        userId: user?.id,
      });
      setResponse(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Không thể xử lý truy vấn');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQueryText('');
    setImageFile(null);
    setImagePreview('');
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
    const unique = new Map();
    list.forEach((d) => unique.set(d.diagram_id, d));
    return Array.from(unique.values());
  }, [response]);

  const triplesCount = response?.triples?.length || 0;
  const finalOutput = response?.final_output;
  const hasResponse = Boolean(response);
  const descriptionsCount = useMemo(() => {
    if (!response?.query_results) return 0;
    return response.query_results.reduce((total: number, item: any) => 
      total + (item?.results?.descriptions?.length || 0), 0);
  }, [response]);

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      p: { xs: 2, sm: 3 },
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={1}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PsychologyIcon fontSize="large" />
            Truy vấn Ảnh STEM
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nhập câu hỏi văn bản, tải ảnh (hoặc cả hai) để hệ thống phân tích và đề xuất diagram phù hợp.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={`Phase: ${response?.query?.phase || 'idle'}`} />
            <Chip size="small" label={`Routing: ${response?.query?.routing_mode || 'N/A'}`} />
            <Chip size="small" label={`Diagrams: ${diagrams.length}`} />
          </Stack>
        </Stack>
      </Card>

      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        width: '100%'
      }}>
        {/* Input Section */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0 // Prevents overflow
        }}>
          <Card 
            elevation={3}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
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
                
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        backgroundColor: 'action.hover'
                      }
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
                            mb: 1
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'background.paper'
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
                      '& .MuiAlert-message': { width: '100%' }
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
                disabled={loading || (!queryText.trim() && !imageFile)}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{ 
                  minWidth: 140,
                  flex: 1,
                  borderRadius: 2,
                  py: 1
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
                  minWidth: 100
                }}
              >
                Xóa
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* Results Section */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0 // Prevents overflow
        }}>
          <Card 
            elevation={3}
            sx={{ 
              height: '100%',
              opacity: hasResponse ? 1 : 0.88,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon />
                  Kết quả Truy vấn
                </Typography>
              }
            />
            
            {loading && <LinearProgress sx={{ mx: 2 }} />}
            
            <CardContent sx={{ 
              flexGrow: 1,
              overflow: 'auto',
              maxHeight: { xs: 500, md: 600 }
            }}>
              {!response ? (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 8, 
                  color: 'text.secondary' 
                }}>
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
                      Nội dung chưa có trong kho tri thức hiện tại và đã được đưa vào vùng chờ admin duyệt bổ sung.
                    </Alert>
                  )}

                  {finalOutput && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                        Kết quả đầu ra đề xuất
                      </Typography>
                      {finalOutput.description && (
                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                          {finalOutput.description}
                        </Typography>
                      )}
                      {!!finalOutput.video_recommendations?.length && (
                        <Stack spacing={0.5}>
                          {finalOutput.video_recommendations.map((video: any, idx: number) => (
                            <Link
                              key={`${video?.url}-${idx}`}
                              href={video?.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              underline="hover"
                              variant="body2"
                            >
                              {video?.title || video?.url}
                            </Link>
                          ))}
                        </Stack>
                      )}
                    </Paper>
                  )}

                  {triplesCount > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
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

                  {/* Query Results */}
                  {response?.query_results?.map((item: any, idx: number) => (
                    <Paper key={`${item.triple?.subject}-${idx}`} variant="outlined" sx={{ p: 2 }}>
                      
                      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                        <Box component="span" sx={{ color: 'primary.main' }}>{item.triple.subject}</Box>
                        {' '}
                        <Box component="span" sx={{ color: 'text.secondary' }}>{item.triple.relationship}</Box>
                        {' '}
                        <Box component="span" sx={{ color: 'secondary.main' }}>{item.triple.object}</Box>
                      </Typography>

                      {item?.results?.descriptions?.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                            Mô tả ({item.results.descriptions.length})
                          </Typography>
                          <Stack spacing={1}>
                            {item.results.descriptions.map((desc: string, i: number) => (
                              <Typography key={`${desc}-${i}`} variant="body2" color="text.secondary">
                                • {desc}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Paper>
                  ))}

                  {/* Diagrams Section */}
                  {diagrams.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ImageIcon />
                        Hình ảnh Diagram liên quan ({diagrams.length})
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        flexWrap: 'wrap',
                        gap: 2
                      }}>
                        {diagrams.map((d: any, index: number) => (
                          <Box 
                            key={`${d.diagram_id}-${index}`}
                            sx={{ 
                              flex: '1 1 auto',
                              minWidth: { xs: '100%', sm: 200 },
                              maxWidth: { xs: '100%', sm: 240 }
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
                                  borderColor: 'primary.light'
                                }
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
                                  backgroundColor: 'grey.100'
                                }}
                              />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  textAlign: 'center',
                                  color: 'text.secondary',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {d.diagram_id}
                              </Typography>
                            </Paper>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  )}
                </Stack>
              )}
            </CardContent>
            
            {response && (
              <CardActions sx={{ 
                p: 2, 
                pt: 0, 
                justifyContent: 'space-between', 
                borderTop: '1px solid', 
                borderColor: 'divider',
                mt: 'auto'
              }}>
                <Typography variant="caption" color="text.secondary">
                  {descriptionsCount} mô tả • {diagrams.length} hình ảnh • {response?.query?.phase || 'unknown phase'}
                </Typography>
                <Button 
                  size="small" 
                  onClick={handleClear}
                  sx={{ borderRadius: 1 }}
                >
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
              '&:hover': { backgroundColor: 'grey.100' }
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
                backgroundColor: 'grey.100'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}