import React, {useEffect} from 'react';

import { 
  Upload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon
 } from '@mui/icons-material';
import {
  Box,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import {
  UploadedFileInfo,
  EvaluationSubSubItem,
  EvaluationSubItem,
  EvaluationItem,
  EvaluationSection,
  EvidenceUploadProps
} from 'src/services/type';
// ----------------------------------------------------------------------


type Props = {
  title: string;
  sections: EvaluationSection[];
  onScoreUpdate: (sectionIndex: number, itemId: string, scores: { selfScore?: number; principalScore?: number }) => Promise<any>;
  onSingleChoiceUpdate: (sectionIndex: number, itemId: string, selectedOption: string, scores: { selfScore: number; principalScore?: number }) => Promise<any>;
  onHasContentScoreUpdate: (sectionIndex: number, itemId: string, contentIndex: number, scores: { selfScore: number; principalScore?: number }) => Promise<any>;
  onEvidenceUpload: (sectionIndex: number, itemId: string, files: File[]) => Promise<UploadedFileInfo[]>;
  onEvidenceRemove?: (sectionIndex: number, itemId: string, fileIndex: number) => void;
  onJustificationUpdate: (sectionIndex: number, itemId: string, justification: string) => Promise<any>;
};

// ----------------------------------------------------------------------

const HTMLContent = ({ content }: { content: string }) => (
  <Box
    sx={{
      '& ul': { margin: 0, paddingLeft: 2, mb: 1 },
      '& li': { marginBottom: 0.5, lineHeight: 1.5 },
      '& p': { margin: 0, mb: 1, lineHeight: 1.5 },
      '& .ql-editor': { padding: 0 },
      fontSize: '0.875rem',
      lineHeight: 1.5,
    }}
    dangerouslySetInnerHTML={{ __html: content }}
  />
);

// Thêm component ConfirmDeleteModal
const ConfirmDeleteModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  fileName 
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }
    }}
  >
    <DialogTitle sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      backgroundColor: 'error.light',
      color: 'error.contrastText',
      py: 2
    }}>
      <WarningIcon sx={{ fontSize: 28 }} />
      <Typography variant="h6" component="span" fontWeight="bold">
        Xác nhận xóa file
      </Typography>
    </DialogTitle>
    
    <DialogContent sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            backgroundColor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'error.main'
          }}
        >
          <DeleteIcon />
        </Box>
        <Box>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            Bạn có chắc chắn muốn xóa file này?
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontFamily: 'monospace',
              backgroundColor: 'grey.100',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              display: 'inline-block'
            }}
          >
            {fileName}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ 
        backgroundColor: 'warning.light', 
        p: 2, 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'warning.main'
      }}>
        <Typography variant="body2" color="warning.dark" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <WarningIcon sx={{ fontSize: 16, mt: 0.25 }} />
          <span>
            <strong>Lưu ý:</strong> File sẽ chỉ được xóa vật lý khỏi hệ thống khi bạn lưu nháp hoặc nộp phiếu đánh giá. 
            Nếu bạn reload trang mà chưa lưu, file sẽ vẫn hiển thị.
          </span>
        </Typography>
      </Box>
    </DialogContent>
    
    <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{
          borderRadius: 2,
          px: 3,
          textTransform: 'none',
          fontWeight: 'medium'
        }}
      >
        Hủy bỏ
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="error"
        startIcon={<DeleteIcon />}
        sx={{
          borderRadius: 2,
          px: 3,
          textTransform: 'none',
          fontWeight: 'medium',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: 'error.dark'
          }
        }}
      >
        Xóa file
      </Button>
    </DialogActions>
  </Dialog>
);

