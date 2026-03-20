import { useMemo, useState, useEffect, useRef } from 'react';

import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import {
  type RootCategory,
  type GraphNode,
  type DiagramKnowledgeGraphResponse,
  type Diagram,
  type Category,
  getCategoriesByRoot,
  getDiagramsByCategory,
  getKnowledgeGraphByDiagram,
  getRootCategories,
} from 'src/services/diagramGraphService';

const API_URL = import.meta.env.VITE_API_URL as string;

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

const stripHtml = (value: string): string => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const truncateText = (value: string | undefined | null, maxLength = 90): string => {
  const normalized = stripHtml(value || '');
  if (!normalized) return 'Chưa có mô tả';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
};

const nodeColorByTypeLight: Record<string, string> = {
  root: '#0F172A',
  root_category: '#1D4ED8',
  category: '#0EA5E9',
  diagram: '#7C3AED',
  text_label: '#F59E0B',
  blob: '#06B6D4',
  arrow: '#EF4444',
  arrow_head: '#DC2626',
  image_const: '#14B8A6',
  subject: '#10B981',
};

const nodeColorByTypeDark: Record<string, string> = {
  root: '#E2E8F0',
  root_category: '#60A5FA',
  category: '#38BDF8',
  diagram: '#A78BFA',
  text_label: '#FBBF24',
  blob: '#22D3EE',
  arrow: '#FB7185',
  arrow_head: '#F43F5E',
  image_const: '#2DD4BF',
  subject: '#34D399',
};

type PositionedNode = GraphNode & { x: number; y: number };
type Point = { x: number; y: number };

const GRAPH_WIDTH = 1300;
const GRAPH_HEIGHT = 800;
const CENTER_X = GRAPH_WIDTH / 2;
const CENTER_Y = GRAPH_HEIGHT / 2;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function toGraphPoint(screenX: number, screenY: number, pan: Point, zoom: number): Point {
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  };
}

function buildNodePositions(nodes: GraphNode[]): PositionedNode[] {
  if (!nodes.length) return [];

  const diagramNode = nodes.find((item) => item.type === 'diagram') || nodes[0];
  const others = nodes.filter((item) => item.id !== diagramNode.id);

  const positioned: PositionedNode[] = [
    {
      ...diagramNode,
      x: CENTER_X,
      y: CENTER_Y,
    },
  ];

  const ringCapacity = 12;
  const baseRadius = 180;
  const ringGap = 110;

  others.forEach((node, index) => {
    const ringIndex = Math.floor(index / ringCapacity);
    const indexInRing = index % ringCapacity;
    const nodesInThisRing = Math.min(ringCapacity, others.length - ringIndex * ringCapacity);

    const angle = (2 * Math.PI * indexInRing) / Math.max(nodesInThisRing, 1);
    const radius = baseRadius + ringIndex * ringGap;

    positioned.push({
      ...node,
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle),
    });
  });

  return positioned;
}

