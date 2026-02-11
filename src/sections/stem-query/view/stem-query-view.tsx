import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import ImageIcon from '@mui/icons-material/Image';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import SearchIcon from '@mui/icons-material/Search';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [queryText, setQueryText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [response, setResponse] = useState<any>(null);

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
      gap: 4
    }}>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 600,
          color: theme.palette.primary.main,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <PsychologyIcon fontSize="large" />
        Truy vấn Ảnh STEM
      </Typography>

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
                  placeholder="Ví dụ: Mercury - orbits - Sun"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
                
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon />
                    Hình ảnh STEM (tùy chọn)
                  </Typography>
                  
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
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
                          Kéo thả hoặc nhấp để tải lên
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
                  py: 1
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
              opacity: response ? 1 : 0.7,
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
              subheader={response ? `Đã tìm thấy ${triplesCount} kết quả` : "Kết quả sẽ hiển thị ở đây"}
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
                  {/* Triples Section */}
                  {triplesCount > 0 && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon />
                        Bộ ba được trích xuất ({triplesCount})
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1,
                        alignItems: 'flex-start'
                      }}>
                        {response.triples.map((t: any, idx: number) => (
                          <Chip
                            key={`${t.subject}-${t.relationship}-${t.object}-${idx}`}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="inherit" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {t.subject}
                                </Typography>
                                <Typography variant="inherit" sx={{ color: 'text.secondary' }}>
                                  {t.relationship}
                                </Typography>
                                <Typography variant="inherit" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                  {t.object}
                                </Typography>
                              </Box>
                            }
                            sx={{ 
                              px: 1,
                              backgroundColor: 'background.default',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Query Results */}
                  {response?.query_results?.map((item: any, idx: number) => (
                    <Box key={`${item.triple?.subject}-${idx}`}>
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                        <Box component="span" sx={{ color: 'primary.main' }}>{item.triple.subject}</Box>
                        {' '}
                        <Box component="span" sx={{ color: 'text.secondary' }}>{item.triple.relationship}</Box>
                        {' '}
                        <Box component="span" sx={{ color: 'secondary.main' }}>{item.triple.object}</Box>
                      </Typography>

                      {item?.results?.descriptions?.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                            Mô tả ({item.results.descriptions.length})
                          </Typography>
                          <List dense disablePadding>
                            {item.results.descriptions.map((desc: string, i: number) => (
                              <ListItem 
                                key={`${desc}-${i}`}
                                sx={{ 
                                  py: 0.5,
                                  borderBottom: i < item.results.descriptions.length - 1 ? '1px dashed' : 'none',
                                  borderColor: 'divider'
                                }}
                              >
                                <ListItemText 
                                  primary={desc} 
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      )}
                    </Box>
                  ))}

                  {/* Diagrams Section */}
                  {diagrams.length > 0 && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      
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
                        {diagrams.map((d: any) => (
                          <Box 
                            key={d.diagram_id}
                            sx={{ 
                              flex: '1 1 auto',
                              minWidth: { xs: '100%', sm: 200 },
                              maxWidth: { xs: '100%', sm: 240 }
                            }}
                          >
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2, 
                                border: '1px solid', 
                                borderColor: 'divider',
                                borderRadius: 2,
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
                                  height: 150,
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
                    </Box>
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
                  {descriptionsCount} mô tả • {diagrams.length} hình ảnh
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
    </Box>
  );
}