// Cập nhật component SingleChoiceSelector để hiển thị đúng option đã chọn
const SingleChoiceSelector = ({ 
  options, 
  currentScore, // Nhận selfScore thay vì selectedValue
  onSelect,
  level = 0
}: { 
  options: { content: string; points: string }[];
  currentScore?: number; // selfScore hiện tại
  onSelect: (value: string) => void;
  level?: number;
}) => {
  const paddingLeft = level * 2;

  // Tìm option đã chọn dựa vào currentScore (selfScore)
  const findSelectedOption = () => {
    if (currentScore === undefined || currentScore === null) return '';
    
    // Tìm option có points bằng với currentScore
    const selectedOption = options.find(option => 
      parseFloat(option.points) === currentScore
    );
    
    return selectedOption ? selectedOption.points : '';
  };

  const currentSelectedValue = findSelectedOption();

  console.log('SingleChoiceSelector Debug:', {
    currentScore,
    currentSelectedValue,
    options: options.map(opt => ({ 
      content: opt.content, 
      points: opt.points,
      pointsFloat: parseFloat(opt.points)
    }))
  });

  return (
    <FormControl component="fieldset" sx={{ width: '100%', pl: paddingLeft }}>
      <RadioGroup 
        value={currentSelectedValue} 
        onChange={(e) => {
          console.log('Radio selected - sending points:', e.target.value);
          onSelect(e.target.value);
        }}
      >
        {options.map((option, index) => (
          <FormControlLabel
            key={index}
            value={option.points}
            control={<Radio size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {option.content}
                </Typography>
                <Chip 
                  label={`${option.points} điểm`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            }
            sx={{ 
              mb: 1,
              '& .MuiFormControlLabel-label': { flex: 1 }
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

const EvidenceUpload = ({ 
  files, 
  onFilesChange,
  onFileRemove,
  onUpload,
  sectionIndex,
  itemId
}: { 
  files: UploadedFileInfo[];
  onFilesChange: (files: UploadedFileInfo[]) => void;
  onFileRemove: (index: number) => void;
  onUpload: (files: File[]) => Promise<UploadedFileInfo[]>;
  sectionIndex: number;
  itemId: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<{ index: number; fileName: string } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []) as File[];
    
    if (selectedFiles.length > 0 && onUpload) {
      setUploading(true);
      try {
        const uploadedFiles = await onUpload(selectedFiles);
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          onFilesChange([...files, ...uploadedFiles]);
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Lỗi khi tải lên file. Vui lòng thử lại.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveFileClick = (index: number, fileName: string) => {
    setFileToDelete({ index, fileName });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      // Chỉ gọi hàm xóa trong form data, không gọi API xóa file
      onFileRemove(fileToDelete.index);
      setDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setFileToDelete(null);
  };

  return (
    <Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
        disabled={uploading}
      >
        {uploading ? 'Đang tải lên...' : `Tải lên (${files.length})`}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quản lý minh chứng</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="evidence-upload"
              disabled={uploading}
            />
            <label htmlFor="evidence-upload">
              <Button 
                variant="contained" 
                component="span" 
                startIcon={uploading ? <CircularProgress size={16} /> : <AddIcon />} 
                fullWidth
                disabled={uploading}
              >
                {uploading ? 'Đang tải lên...' : 'Thêm minh chứng'}
              </Button>
            </label>
          </Box>

          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {files.map((file, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  mb: 1,
                  border: 1,
                  borderColor: 'grey.300',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    {file.originalname}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)} • {file.mimetype}
                  </Typography>
                  {file.url && (
                    <Button 
                      size="small" 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ mt: 0.5 }}
                    >
                      Xem file
                    </Button>
                  )}
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => handleRemoveFileClick(index, file.originalname)} 
                  color="error"
                  disabled={uploading}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            {files.length === 0 && !uploading && (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Chưa có minh chứng nào được tải lên
              </Typography>
            )}
            {uploading && (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Đang tải lên file...
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploading}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        fileName={fileToDelete?.fileName || ''}
      />
    </Box>
  );
};

// Helper function để format kích thước file
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Cập nhật HasContentItemRow để hiển thị đúng điểm số đã chọn
const HasContentItemRow = ({ 
  item, 
  sectionIndex, 
  itemIndex,
  onScoreChange,
  onOptionSelect
}: { 
  item: EvaluationItem; 
  sectionIndex: number; 
  itemIndex: number;
  onScoreChange: (sectionIndex: number, itemIndex: number, subIndex: number, type: 'selfScore', value: number) => void;
  onOptionSelect: (sectionIndex: number, itemIndex: number, subIndex: number, value: string) => void;
}) => {

  useEffect(() => {
    console.log('HasContentItemRow Debug:', {
      itemId: item.id,
      totalSelfScore: item.selfScore,
      hasContent: item.hasContent?.map((content, idx) => ({
        index: idx,
        content: content.content,
        selfScore: content.selfScore,
        points: content.points,
        hasType: content.hasType
      }))
    });
  }, [item]);
  
  // Đảm bảo selfScore được hiển thị đúng
  const displaySelfScore = item.selfScore || 0;

  return (
    <>
      <TableRow>
        <TableCell sx={{ py: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {item.id}. {item.title}
          </Typography>
          <HTMLContent content={item.content} />
        </TableCell>
        <TableCell sx={{ py: 2 }}>
          <Typography variant="body2" color="primary.main" fontWeight="medium">
            {item.points}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1 }}>
          {/* Hiển thị tổng điểm từ các sub-items (readonly) */}
          <TextField
            type="number"
            size="small"
            value={displaySelfScore}
            inputProps={{ 
              min: 0,
              style: { textAlign: 'center' }
            }}
            sx={{ width: 80 }}
            disabled
          />
        </TableCell>
        <TableCell sx={{ py: 1 }}>
          {item.hasEvidence && (
            <Button variant="outlined" size="small" startIcon={<UploadIcon />}>
              Tải lên
            </Button>
          )}
        </TableCell>
      </TableRow>
      
      {/* Render các sub-items trong hasContent */}
      {item.hasContent?.map((subItem, subIndex) => {
        // Đảm bảo selfScore được hiển thị đúng cho từng sub-item
        const subItemSelfScore = subItem.selfScore || 0;
        
        return (
          <TableRow key={subIndex}>
            <TableCell sx={{ py: 1.5, pl: 4 }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                • {subItem.content}
              </Typography>
              
              {/* Single-choice selector cho sub-items */}
              {subItem.hasType === 'single-choice' && subItem.subItems && (
                <SingleChoiceSelector
                  options={subItem.subItems}
                  currentScore={subItem.selfScore}
                  onSelect={(value) => onOptionSelect(sectionIndex, itemIndex, subIndex, value)}
                  level={1}
                />
              )}
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
              <Typography variant="body2" color="primary.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                {subItem.points}
              </Typography>
            </TableCell>
            <TableCell sx={{ py: 1 }}>
              {subItem.hasType === 'single-choice' ? (
                <TextField
                  type="number"
                  size="small"
                  value={subItemSelfScore}
                  inputProps={{ 
                    min: 0,
                    style: { textAlign: 'center' }
                  }}
                  sx={{ width: 80 }}
                  disabled
                />
              ) : (
                <TextField
                  type="number"
                  size="small"
                  value={subItemSelfScore}
                  onChange={(e) => onScoreChange(sectionIndex, itemIndex, subIndex, 'selfScore', Number(e.target.value))}
                  inputProps={{ 
                    min: 0,
                    style: { textAlign: 'center' }
                  }}
                  sx={{ width: 80 }}
                />
              )}
            </TableCell>
            <TableCell sx={{ py: 1.5 }} />
          </TableRow>
        );
      })}
    </>
  );
};

const SubItemRow = ({ 
  subItem, 
  level = 0,
  sectionIndex,
  itemIndex,
  subIndex,
  onScoreChange,
  onOptionSelect
}: { 
  subItem: EvaluationSubItem; 
  level?: number;
  sectionIndex: number;
  itemIndex: number;
  subIndex: number;
  onScoreChange: (sectionIndex: number, itemIndex: number, subIndex: number, type: 'selfScore', value: number) => void;
  onOptionSelect: (sectionIndex: number, itemIndex: number, subIndex: number, option: string) => void;
}) => {
  const paddingLeft = level * 2 + 2;
  
  return (
    <TableRow>
      <TableCell sx={{ py: 1.5, pl: paddingLeft }}>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          • {subItem.content}
        </Typography>
        
        {subItem.hasType === 'single-choice' && subItem.subItems && (
          <SingleChoiceSelector
            options={subItem.subItems}
            currentScore={subItem.selfScore}
            onSelect={(option) => onOptionSelect(sectionIndex, itemIndex, subIndex, option)}
            level={1}
          />
        )}
      </TableCell>
      <TableCell sx={{ py: 1.5 }}>
        <Typography variant="body2" color="primary.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
          {subItem.points}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1 }}>
        {subItem.hasType === 'single-choice' ? (
          <TextField
            type="number"
            size="small"
            value={subItem.selfScore || 0}
            inputProps={{ style: { textAlign: 'center' }}}
            sx={{ width: 80 }}
            disabled
          />
        ) : (
          <TextField
            type="number"
            size="small"
            value={subItem.selfScore || 0}
            onChange={(e) => onScoreChange(sectionIndex, itemIndex, subIndex, 'selfScore', Number(e.target.value))}
            inputProps={{ style: { textAlign: 'center' }}}
            sx={{ width: 80 }}
          />
        )}
      </TableCell>
      <TableCell sx={{ py: 1.5 }} />
    </TableRow>
  );
};

// Cập nhật BonusItemRow để hiển thị đúng justification và evidence files
const BonusItemRow = ({ 
  item, 
  sectionIndex, 
  itemIndex,
  onJustificationChange,
  onEvidenceChange,
  onEvidenceRemove,
  onScoreChange,
  onEvidenceUpload,
}: { 
  item: EvaluationItem; 
  sectionIndex: number; 
  itemIndex: number;
  onJustificationChange: (sectionIndex: number, itemIndex: number, justification: string) => void;
  onEvidenceChange: (sectionIndex: number, itemIndex: number, files: UploadedFileInfo[]) => void;
  onEvidenceRemove: (sectionIndex: number, itemIndex: number, fileIndex: number) => void;
  onScoreChange: (sectionIndex: number, itemIndex: number, type: 'selfScore', value: number) => void;
  onEvidenceUpload: (sectionIndex: number, itemId: string, files: File[]) => Promise<UploadedFileInfo[]>;
}) => {
  // Đảm bảo các giá trị được hiển thị đúng
  const displaySelfScore = item.selfScore || 0;
  const displayJustification = item.justification || '';
  const displayEvidenceFiles = item.evidenceFiles || [];

  return (
    <TableRow>
      <TableCell sx={{ py: 2 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {item.id}. {item.title}
        </Typography>
        <HTMLContent content={item.content} />
        
        <Box sx={{ mt: 2 }}>
          <TextField
            multiline
            rows={3}
            value={displayJustification}
            onChange={(e) => onJustificationChange(sectionIndex, itemIndex, e.target.value)}
            placeholder="Nhập nội dung chi tiết"
            fullWidth
            sx={{
              maxWidth: { xs: '100%', sm: '700px' },
              '& .MuiOutlinedInput-root': {
                '& textarea': {
                  resize: 'vertical',
                  minHeight: '50px',
                }
              },
              '& .MuiOutlinedInput-input': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }
            }}
            size="small"
          />
        </Box>
      </TableCell>
      
      <TableCell sx={{ py: 2 }}>
        <Typography variant="body2" color="primary.main" fontWeight="medium">
          {item.points}
        </Typography>
      </TableCell>
      
      <TableCell sx={{ py: 1 }}>
        <TextField
          type="number"
          size="small"
          value={displaySelfScore}
          onChange={(e) => onScoreChange(sectionIndex, itemIndex, 'selfScore', Number(e.target.value))}
          inputProps={{ 
            min: 0,
            max: 10,
            step: item.id === "3.3" ? 1 : 2,
            style: { textAlign: 'center' }
          }}
          sx={{ width: 80 }}
        />
      </TableCell>
      
      <TableCell sx={{ py: 1 }}>
        <EvidenceUpload
          files={displayEvidenceFiles}
          onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, files)}
          onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, fileIndex)}
          onUpload={(files) => onEvidenceUpload(sectionIndex, item.id, files)}
          sectionIndex={sectionIndex}
          itemId={item.id}
        />
      </TableCell>
    </TableRow>
  );
};

export function EvaluateFormBody({ title, sections, onScoreUpdate, onJustificationUpdate, onEvidenceUpload, onEvidenceRemove, ...other }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [evaluationData, setEvaluationData] = React.useState<EvaluationSection[]>(sections);

  const handleOptionSelect = async (
    sectionIndex: number, 
    itemIndex: number, 
    subIndex?: number, 
    optionValue: string = '0' // optionValue là points (string)
  ) => {
    try {
      console.log('handleOptionSelect called:', { sectionIndex, itemIndex, subIndex, optionValue });

      const scoreValue = parseFloat(optionValue);
      const item = evaluationData[sectionIndex].items[itemIndex];
      
      // TÍNH TOÁN TỔNG ĐIỂM VÀ TẤT CẢ SUB-ITEM SCORES
      let newTotalScore = 0;
      const allSubItemScores: { [key: number]: number } = {};
      
      if (subIndex !== undefined && item.hasContent) {
        console.log('Updating hasContent sub-item:', { subIndex, scoreValue });
        
        // Tạo bản sao để tính toán
        const tempHasContent = [...item.hasContent];
        tempHasContent[subIndex].selfScore = scoreValue; // CẬP NHẬT selfScore CHO SUB-ITEM
        
        // TÍNH TỔNG ĐIỂM VÀ THU THẬP TẤT CẢ SUB-ITEM SCORES
        tempHasContent.forEach((content, idx) => {
          const contentScore = content.selfScore || 0;
          allSubItemScores[idx] = contentScore;
          newTotalScore += contentScore;
        });
        
        console.log('Calculated subItemScores:', allSubItemScores);
        console.log('Calculated total score:', newTotalScore);
      } else {
        newTotalScore = scoreValue;
      }

      // GỬI CẢ HAI: điểm cho item chính VÀ tất cả sub-item scores
      const scores = { 
        selfScore: newTotalScore, // Tổng điểm cho item chính
        subItemScores: Object.keys(allSubItemScores).length > 0 ? allSubItemScores : undefined
      };

      console.log('Sending to API:', scores);

      if (onScoreUpdate) {
        await onScoreUpdate(sectionIndex, item.id, scores);
      }

      setEvaluationData(prev => {
        const newData = JSON.parse(JSON.stringify(prev));

        
        if (subIndex !== undefined && newData[sectionIndex].items[itemIndex].hasContent) {
          // Cập nhật cho sub-item trong hasContent
          newData[sectionIndex].items[itemIndex].hasContent![subIndex].selfScore = scoreValue;

          console.log('newData[sectionIndex].items[itemIndex].hasContent![subIndex].selfScore', newData[sectionIndex].items[itemIndex].hasContent![subIndex].selfScore);
          
          // TÍNH LẠI TỔNG ĐIỂM CHO ITEM CHÍNH
          const totalSelfScore = newData[sectionIndex].items[itemIndex].hasContent!.reduce(
            (sum: number, content: any) => sum + (content.selfScore || 0), 
            0
          );
          
          newData[sectionIndex].items[itemIndex].selfScore = totalSelfScore;
          
          console.log('Updated state - hasContent:', {
            subIndex,
            subItemScore: newData[sectionIndex].items[itemIndex].hasContent![subIndex].selfScore,
            totalScore: totalSelfScore
          });
        } else if (subIndex !== undefined) {
          // Cập nhật cho sub-item thông thường
          newData[sectionIndex].items[itemIndex].subItems![subIndex].selfScore = scoreValue;
        } else {
          // Cập nhật cho item chính
          newData[sectionIndex].items[itemIndex].selfScore = scoreValue;
        }
        
        return newData;
      });
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const handleScoreChange = async (
    sectionIndex: number, 
    itemIndex: number, 
    subIndex?: number, 
    type: 'selfScore' = 'selfScore', 
    value: number = 0
  ) => {
    try {
      const item = evaluationData[sectionIndex].items[itemIndex];
      const scores = { [type]: value };

      if (onScoreUpdate) {
        await onScoreUpdate(sectionIndex, item.id, scores);
      }

      setEvaluationData(prev => {
        const newData = JSON.parse(JSON.stringify(prev));
        
        if (subIndex !== undefined) {
          // Thay đổi điểm cho sub-item trong hasContent hoặc subItems thông thường
          if (newData[sectionIndex].items[itemIndex].hasContent) {
            newData[sectionIndex].items[itemIndex].hasContent![subIndex][type] = value;
          } else {
            newData[sectionIndex].items[itemIndex].subItems![subIndex][type] = value;
          }
        } else {
          newData[sectionIndex].items[itemIndex][type] = value;
        }
        
        return newData;
      });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleJustificationChange = (
  sectionIndex: number, 
  itemIndex: number, 
  justification: string
) => {
  const item = evaluationData[sectionIndex].items[itemIndex];

  if (onJustificationUpdate) {
    onJustificationUpdate(sectionIndex, item.id, justification);
  }
  
  setEvaluationData(prev => {
    const newData = JSON.parse(JSON.stringify(prev));
    newData[sectionIndex].items[itemIndex].justification = justification;
    return newData;
  });
};

  // Hàm xử lý khi evidence được thay đổi (sau khi upload)
  const handleEvidenceChange = (
    sectionIndex: number, 
    itemIndex: number, 
    files: UploadedFileInfo[]
  ) => {
    setEvaluationData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[sectionIndex].items[itemIndex].evidenceFiles = files;
      return newData;
    });
  };

  // Thêm hàm xử lý xóa evidence
  const handleEvidenceRemove = (
    sectionIndex: number, 
    itemIndex: number, 
    fileIndex: number
  ) => {
    const item = evaluationData[sectionIndex].items[itemIndex];
    
    // Cập nhật state local
    setEvaluationData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[sectionIndex].items[itemIndex].evidenceFiles.splice(fileIndex, 1);
      return newData;
    });

    // Gọi prop để cập nhật state cha (nếu có)
    if (onEvidenceRemove) {
      onEvidenceRemove(sectionIndex, item.id, fileIndex);
    }
  };

  // Tính tổng điểm - cập nhật để xử lý hasContent
  const calculateTotalScore = (type: 'selfScore') => 
  evaluationData.reduce((total, section) => 
    total + section.items.reduce((sectionSum, item) => {
      let itemScore = 0;
      
      // Nếu item có hasContent, tính tổng điểm từ các sub-items
      if (item.hasContent && item.hasContent.length > 0) {
        // Tính tổng điểm từ tất cả các content items
        itemScore = item.hasContent.reduce(
          (contentSum, contentItem) => {
            const score = contentItem[type] || 0;
            return contentSum + score;
          }, 
          0
        );
        
      } else {
        // Item thông thường
        itemScore = item[type] || 0;
        
        // Cộng điểm từ các sub-items thông thường
        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach(subItem => {
            itemScore += subItem[type] || 0;
          });
        }
      }
      
      return sectionSum + itemScore;
    }, 0)
  , 0);

  const totalSelfScore = calculateTotalScore('selfScore');

  // Tạo wrapper functions với đúng signature
  const handleHasContentScoreChange = (
    sectionIndex: number, 
    itemIndex: number, 
    subIndex: number, 
    type: 'selfScore', 
    value: number
  ) => {
    handleScoreChange(sectionIndex, itemIndex, subIndex, type, value);
  };

  const handleBonusScoreChange = (
    sectionIndex: number, 
    itemIndex: number, 
    type: 'selfScore', 
    value: number
  ) => {
    handleScoreChange(sectionIndex, itemIndex, undefined, type, value);
  };

  if (isMobile) {
    return (
      <Card {...other}>
        <CardHeader title={title} sx={{ mb: 1 }} />
        
        <Box sx={{ p: 2 }}>
          {evaluationData.map((section, sectionIndex) => (
            <Box key={sectionIndex} sx={{ mb: 3 }}>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.100' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {section.title}
                </Typography>
              </Paper>
              
              {section.items.map((item, itemIndex) => (
                <Paper key={item.id} sx={{ p: 2, mb: 2, border: 1, borderColor: 'grey.200' }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    {item.id}. {item.title}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <HTMLContent content={item.content} />
                  </Box>
                  
                  {/* Xử lý items có hasContent trong mobile */}
                  {item.hasContent ? (
                    <Box>
                      {item.hasContent.map((subItem, subIndex) => (
                        <Box key={subIndex} sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'grey.300' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }} fontWeight="medium">
                              • {subItem.content}
                            </Typography>
                            <Typography variant="body2" color="primary.main" sx={{ fontSize: '0.875rem' }}>
                              Điểm: {subItem.points}
                            </Typography>
                          </Box>
                          
                          {subItem.hasType === 'single-choice' && subItem.subItems && (
                            <SingleChoiceSelector
                              options={subItem.subItems}
                              currentScore={subItem.selfScore}
                              onSelect={(value) => handleOptionSelect(sectionIndex, itemIndex, subIndex, value)}
                              level={1}
                            />
                          )}
                          
                          {!subItem.hasType && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }} gutterBottom>
                                  Tự đánh giá
                                </Typography>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={subItem.selfScore || 0}
                                  onChange={(e) => handleScoreChange(sectionIndex, itemIndex, subIndex, 'selfScore', Number(e.target.value))}
                                  inputProps={{ min: 0, style: { textAlign: 'center' }}}
                                  fullWidth
                                />
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <>
                      {item.hasType === 'single-choice' && item.subItems && (
                        <SingleChoiceSelector
                          options={item.subItems}
                          currentScore={item.selfScore}
                          onSelect={(value) => handleOptionSelect(sectionIndex, itemIndex, undefined, value)}
                        />
                      )}
                      
                      {section.title.includes('ĐIỂM THƯỞNG') && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            multiline
                            rows={3}
                            value={item.justification || ''}
                            onChange={(e) => handleJustificationChange(sectionIndex, itemIndex, e.target.value)}
                            placeholder="Nội dung chi tiết"
                            fullWidth
                            sx={{
                              maxWidth: { xs: '100%', sm: '700px' },
                              '& .MuiOutlinedInput-root': {
                                '& textarea': {
                                  resize: 'vertical',
                                  minHeight: '50px',
                                }
                              },
                              '& .MuiOutlinedInput-input': {
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                              }
                            }}
                            size="small"
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          Điểm: {item.points}
                        </Typography>
                        
                        {section.title.includes('ĐIỂM THƯỞNG') ? (
                          <EvidenceUpload
                            files={item.evidenceFiles || []}
                            onFilesChange={(files) => handleEvidenceChange(sectionIndex, itemIndex, files)}
                            onFileRemove={(fileIndex) => handleEvidenceRemove(sectionIndex, itemIndex, fileIndex)} 
                            onUpload={(files) => onEvidenceUpload(sectionIndex, item.id, files)}
                            sectionIndex={sectionIndex}
                            itemId={item.id}
                          />
                        ) : item.hasEvidence && (
                          <Button variant="outlined" size="small" startIcon={<UploadIcon />}>
                            Tải lên
                          </Button>
                        )}
                      </Box>
                      
                      {!item.hasType && !item.hasContent && (
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" gutterBottom>
                              Tự đánh giá
                            </Typography>
                            <TextField
                              type="number"
                              size="small"
                              value={item.selfScore}
                              onChange={(e) => handleScoreChange(sectionIndex, itemIndex, undefined, 'selfScore', Number(e.target.value))}
                              inputProps={{ min: 0, style: { textAlign: 'center' }}}
                              fullWidth
                            />
                          </Box>
                        </Box>
                      )}
                      
                      {item.subItems && item.hasType !== 'single-choice' && item.subItems.map((subItem, subIndex) => (
                        <Box key={subIndex} sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'grey.300' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }} fontWeight="medium">
                              • {subItem.content}
                            </Typography>
                            <Typography variant="body2" color="primary.main" sx={{ fontSize: '0.875rem' }}>
                              Điểm: {subItem.points}
                            </Typography>
                          </Box>
                          
                          {subItem.hasType === 'single-choice' && subItem.subItems && (
                            <SingleChoiceSelector
                              options={subItem.subItems}
                              currentScore={subItem.selfScore}
                              onSelect={(value) => handleOptionSelect(sectionIndex, itemIndex, subIndex, value)}
                              level={1}
                            />
                          )}
                          
                          {!subItem.hasType && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }} gutterBottom>
                                  Tự đánh giá
                                </Typography>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={subItem.selfScore || 0}
                                  onChange={(e) => handleScoreChange(sectionIndex, itemIndex, subIndex, 'selfScore', Number(e.target.value))}
                                  inputProps={{ min: 0, style: { textAlign: 'center' }}}
                                  fullWidth
                                />
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </>
                  )}
                </Paper>
              ))}
            </Box>
          ))}
          
          <Paper sx={{ p: 2, backgroundColor: 'grey.100', mt: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              TỔNG ĐIỂM
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" fontWeight="bold">
                Tổng điểm: 100
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Tự đánh giá
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={totalSelfScore}
                    inputProps={{ min: 0, max: 100, style: { textAlign: 'center', fontWeight: 'bold' }}}
                    sx={{ width: 80, fontWeight: 'bold' }}
                    disabled
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Card>
    );
  }

  return (
    <Paper
      elevation={2} 
      sx={{ 
        p: 3, 
        mt: 3,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography 
        variant="h6" 
        component="h3" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}
      >
        I.KẾT QUẢ TỰ ĐÁNH GIÁ
      </Typography>
      <CardHeader title={title} sx={{ mb: 1 }} />
      
      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table stickyHeader sx={{ minWidth: isSmallScreen ? 800 : 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 400, fontWeight: 'bold', width: '45%' }}>
                NỘI DUNG ĐÁNH GIÁ
              </TableCell>
              <TableCell sx={{ minWidth: 80, fontWeight: 'bold', width: '10%' }}>
                ĐIỂM
              </TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold', width: '15%' }}>
                TỰ ĐÁNH GIÁ
              </TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold', width: '15%' }}>
                MINH CHỨNG
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {evaluationData.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell colSpan={5} sx={{ py: 1.5, fontWeight: 'bold' }}>
                    <Typography variant="subtitle1">
                      {section.title}
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={item.id}>
                    {/* Xử lý phần điểm thưởng */}
                    {section.title.includes('ĐIỂM THƯỞNG') ? (
                      <BonusItemRow 
                        item={item} 
                        sectionIndex={sectionIndex} 
                        itemIndex={itemIndex}
                        onJustificationChange={handleJustificationChange}
                        onEvidenceChange={handleEvidenceChange} 
                        onEvidenceRemove={handleEvidenceRemove} 
                        onScoreChange={handleBonusScoreChange}
                        onEvidenceUpload={onEvidenceUpload}
                      />
                    ) : item.hasContent ? (
                      /* Xử lý items có hasContent (như mục 2.2) */
                      <HasContentItemRow
                        item={item}
                        sectionIndex={sectionIndex}
                        itemIndex={itemIndex}
                        onScoreChange={handleHasContentScoreChange}
                        onOptionSelect={handleOptionSelect}
                      />
                    ) : (
                      /* Xử lý items thông thường */
                      <TableRow>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            {item.id}. {item.title}
                          </Typography>
                          <HTMLContent content={item.content} />
                          
                          {item.hasType === 'single-choice' && item.subItems && (
                            <SingleChoiceSelector
                              options={item.subItems}
                              currentScore={item.selfScore}
                              onSelect={(value) => handleOptionSelect(sectionIndex, itemIndex, undefined, value)}
                            />
                          )}
                        </TableCell>
                        
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" color="primary.main" fontWeight="medium">
                            {item.points}
                          </Typography>
                        </TableCell>
                        
                        <TableCell sx={{ py: 1 }}>
                          {item.hasType === 'single-choice' ? (
                            <TextField
                              type="number"
                              size="small"
                              value={item.selfScore}
                              inputProps={{ style: { textAlign: 'center' }}}
                              sx={{ width: 80 }}
                              disabled
                            />
                          ) : (
                            <TextField
                              type="number"
                              size="small"
                              value={item.selfScore}
                              onChange={(e) => handleScoreChange(sectionIndex, itemIndex, undefined, 'selfScore', Number(e.target.value))}
                              inputProps={{ style: { textAlign: 'center' }}}
                              sx={{ width: 80 }}
                            />
                          )}
                        </TableCell>
                        
                        <TableCell sx={{ py: 1 }}>
                          {item.hasEvidence && (
                            <Button variant="outlined" size="small" startIcon={<UploadIcon />}>
                              Tải lên
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {/* Render sub-items thông thường (không phải hasContent) */}
                    {item.subItems && item.hasType !== 'single-choice' && !item.hasContent && item.subItems.map((subItem, subIndex) => (
                      <SubItemRow 
                        key={subIndex} 
                        subItem={subItem} 
                        level={1}
                        sectionIndex={sectionIndex}
                        itemIndex={itemIndex}
                        subIndex={subIndex}
                        onScoreChange={handleScoreChange} 
                        onOptionSelect={handleOptionSelect} 
                      />
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}

            <TableRow sx={{ backgroundColor: 'grey.100', fontWeight: 'bold' }}>
              <TableCell sx={{ py: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                TỔNG ĐIỂM
              </TableCell>
              <TableCell sx={{ py: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                100
              </TableCell>
              <TableCell sx={{ py: 1 }}>
                <TextField
                  type="number"
                  size="small"
                  value={totalSelfScore}
                  inputProps={{ min: 0, max: 100, style: { textAlign: 'center', fontWeight: 'bold' }}}
                  sx={{ width: 80, fontWeight: 'bold' }}
                  disabled
                />
              </TableCell>
              <TableCell sx={{ py: 1 }} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
      
  );
}