export function DiagramGraphView() {
  const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);

  const [selectedRootId, setSelectedRootId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);

  const [graphData, setGraphData] = useState<DiagramKnowledgeGraphResponse | null>(null);

  const [loadingRoots, setLoadingRoots] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [error, setError] = useState('');

  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragLastPoint, setDragLastPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panLastScreenPoint, setPanLastScreenPoint] = useState<Point | null>(null);
  const [diagramImageOpen, setDiagramImageOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const graphCanvasRef = useRef<HTMLDivElement | null>(null);
  const nodeColorByType = nodeColorByTypeLight;
  const edgeColor = '#94A3B8';
  const edgeLabelColor = '#475569';
  const canvasBackground = '#F8FAFC';
  const canvasBorder = '#CBD5E1';

  const selectedDiagramImageUrl = toAbsoluteUrl(selectedDiagram?.image_path);
  const hasDescription = Boolean(stripHtml(selectedDiagram?.description || ''));
  const hasPdf = Boolean(selectedDiagram?.path_pdf);

  useEffect(() => {
    const fetchRoots = async () => {
      setLoadingRoots(true);
      setError('');
      try {
        const roots = await getRootCategories();
        setRootCategories(roots);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || 'Không thể tải RootCategory');
      } finally {
        setLoadingRoots(false);
      }
    };

    fetchRoots();
  }, []);

  const handleSelectRoot = async (rootId: string) => {
    setSelectedRootId(rootId);
    setSelectedCategoryId('');
    setSelectedDiagram(null);
    setGraphData(null);
    setDiagrams([]);
    setError('');

    if (!rootId) {
      setCategories([]);
      return;
    }

    setLoadingCategories(true);
    try {
      const categoryRows = await getCategoriesByRoot(rootId);
      setCategories(categoryRows);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Không thể tải Category');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSelectCategory = async (categoryIdValue: number | '') => {
    setSelectedCategoryId(categoryIdValue);
    setSelectedDiagram(null);
    setGraphData(null);
    setError('');

    if (!categoryIdValue) {
      setDiagrams([]);
      return;
    }

    setLoadingDiagrams(true);
    try {
      const diagramRows = await getDiagramsByCategory(Number(categoryIdValue));
      setDiagrams(diagramRows);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Không thể tải danh sách diagram');
      setDiagrams([]);
    } finally {
      setLoadingDiagrams(false);
    }
  };

  const handleOpenGraph = async (diagram: Diagram) => {
    if (!selectedRootId || !selectedCategoryId) return;

    setGraphModalOpen(true);
    setSelectedDiagram(diagram);
    setLoadingGraph(true);
    setError('');

    try {
      const selectedCategory = categories.find((item) => item.id === Number(selectedCategoryId));
      const graph = await getKnowledgeGraphByDiagram({
        diagramId: diagram.id,
        rootCategoryId: selectedRootId,
        categoryName: selectedCategory?.name,
      });
      setGraphData(graph);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Không thể tải đồ thị tri thức');
      setGraphData(null);
    } finally {
      setLoadingGraph(false);
    }
  };

  const positionedNodes = useMemo(() => {
    if (!graphData?.graph?.nodes) return [];
    return buildNodePositions(graphData.graph.nodes);
  }, [graphData]);

  useEffect(() => {
    if (!positionedNodes.length) {
      setPositions({});
      return;
    }

    const initialPositions: Record<string, Point> = {};
    positionedNodes.forEach((node) => {
      initialPositions[node.id] = { x: node.x, y: node.y };
    });
    setPositions(initialPositions);
  }, [positionedNodes]);

  useEffect(() => {
    const handleBrowserZoomConflict = (event: WheelEvent) => {
      if (!graphModalOpen) return;
      if (!event.ctrlKey) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (!graphCanvasRef.current?.contains(target)) return;

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    document.addEventListener('wheel', handleBrowserZoomConflict, { passive: false, capture: true });
    return () => {
      document.removeEventListener('wheel', handleBrowserZoomConflict, true);
    };
  }, [graphModalOpen]);

  const positionedNodeMap = useMemo(() => {
    const map = new Map<string, Point>();
    Object.entries(positions).forEach(([nodeId, point]) => map.set(nodeId, point));
    return map;
  }, [positions]);

  const handleCloseModal = () => {
    setGraphModalOpen(false);
    setDraggingNodeId(null);
    setDragLastPoint(null);
    setIsPanning(false);
    setPanLastScreenPoint(null);
    setDiagramImageOpen(false);
    setDescriptionOpen(false);
  };

  const handleOpenPdf = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!selectedDiagram?.path_pdf) return;
    window.open(selectedDiagram.path_pdf, '_blank', 'noopener,noreferrer');
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const zoomFactor = event.deltaY < 0 ? 1.12 : 0.9;
    const newZoom = clamp(zoom * zoomFactor, 0.35, 2.8);

    const worldPoint = toGraphPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY, pan, zoom);
    const newPan = {
      x: event.nativeEvent.offsetX - worldPoint.x * newZoom,
      y: event.nativeEvent.offsetY - worldPoint.y * newZoom,
    };

    setZoom(newZoom);
    setPan(newPan);
  };

  const handleWheelCapture = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (event.target instanceof SVGCircleElement || event.target instanceof SVGTextElement) {
      return;
    }

    setIsPanning(true);
    setPanLastScreenPoint({ x: event.clientX, y: event.clientY });
  };

  const handleNodeMouseDown = (nodeId: string, event: React.MouseEvent<SVGCircleElement>) => {
    event.stopPropagation();
    const graphPoint = toGraphPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY, pan, zoom);
    setDraggingNodeId(nodeId);
    setDragLastPoint(graphPoint);
  };

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNodeId && dragLastPoint) {
      const current = toGraphPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY, pan, zoom);
      const dx = current.x - dragLastPoint.x;
      const dy = current.y - dragLastPoint.y;

      setPositions((prev) => {
        const currentNode = prev[draggingNodeId];
        if (!currentNode) return prev;
        return {
          ...prev,
          [draggingNodeId]: {
            x: currentNode.x + dx,
            y: currentNode.y + dy,
          },
        };
      });

      setDragLastPoint(current);
      return;
    }

    if (isPanning && panLastScreenPoint) {
      const dx = event.clientX - panLastScreenPoint.x;
      const dy = event.clientY - panLastScreenPoint.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanLastScreenPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleSvgMouseUp = () => {
    setDraggingNodeId(null);
    setDragLastPoint(null);
    setIsPanning(false);
    setPanLastScreenPoint(null);
  };

  const handleZoomIn = () => setZoom((prev) => clamp(prev * 1.2, 0.35, 2.8));
  const handleZoomOut = () => setZoom((prev) => clamp(prev * 0.84, 0.35, 2.8));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const resetPositions: Record<string, Point> = {};
    positionedNodes.forEach((node) => {
      resetPositions[node.id] = { x: node.x, y: node.y };
    });
    setPositions(resetPositions);
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card variant="outlined" sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Khám phá Diagram theo Category
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chọn RootCategory và Category để xem danh sách hình diagram. Nhấn vào hình để hiển thị đồ thị tri thức từ Root đến Diagram cùng toàn bộ node liên quan.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="root-select-label">RootCategory</InputLabel>
              <Select
                labelId="root-select-label"
                label="RootCategory"
                value={selectedRootId}
                onChange={(event) => handleSelectRoot(event.target.value)}
                disabled={loadingRoots}
              >
                {rootCategories.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                label="Category"
                value={selectedCategoryId}
                onChange={(event) => handleSelectCategory(Number(event.target.value) || '')}
                disabled={!selectedRootId || loadingCategories}
              >
                {categories.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} (#{item.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={`RootCategory: ${selectedRootId || 'Chưa chọn'}`} />
            <Chip size="small" label={`Category: ${selectedCategoryId || 'Chưa chọn'}`} />
            <Chip size="small" label={`Diagrams: ${diagrams.length}`} />
            <Chip
              size="small"
              label={`Graph Nodes: ${selectedDiagram ? (graphData?.summary?.node_count ?? 0) : 0}`}
              color={selectedDiagram && graphData ? 'primary' : 'default'}
            />
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Card>

      <Card variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Diagram thuộc Category
        </Typography>

        {(loadingDiagrams || loadingCategories || loadingRoots) && (
          <Grid container spacing={2}>
            {[1, 2, 3].map((key) => (
              <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={240} />
              </Grid>
            ))}
          </Grid>
        )}

        {!loadingDiagrams && diagrams.length === 0 && selectedCategoryId && (
          <Alert severity="info">Category này chưa có diagram.</Alert>
        )}

        {!selectedCategoryId && <Alert severity="info">Vui lòng chọn Category để xem danh sách diagram.</Alert>}

        <Grid container spacing={2}>
          {diagrams.map((diagram) => {
            const isSelected = selectedDiagram?.id === diagram.id && graphModalOpen;
            return (
              <Grid key={diagram.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  onClick={() => handleOpenGraph(diagram)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={toAbsoluteUrl(diagram.image_path) || '/assets/images/cover/cover-1.webp'}
                    alt={diagram.id}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Diagram: {diagram.id}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Category ID: {diagram.category_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {truncateText(diagram.description, 100)}
                    </Typography>
                    {diagram.path_pdf && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PictureAsPdfIcon fontSize="small" />}
                        sx={{
                          mt: 1,
                          color: 'error.main',
                          borderColor: 'error.light',
                          '&:hover': {
                            borderColor: 'error.main',
                            bgcolor: 'rgba(220, 38, 38, 0.08)',
                          },
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          window.open(diagram.path_pdf, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        Tài liệu tham khảo
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Card>

      <Dialog open={graphModalOpen} onClose={handleCloseModal} fullWidth maxWidth="xl">
        <DialogTitle sx={{ pb: 1, bgcolor: 'background.paper', color: 'text.primary' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="h6">Đồ thị tri thức: {selectedDiagram?.id || '-'}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={handleZoomOut}>Zoom -</Button>
              <Button variant="outlined" size="small" onClick={handleZoomIn}>Zoom +</Button>
              <Button variant="outlined" size="small" onClick={handleResetView}>Reset</Button>
              <IconButton onClick={handleCloseModal} size="small">✕</IconButton>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip size="small" label={`Zoom: ${zoom.toFixed(2)}x`} variant="outlined" />
            <Chip size="small" label="Kéo node để di chuyển" variant="outlined" />
            <Chip size="small" label="Kéo nền để pan" variant="outlined" />
            <Chip size="small" label="Giữ Ctrl + lăn chuột để zoom" variant="outlined" />
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, bgcolor: 'background.paper' }}>
          {selectedDiagram && (
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Diagram {selectedDiagram.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category ID: {selectedDiagram.category_id}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ImageIcon fontSize="small" />}
                      onClick={() => setDiagramImageOpen(true)}
                      disabled={!selectedDiagramImageUrl}
                    >
                      Image
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DescriptionIcon fontSize="small" />}
                      onClick={() => setDescriptionOpen(true)}
                      disabled={!hasDescription}
                    >
                      Description
                    </Button>

                    {hasPdf && (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<PictureAsPdfIcon fontSize="small" />}
                        onClick={handleOpenPdf}
                      >
                        Tài liệu tham khảo
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}

          {loadingGraph && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Đang tải đồ thị từ Neo4j...</Typography>
            </Stack>
          )}

          {!loadingGraph && !graphData && (
            <Alert severity="warning">Chưa có dữ liệu đồ thị cho diagram đã chọn.</Alert>
          )}

          {graphData && (
            <Box
              ref={graphCanvasRef}
              onWheelCapture={handleWheelCapture}
              sx={{ width: '100%', overflow: 'hidden', border: '1px solid', borderColor: canvasBorder, borderRadius: 1.5, height: 760 }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
                onMouseDown={handleSvgMouseDown}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={handleSvgMouseUp}
                onWheel={handleWheel}
                style={{ cursor: draggingNodeId ? 'grabbing' : isPanning ? 'grabbing' : 'grab', background: canvasBackground }}
              >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {graphData.graph.edges.map((edge) => {
                    const source = positionedNodeMap.get(edge.from);
                    const target = positionedNodeMap.get(edge.to);
                    if (!source || !target) return null;

                    return (
                      <g key={edge.id}>
                        <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={edgeColor} strokeWidth={1.5} />
                        <text
                          x={(source.x + target.x) / 2}
                          y={(source.y + target.y) / 2 - 6}
                          fontSize="10"
                          fill={edgeLabelColor}
                          textAnchor="middle"
                        >
                          {edge.label}
                        </text>
                      </g>
                    );
                  })}

                  {positionedNodes.map((node) => {
                    const point = positionedNodeMap.get(node.id);
                    if (!point) return null;

                    const radius = node.type === 'diagram' ? 36 : 26;
                    const label = node.label.length > 14 ? `${node.label.slice(0, 14)}...` : node.label;

                    return (
                      <g key={node.id}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={radius}
                          fill={nodeColorByType[node.type] || '#64748B'}
                          opacity={0.95}
                          onMouseDown={(event) => handleNodeMouseDown(node.id, event)}
                        />
                        <text
                          x={point.x}
                          y={point.y - 3}
                          fontSize="10"
                          fill="#fff"
                          textAnchor="middle"
                          pointerEvents="none"
                          style={{ fontWeight: 600 }}
                        >
                          {node.type}
                        </text>
                        <text
                          x={point.x}
                          y={point.y + 11}
                          fontSize="10"
                          fill="#fff"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={diagramImageOpen} onClose={() => setDiagramImageOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pb: 1, bgcolor: 'background.paper', color: 'text.primary' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Xem hình diagram: {selectedDiagram?.id || '-'}</Typography>
            <IconButton onClick={() => setDiagramImageOpen(false)} size="small">
              ✕
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: 'background.paper' }}>
          {selectedDiagramImageUrl ? (
            <Box
              component="img"
              src={selectedDiagramImageUrl}
              alt={selectedDiagram?.id || 'diagram'}
              sx={{
                width: '100%',
                maxHeight: '72vh',
                objectFit: 'contain',
                display: 'block',
                mx: 'auto',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          ) : (
            <Box sx={{ p: 3 }}>
              <Alert severity="info">Diagram này chưa có image_path để phóng to.</Alert>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={descriptionOpen} onClose={() => setDescriptionOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1, bgcolor: 'background.paper', color: 'text.primary' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Description: {selectedDiagram?.id || '-'}</Typography>
            <IconButton onClick={() => setDescriptionOpen(false)} size="small">
              ✕
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: 'background.paper' }}>
          {hasDescription ? (
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                maxHeight: '64vh',
                overflow: 'auto',
                '& p': { mt: 0, mb: 1.25, lineHeight: 1.6 },
              }}
              dangerouslySetInnerHTML={{ __html: selectedDiagram?.description || '' }}
            />
          ) : (
            <Alert severity="info">Diagram này chưa có description.</Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
