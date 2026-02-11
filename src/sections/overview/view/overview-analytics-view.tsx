import { useState, useEffect } from 'react';

import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Snackbar,
  Tooltip,
} from '@mui/material';

import { 
  getAnalyticsData, 
  getSampleAnalyticsData, 
  exportAnalyticsToExcel,
  type UnitStats, 
  type StatsOverview 
} from 'src/services/analyticsService';

export function OverviewAnalyticsView() {
  const [unitsData, setUnitsData] = useState<UnitStats[]>([]);
  const [filteredData, setFilteredData] = useState<UnitStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [khoiFilter, setKhoiFilter] = useState('all');
  const [sortBy, setSortBy] = useState('selfScore'); // Mặc định sắp xếp theo điểm tự đánh giá
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Mặc định giảm dần
  const [statsOverview, setStatsOverview] = useState<StatsOverview>({
    totalUnits: 0,
    avgSelfScore: 0,
    avgThamDinhScore: 0,
    avgHieuTruongScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Function để load dữ liệu mẫu
  const loadSampleData = () => {
    const sampleData = getSampleAnalyticsData();
    const sortedData = sortData(sampleData.unitsData, 'selfScore', 'desc');
    setUnitsData(sortedData);
    setFilteredData(sortedData);
    setStatsOverview(sampleData.statsOverview);
    showSnackbar('Đang sử dụng dữ liệu mẫu', 'info');
  };

  // Hiển thị snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Fetch dữ liệu từ API
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getAnalyticsData();

      if (result.success) {
        // Sắp xếp dữ liệu ngay khi nhận được từ API
        const sortedData = sortData(result.unitsData, sortBy, sortOrder);
        setUnitsData(sortedData);
        setFilteredData(sortedData);
        setStatsOverview(result.statsOverview);
        
        if (result.totalFilesProcessed) {
          showSnackbar(`Đã tải ${result.totalFilesProcessed} đơn vị`, 'success');
        }
      } else {
        setError(result.message || 'Không thể tải dữ liệu thống kê');
      }
    } catch (err) {
      console.error('Error in fetchAnalyticsData:', err);
      setError('Lỗi khi kết nối đến server');
      
      // Fallback: sử dụng dữ liệu mẫu
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  // Hàm sắp xếp dữ liệu
  const sortData = (data: UnitStats[], sortField: string, order: 'asc' | 'desc') => 
    [...data].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortField) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          return order === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        
        case 'selfScore':
          valueA = a.selfScore;
          valueB = b.selfScore;
          break;
        
        case 'thamDinhScore':
          valueA = a.thamDinhScore;
          valueB = b.thamDinhScore;
          break;
        
        case 'hieuTruongScore':
          valueA = a.hieuTruongScore;
          valueB = b.hieuTruongScore;
          break;
        
        default:
          return 0;
      }
      
      // Sắp xếp điểm số
      if (order === 'desc') {
        return valueB - valueA; // Giảm dần
      } else {
        return valueA - valueB; // Tăng dần
      }
    });

  // Hàm xuất Excel
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      
      // Gọi API export
      const blob = await exportAnalyticsToExcel();
      
      // Tạo URL tải xuống
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Đặt tên file với timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.download = `ket-qua-danh-gia-${timestamp}.xlsx`;
      
      // Kích hoạt tải xuống
      document.body.appendChild(a);
      a.click();
      
      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSnackbar('Đã xuất file Excel thành công', 'success');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      showSnackbar('Lỗi khi xuất file Excel', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Đóng snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Lọc và sắp xếp dữ liệu
  useEffect(() => {
    filterAndSortData();
  }, [searchTerm, khoiFilter, sortBy, sortOrder, unitsData]);

  const filterAndSortData = () => {
    let filtered = unitsData.filter((unit) => {
      const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKhoi =
        khoiFilter === 'all' ||
        unit.khoi === (khoiFilter === 'giang_day' ? 'Giảng dạy' : 'Hành chính');
      return matchesSearch && matchesKhoi;
    });

    // Sắp xếp dữ liệu
    filtered = sortData(filtered, sortBy, sortOrder);
    setFilteredData(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleKhoiFilterChange = (event: SelectChangeEvent) => {
    setKhoiFilter(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    // Xử lý giá trị có thể chứa thông tin thứ tự sắp xếp
    if (value.startsWith('selfScore')) {
      setSortBy('selfScore');
      setSortOrder(value === 'selfScore_desc' ? 'desc' : 'asc');
    } else if (value.startsWith('thamDinhScore')) {
      setSortBy('thamDinhScore');
      setSortOrder(value === 'thamDinhScore_desc' ? 'desc' : 'asc');
    } else if (value.startsWith('hieuTruongScore')) {
      setSortBy('hieuTruongScore');
      setSortOrder(value === 'hieuTruongScore_desc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortOrder('asc'); // Mặc định tăng dần cho tên
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  // Hàm render màu sắc cho điểm số
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'warning';
    return 'error';
  };

  // Hàm lấy icon hiển thị thứ tự sắp xếp
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '';
    return sortOrder === 'desc' ? ' ↓' : ' ↑';
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        gap: 2 
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Đang tải dữ liệu thống kê...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

      {/* Header với tiêu đề và các nút chức năng */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Tổng quan đánh giá đơn vị
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexDirection: isMobile ? 'row' : 'row',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          <Tooltip title="Xuất Excel">
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={exportLoading || unitsData.length === 0}
              sx={{ 
                minWidth: isMobile ? '48%' : 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              {exportLoading ? 'Đang xuất...' : 'Xuất Excel'}
            </Button>
          </Tooltip>
          
          <Tooltip title="Làm mới dữ liệu">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{ 
                minWidth: isMobile ? '48%' : 'auto',
                whiteSpace: 'nowrap'
              }}
            >
              Làm mới
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadSampleData}
            >
              Dùng dữ liệu mẫu
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Thống kê tổng quan */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ flex: 1, minWidth: isMobile ? '100%' : '200px' }}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Tổng số đơn vị
              </Typography>
              <Typography variant="h4" component="div">
                {statsOverview.totalUnits}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filteredData.length} đang hiển thị
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: isMobile ? '100%' : '200px' }}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Điểm TB tự đánh giá
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {statsOverview.avgSelfScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trung bình toàn hệ thống
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: isMobile ? '100%' : '200px' }}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Điểm TB thẩm định
              </Typography>
              <Typography variant="h4" component="div" color="secondary">
                {statsOverview.avgThamDinhScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Chờ thẩm định
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: isMobile ? '100%' : '200px' }}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Điểm TB hiệu trưởng
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {statsOverview.avgHieuTruongScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Chờ phê duyệt
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Bộ lọc và tìm kiếm */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
            alignItems: isMobile ? 'stretch' : 'flex-end',
          }}
        >
          <TextField
            label="Tìm kiếm đơn vị"
            value={searchTerm}
            onChange={handleSearchChange}
            fullWidth={isMobile}
            sx={{
              minWidth: isMobile ? '100%' : 300,
              '& .MuiInputBase-root': {
                borderRadius: 1,
              },
            }}
            placeholder="Nhập tên đơn vị cần tìm..."
          />
          <FormControl
            sx={{
              minWidth: isMobile ? '100%' : 150,
              '& .MuiInputBase-root': {
                borderRadius: 1,
              },
            }}
          >
            <InputLabel>Khối</InputLabel>
            <Select 
              value={khoiFilter} 
              label="Khối" 
              onChange={handleKhoiFilterChange}
            >
              <MenuItem value="all">Tất cả khối</MenuItem>
              <MenuItem value="giang_day">Khối giảng dạy</MenuItem>
              <MenuItem value="hanh_chinh">Khối hành chính</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            sx={{
              minWidth: isMobile ? '100%' : 200,
              '& .MuiInputBase-root': {
                borderRadius: 1,
              },
            }}
          >
            <InputLabel>Sắp xếp theo</InputLabel>
            <Select 
              value={sortBy === 'selfScore' ? 'selfScore_desc' : 
                     sortBy === 'thamDinhScore' ? 'thamDinhScore_desc' :
                     sortBy === 'hieuTruongScore' ? 'hieuTruongScore_desc' : sortBy}
              label="Sắp xếp theo" 
              onChange={handleSortChange}
            >
              <MenuItem value="name">Tên đơn vị (A-Z)</MenuItem>
              <MenuItem value="selfScore_desc">Điểm tự đánh giá (cao → thấp)</MenuItem>
              <MenuItem value="selfScore_asc">Điểm tự đánh giá (thấp → cao)</MenuItem>
              <MenuItem value="thamDinhScore_desc">Điểm thẩm định (cao → thấp)</MenuItem>
              <MenuItem value="thamDinhScore_asc">Điểm thẩm định (thấp → cao)</MenuItem>
              <MenuItem value="hieuTruongScore_desc">Điểm hiệu trưởng (cao → thấp)</MenuItem>
              <MenuItem value="hieuTruongScore_asc">Điểm hiệu trưởng (thấp → cao)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Bảng thống kê */}
      <Paper
        elevation={1}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mb: 2
        }}
      >
        <TableContainer sx={{ maxHeight: isMobile ? 400 : 600 }}>
          <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    width: '50px'
                  }}
                >
                  STT
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    width: '100px'
                  }}
                >
                  Khối
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  Tên đơn vị
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    width: '120px'
                  }}
                >
                  Tự đánh giá{getSortIcon('selfScore')}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    width: '120px'
                  }}
                >
                  Thẩm định{getSortIcon('thamDinhScore')}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    width: '120px'
                  }}
                >
                  Hiệu trưởng{getSortIcon('hieuTruongScore')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((unit, index) => (
                <TableRow
                  key={unit.id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2">{index + 1}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={unit.khoi} 
                      color={unit.khoi === 'Giảng dạy' ? 'primary' : 'secondary'} 
                      size="small" 
                      variant="filled"
                      sx={{ 
                        fontWeight: 'medium',
                        fontSize: '0.75rem'
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {unit.name}
                    </Typography>
                    {unit.staffCode && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {unit.staffCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={unit.selfScore.toFixed(1)} 
                      color={getScoreColor(unit.selfScore)} 
                      variant="filled"
                      size="small"
                      sx={{ 
                        minWidth: '60px',
                        fontWeight: 'bold'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={unit.thamDinhScore > 0 ? unit.thamDinhScore.toFixed(1) : '—'}
                      color={unit.thamDinhScore > 0 ? getScoreColor(unit.thamDinhScore) : 'default'}
                      variant={unit.thamDinhScore > 0 ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ 
                        minWidth: '60px',
                        fontWeight: unit.thamDinhScore > 0 ? 'bold' : 'normal'
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={unit.hieuTruongScore > 0 ? unit.hieuTruongScore.toFixed(1) : '—'}
                      color={unit.hieuTruongScore > 0 ? getScoreColor(unit.hieuTruongScore) : 'default'}
                      variant={unit.hieuTruongScore > 0 ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ 
                        minWidth: '60px',
                        fontWeight: unit.hieuTruongScore > 0 ? 'bold' : 'normal'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Thông báo không có dữ liệu */}
      {filteredData.length === 0 && (
        <Paper
          elevation={1}
          sx={{
            p: 4,
            textAlign: 'center',
            mt: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không tìm thấy đơn vị nào phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </Typography>
        </Paper>
      )}

      {/* Footer với thông tin tổng hợp */}
      <Box sx={{ 
        mt: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Typography variant="body2" color="text.secondary">
          Hiển thị <strong>{filteredData.length}</strong> trong tổng số <strong>{unitsData.length}</strong> đơn vị
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Điểm TB:</strong> {statsOverview.avgSelfScore.toFixed(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Thẩm định:</strong> {statsOverview.avgThamDinhScore.toFixed(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Hiệu trưởng:</strong> {statsOverview.avgHieuTruongScore.toFixed(1)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default OverviewAnalyticsView;