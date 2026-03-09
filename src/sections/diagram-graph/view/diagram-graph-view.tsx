import { useMemo, useState, useEffect } from 'react';

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
  const [graphTheme, setGraphTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('diagram-graph-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const isDarkTheme = graphTheme === 'dark';
  const nodeColorByType = isDarkTheme ? nodeColorByTypeDark : nodeColorByTypeLight;
  const edgeColor = isDarkTheme ? '#64748B' : '#94A3B8';
  const edgeLabelColor = isDarkTheme ? '#CBD5E1' : '#475569';
  const canvasBackground = isDarkTheme ? '#0F172A' : '#F8FAFC';
  const canvasBorder = isDarkTheme ? '#334155' : '#CBD5E1';

  const modalHintChipSx = isDarkTheme
    ? {
        color: '#FFFFFF',
        borderColor: '#64748B',
        backgroundColor: '#1E293B',
      }
    : undefined;

  const toggleGraphTheme = () => {
    setGraphTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('diagram-graph-theme', next);
      return next;
    });
  };

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
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();

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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Diagram: {diagram.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category ID: {diagram.category_id}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Card>

      <Dialog open={graphModalOpen} onClose={handleCloseModal} fullWidth maxWidth="xl">
        <DialogTitle sx={{ pb: 1, bgcolor: isDarkTheme ? '#111827' : 'background.paper', color: isDarkTheme ? '#E5E7EB' : 'text.primary' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="h6">Đồ thị tri thức: {selectedDiagram?.id || '-'}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={toggleGraphTheme}>Theme {isDarkTheme ? 'Sáng' : 'Tối'}</Button>
              <Button variant="outlined" size="small" onClick={handleZoomOut}>Zoom -</Button>
              <Button variant="outlined" size="small" onClick={handleZoomIn}>Zoom +</Button>
              <Button variant="outlined" size="small" onClick={handleResetView}>Reset</Button>
              <IconButton onClick={handleCloseModal} size="small" sx={{ color: isDarkTheme ? '#E5E7EB' : 'inherit' }}>✕</IconButton>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip size="small" label={`Zoom: ${zoom.toFixed(2)}x`} variant="outlined" sx={modalHintChipSx} />
            <Chip size="small" label="Kéo node để di chuyển" variant="outlined" sx={modalHintChipSx} />
            <Chip size="small" label="Kéo nền để pan" variant="outlined" sx={modalHintChipSx} />
            <Chip size="small" label="Lăn chuột để zoom" variant="outlined" sx={modalHintChipSx} />
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, bgcolor: isDarkTheme ? '#111827' : 'background.paper' }}>
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
            <Box sx={{ width: '100%', overflow: 'hidden', border: '1px solid', borderColor: canvasBorder, borderRadius: 1.5, height: 760 }}>
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
    </Box>
  );
}
