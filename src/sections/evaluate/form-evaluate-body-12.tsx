import React, { useState, useEffect } from 'react';

import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
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
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useUserPermissions } from 'src/hooks/useUserPermissions';

import {
  UploadedFileInfo,
  EvaluationSection,
  EvaluationItem,
  getScoreLabels,
} from 'src/services/type';

import { MobileHasContentItem, MobileRegularItem, MobileBonusItem } from './components';


// ----------------------------------------------------------------------

type Props = {
  title: string;
  sections: EvaluationSection[];
  onScoreUpdate: (sectionIndex: number, itemId: string, scores: {
    selfScore?: number;
    thamDinhScore?: number;
    hieuTruongScore?: number;
  }) => void;
  onSubItemScoreBlur?: (sectionIndex: number, itemIndex: number, subIndex: number, type: 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onHasContentScoreBlur?: (
    sectionIndex: number, 
    itemIndex: number, 
    subIndex: number, 
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', 
    value: number
  ) => void;
  onActivityScoreBlur?: (
    sectionIndex: number, 
    itemIndex: number, 
    activityIndex: number, 
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', 
    value: number
  ) => void;
  onScoreBlur?: (
    sectionIndex: number, 
    itemIndex: number, 
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', 
    value: number
  ) => void;
  onSingleChoiceUpdate: (sectionIndex: number, itemId: string, selectedOption: string, scores: {
    selfScore: number;
    thamDinhScore?: number;
    hieuTruongScore?: number;
  }) => void;
  onHasContentScoreUpdate: (sectionIndex: number, itemId: string, contentIndex: number, scores: {
    selfScore: number;
    thamDinhScore?: number;
    hieuTruongScore?: number;
  }) => void;
  onEvidenceUpload: (sectionIndex: number, itemId: string, files: File[]) => Promise<UploadedFileInfo[]>;
  onEvidenceRemove?: (sectionIndex: number, itemId: string, fileIndex: number) => void;
  onJustificationUpdate: (sectionIndex: number, itemId: string, justification: string) => void;
  onJustificationBlur?: (sectionIndex: number, itemId: string, justification: string) => void;
  onDataChange?: (updatedBody: EvaluationSection[]) => void;
  readOnly?: boolean;
  formType?: '12A' | '12B';
  currentUserRole?: string;
  // Các props cho bonus activities
  onAddActivity?: (sectionIndex: number, itemIndex: number) => void;
  onActivityJustificationUpdate?: (sectionIndex: number, itemIndex: number, activityIndex: number, justification: string) => void;
  onActivityJustificationBlur?: (sectionIndex: number, itemIndex: number, activityIndex: number, justification: string) => void;
  onActivityScoreUpdate?: (sectionIndex: number, itemIndex: number, activityIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onActivityEvidenceUpload?: (sectionIndex: number, itemIndex: number, activityIndex: number, files: File[]) => Promise<UploadedFileInfo[]>;
  onActivityEvidenceRemove?: (sectionIndex: number, itemIndex: number, activityIndex: number, fileIndex: number) => void;
  onActivityEvidenceChange?: (sectionIndex: number, itemIndex: number, activityIndex: number, files: UploadedFileInfo[]) => void;
  onRemoveActivity?: (sectionIndex: number, itemIndex: number, activityIndex: number) => void; 
};

// ----------------------------------------------------------------------

export const HTMLContent = ({ content }: { content: string }) => (
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

// Tạo component ScoreField với hỗ trợ blur
const ScoreField = ({
  value,
  onChange,
  onBlur,
  maxScore,
  disabled = false,
  type = 'thamDinhScore' as 'thamDinhScore' | 'hieuTruongScore',
  hasRole = false // Thêm prop để biết item có hasRole không
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur?: (value: number) => void;
  maxScore: number;
  disabled?: boolean;
  type?: 'thamDinhScore' | 'hieuTruongScore';
  hasRole?: boolean; // Thêm prop mới
}) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  // DEBUG: In ra props để kiểm tra
  // console.log(`ScoreField Debug - type: ${type}, hasRole: ${hasRole}, disabled: ${disabled}, value: ${value}`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // console.log(`ScoreField handleChange - new value: ${e.target.value}, disabled: ${disabled}`); // DEBUG
    if (disabled) {
      // console.log("ScoreField is disabled, ignoring change"); // DEBUG
      return;
    }
    
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    const numValue = parseFloat(newValue) || 0;
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    // console.log("ScoreField handleBlur"); // DEBUG
    setIsFocused(false);
    const numValue = parseFloat(localValue) || 0;
    // Giới hạn giá trị trong khoảng 0 - maxScore
    const clampedValue = Math.max(0, Math.min(numValue, maxScore));
    
    if (clampedValue !== value && onBlur) {
      onBlur(clampedValue);
    }
    
    if (clampedValue !== numValue) {
      setLocalValue(clampedValue.toString());
      onChange(clampedValue);
    }
  };

  const handleFocus = () => {
    // console.log("ScoreField handleFocus"); // DEBUG
    setIsFocused(true);
  };

  // Xác định màu border dựa trên hasRole và trạng thái
  const getBorderColor = () => {
    if (disabled) {
      // console.log("ScoreField is disabled, border color: grey.300"); // DEBUG
      return 'grey.300';
    }
    if (hasRole && !disabled) {
      if (isFocused) return 'primary.main';
      return 'warning.main'; // Màu vàng cho các trường có hasRole
    }
    if (isFocused) return 'primary.main';
    return 'grey.400';
  };

  // Xác định màu nền dựa trên hasRole
  const getBackgroundColor = () => {
    if (hasRole && !disabled) return 'warning.50'; // Nền vàng nhạt
    return 'white';
  };

  return (
    <TextField
      type="number"
      size="small"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      inputProps={{
        min: 0,
        max: maxScore,
        step: 0.5,
        style: { textAlign: 'center' }
      }}
      sx={{ 
        width: 80,
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: getBorderColor(),
            borderWidth: hasRole && !disabled ? 2 : 1,
          },
          '&:hover fieldset': {
            borderColor: hasRole && !disabled ? 'warning.dark' : 'primary.main',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
            borderWidth: 2,
          },
          backgroundColor: getBackgroundColor(),
        },
        '& .MuiInputBase-input': { 
          fontWeight: type === 'hieuTruongScore' ? 'bold' : 'normal',
          color: disabled ? 'text.disabled' : 'text.primary'
        }
      }}
      disabled={disabled}
      // Thêm tooltip nếu có hasRole
      title={hasRole ? `Trường này có giới hạn quyền chấm (hasRole)` : undefined}
    />
  );
};


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

// SingleChoiceSelector
export const SingleChoiceSelector = ({
  options,
  currentScore,
  onSelect,
  level = 0,
  readOnly = false,
  userPermissions
}: {
  options: { content: string; points: string }[];
  currentScore?: number;
  onSelect: (value: string) => void;
  level?: number;
  readOnly?: boolean;
  userPermissions: any;
}) => {
  const paddingLeft = level * 2;

  const findSelectedOption = () => {
    if (currentScore === undefined || currentScore === null) return '';

    const selectedOption = options.find(option =>
      parseFloat(option.points) === currentScore
    );

    return selectedOption ? selectedOption.points : '';
  };

  const currentSelectedValue = findSelectedOption();
  const isDisabled = readOnly || !userPermissions.canEditSelfScore;

  return (
    <FormControl component="fieldset" sx={{ width: '100%', pl: paddingLeft }}>
      <RadioGroup
        value={currentSelectedValue}
        onChange={(e) => onSelect(e.target.value)}
        sx={{ opacity: isDisabled ? 0.7 : 1 }}
      >
        {options.map((option, index) => (
          <FormControlLabel
            key={index}
            value={option.points}
            control={<Radio size="small" disabled={isDisabled} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', flex: 1 }}>
                  {option.content}
                </Typography>
                <Chip
                  label={`${option.points} điểm`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ minWidth: 70 }}
                />
              </Box>
            }
            sx={{
              mb: 1,
              '& .MuiFormControlLabel-label': { flex: 1 },
              alignItems: 'flex-start',
            }}
            disabled={isDisabled}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

// EvidenceUpload Component
export const EvidenceUpload = ({
  files,
  onFilesChange,
  onFileRemove,
  onUpload,
  sectionIndex,
  itemId,
  readOnly = false,
  userPermissions
}: {
  files: UploadedFileInfo[];
  onFilesChange: (files: UploadedFileInfo[]) => void;
  onFileRemove: (index: number) => void;
  onUpload: (files: File[]) => Promise<UploadedFileInfo[]>;
  sectionIndex: number;
  itemId: string;
  readOnly?: boolean;
  userPermissions: any;
}) => {
  const [open, setOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<{ index: number; fileName: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isDisabled = !userPermissions.canUploadEvidence;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;

    const selectedFiles = Array.from(event.target.files || []) as File[];
    
    if (selectedFiles.length === 0) return;
    
    // Kiểm tra dung lượng file (max 10MB mỗi file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`Các file sau vượt quá 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    if (selectedFiles.length > 0 && onUpload) {
      setUploading(true);
      try {
        // Gọi API upload thực tế qua onUpload
        const uploadedFiles = await onUpload(selectedFiles);

        if (uploadedFiles && uploadedFiles.length > 0) {
          // Server đã trả về thông tin file đã upload với URL đúng
          onFilesChange([...files, ...uploadedFiles]);
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        // Không cần alert ở đây vì onUpload đã xử lý
      } finally {
        setUploading(false);
        // Reset input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Hàm format URL để hiển thị đúng
  const formatFileUrl = (file: UploadedFileInfo) => {
    if (!file.url) {
      // Nếu không có URL nhưng có filename và staffCode, tạo URL filetmp
      if (file.filename && file.staffCode) {
        return `https://apidgxl.hcmue.edu.vn/filetmp/${file.staffCode}/${file.filename}`;
      }
      return '';
    }
    
    // Nếu URL đã là đường dẫn đầy đủ (server trả về)
    if (file.url.startsWith('http')) {
      return file.url;
    }
    
    // Nếu URL là blob (trường hợp tạm thời)
    if (file.url.startsWith('blob:')) {
      // Nếu có filename và staffCode thì tạo URL filetmp
      if (file.filename && file.staffCode) {
        return `https://apidgxl.hcmue.edu.vn/filetmp/${file.staffCode}/${file.filename}`;
      }
    }
    
    // Trường hợp khác: trả về URL gốc
    return file.url;
  };

  const handleRemoveFileClick = (index: number, fileName: string) => {
    if (isDisabled) return;
    setFileToDelete({ index, fileName });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      onFileRemove(fileToDelete.index);
      setDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setFileToDelete(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id={`evidence-upload-${sectionIndex}-${itemId}`}
              disabled={isDisabled || uploading}
            />
            <label htmlFor={`evidence-upload-${sectionIndex}-${itemId}`}>
              <Button
                variant="contained"
                component="span"
                startIcon={uploading ? <CircularProgress size={16} /> : <AddIcon />}
                fullWidth
                disabled={isDisabled || uploading}
              >
                {uploading ? 'Đang tải lên...' : 'Thêm minh chứng'}
              </Button>
            </label>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Định dạng hỗ trợ: ảnh, PDF, Word, Excel, PowerPoint. Tối đa 10MB/file.
            </Typography>
            
            {uploading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Đang tải file lên server...
                </Typography>
              </Box>
            )}
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
                  '&:hover': {
                    backgroundColor: 'grey.50',
                  },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {file.originalname}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)} • {file.mimetype}
                  </Typography>
                  
                  {/* Luôn hiển thị nút Xem file nếu có thông tin */}
                  {(file.url || (file.filename && file.staffCode)) && (
                    <Button
                      size="small"
                      href={formatFileUrl(file)}
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
                  disabled={isDisabled || uploading}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {files.length === 0 && !uploading && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                Chưa có minh chứng nào được tải lên
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

// Component cho các items có hasContent
const HasContentItemRow = ({
  item,
  sectionIndex,
  itemIndex,
  onScoreChange,
  onHasContentScoreBlur,
  onOptionSelect,
  onJustificationChange,
  onJustificationBlur,
  onEvidenceChange,
  onEvidenceRemove,
  onEvidenceUpload,
  readOnly = false,
  formType = '12A',
  userPermissions,
  evaluationData,
  setEvaluationData
}: {
  item: EvaluationItem;
  sectionIndex: number;
  itemIndex: number;
  onScoreChange: (sectionIndex: number, itemIndex: number, subIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onHasContentScoreBlur?: (sectionIndex: number, itemIndex: number, subIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onOptionSelect: (sectionIndex: number, itemIndex: number, subIndex: number, value: string) => void;
  onJustificationChange?: (sectionIndex: number, itemIndex: number, justification: string, subIndex?: number, isSubItem?: boolean) => Promise<any>;
  onJustificationBlur: (sectionIndex: number, itemIndex: number, justification: string, subIndex?: number, isSubItem?: boolean) => void;
  onEvidenceChange: (sectionIndex: number, itemIndex: number, subIndex: number, activityIndex: number, files: UploadedFileInfo[], isSubItem?: boolean) => void;
  onEvidenceRemove: (sectionIndex: number, itemIndex: number, fileIndex: number, subIndex?: number, activityIndex?:number, isSubItem?: boolean) => void;
  onEvidenceUpload: (sectionIndex: number, itemId: string, files: File[]) => Promise<UploadedFileInfo[]>;
  readOnly?: boolean;
  formType?: '12A' | '12B';
  userPermissions: any;
  evaluationData: EvaluationSection[];
  setEvaluationData: React.Dispatch<React.SetStateAction<EvaluationSection[]>>;
}) => {
  const scoreLabels = getScoreLabels(formType);

  const [localJustification, setLocalJustification] = React.useState(item.justification || '');

  // Cập nhật local state khi prop thay đổi (khi load data hoặc save thành công)
  React.useEffect(() => {
    setLocalJustification(item.justification || '');
  }, [item.justification]);

  return (
    <>
      <TableRow sx={{ backgroundColor: 'grey.50' }}>
        <TableCell sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Chip
              label={item.id}
              size="small"
              color="primary"
              variant="filled"
              sx={{ minWidth: 40 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {item.title}
              </Typography>
              <HTMLContent content={item.content} />

              {/* THÊM JUSTIFICATION CHO HASCONTENT ITEMS */}
              {(!item.hasContent || item.hasContent.length === 0) && (item.justification !== undefined || item.evidenceFiles) && onJustificationChange && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom color="text.secondary">
                    Thuyết minh:
                  </Typography>
                  <JustificationField
                    value={item.justification || ''}
                    onBlur={(value) => onJustificationBlur(sectionIndex, itemIndex, value)}
                    placeholder="Hãy nhập nội dung thuyết minh..."
                    rows={2}
                    disabled={readOnly || !userPermissions.canEditJustification}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="primary.main" fontWeight="bold">
            {item.points}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1, textAlign: 'center' }}>
          <TextField
            type="number"
            size="small"
            value={item.selfScore || 0}
            inputProps={{
              min: 0,
              max: parseFloat(item.points),
              style: { textAlign: 'center', fontWeight: 'bold' }
            }}
            sx={{ width: 80, '& .MuiInputBase-input': { fontWeight: 'bold' } }}
            disabled
          />
        </TableCell>
        <TableCell sx={{ py: 1, textAlign: 'center' }}>
          <TextField
            type="number"
            size="small"
            value={item.thamDinhScore || 0}
            onChange={(e) => onScoreChange(sectionIndex, itemIndex, -1, 'thamDinhScore', Number(e.target.value))}
            inputProps={{
              min: 0,
              max: parseFloat(item.points),
              style: { textAlign: 'center' }
            }}
            sx={{ width: 80 }}
            disabled={readOnly || !userPermissions.canEditPrincipalScore}
          />
        </TableCell>
        <TableCell sx={{ py: 1, textAlign: 'center' }}>
          <TextField
            type="number"
            size="small"
            value={item.hieuTruongScore || 0}
            onChange={(e) => onScoreChange(sectionIndex, itemIndex, -1, 'hieuTruongScore', Number(e.target.value))}
            inputProps={{
              min: 0,
              max: parseFloat(item.points),
              style: { textAlign: 'center' }
            }}
            sx={{ width: 80 }}
            disabled={readOnly || !userPermissions.canEditHieuTruongScore}
          />
        </TableCell>
        <TableCell sx={{ py: 1, textAlign: 'center' }}>
          {/* THÊM EVIDENCE UPLOAD CHO HASCONTENT ITEMS */}
          {(item.hasEvidence || item.evidenceFiles) && (
            <EvidenceUpload
              files={item.evidenceFiles || []}
              onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, -1, -1, files, false)}
              onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, fileIndex, -1, -1, false)}
              onUpload={(files) => onEvidenceUpload(sectionIndex, item.id, files)}
              sectionIndex={sectionIndex}
              itemId={item.id}
              readOnly={readOnly}
              userPermissions={userPermissions}
            />
          )}
        </TableCell>
      </TableRow>

      {/* Render các sub-items trong hasContent */}
      {item.hasContent?.map((subItem, subIndex: number) => (
        <TableRow key={subIndex} sx={{ backgroundColor: 'background.default' }}>
          <TableCell sx={{ py: 1.5, pl: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', minWidth: 24 }}>
                {String.fromCharCode(97 + subIndex)}.
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 1 }}>
                  {subItem.content}
                </Typography>

                {/* Single-choice selector cho sub-items */}
                {subItem.hasType === 'single-choice' && subItem.subItems && (
                  <SingleChoiceSelector
                    options={subItem.subItems}
                    currentScore={subItem.selfScore}
                    onSelect={(value) => onOptionSelect(sectionIndex, itemIndex, subIndex, value)}
                    level={1}
                    readOnly={readOnly}
                    userPermissions={userPermissions}
                  />
                )}

                {/* THÊM PHẦN JUSTIFICATION CHO TỪNG SUB-ITEM */}
                {(subItem.justification !== undefined || subItem.evidenceFiles) && onJustificationChange && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Thuyết minh:
                    </Typography>
                    <JustificationField
                      value={subItem.justification || ''}
                      onBlur={(value) => {
                        if (onJustificationBlur) {
                          onJustificationBlur(sectionIndex, itemIndex, value, subIndex, true);
                        }
                      }}
                      placeholder="Hãy nhập nội thuyết minh..."
                      rows={2}
                      disabled={readOnly || !userPermissions.canEditJustification}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </TableCell>
          <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
            <Typography variant="body2" color="primary.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
              {subItem.points}
            </Typography>
          </TableCell>
          <TableCell sx={{ py: 1, textAlign: 'center' }}>
            <TextField
              type="number"
              size="small"
              value={subItem.selfScore || 0}
              inputProps={{
                min: 0,
                max: parseFloat(subItem.points),
                style: { textAlign: 'center', fontWeight: 'bold' }
              }}
              sx={{ width: 80, '& .MuiInputBase-input': { fontWeight: 'bold' } }}
              disabled
            />
          </TableCell>
          <TableCell sx={{ py: 1, textAlign: 'center' }}>
            <ScoreField
              value={subItem.thamDinhScore || 0}
              onChange={(value) => onScoreChange(sectionIndex, itemIndex, subIndex, 'thamDinhScore', value)}
              onBlur={(value) => {
                if (onHasContentScoreBlur) {
                  onHasContentScoreBlur(sectionIndex, itemIndex, subIndex, 'thamDinhScore', value);
                }
                onScoreChange(sectionIndex, itemIndex, subIndex, 'thamDinhScore', value);
              }}
              maxScore={parseFloat(subItem.points)}
              disabled={readOnly || !userPermissions.canEditPrincipalScore(subItem.hasRole ? subItem : item)}
              type="thamDinhScore"
              hasRole={!!(subItem.hasRole || item.hasRole)} // Kiểm tra cả item cha và sub-item
            />
          </TableCell>

          <TableCell sx={{ py: 1, textAlign: 'center' }}>
            <ScoreField
              value={subItem.hieuTruongScore || 0}
              onChange={(value) => onScoreChange(sectionIndex, itemIndex, subIndex, 'hieuTruongScore', value)}
              onBlur={(value) => {
                if (onHasContentScoreBlur) {
                  onHasContentScoreBlur(sectionIndex, itemIndex, subIndex, 'hieuTruongScore', value);
                }
                onScoreChange(sectionIndex, itemIndex, subIndex, 'hieuTruongScore', value);
              }}
              maxScore={parseFloat(subItem.points)}
              disabled={readOnly || !userPermissions.canEditHieuTruongScore(subItem.hasRole ? subItem : item)}
              type="hieuTruongScore"
              hasRole={!!(subItem.hasRole || item.hasRole)} // Kiểm tra cả item cha và sub-item
            />
          </TableCell>
          <TableCell sx={{ py: 1, textAlign: 'center' }}>
            {(subItem.hasEvidence || subItem.evidenceFiles) && (
              <EvidenceUpload
                files={subItem.evidenceFiles || []}
                onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, subIndex, -1, files, true)}
                onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, fileIndex, subIndex, -1, true)}
                onUpload={(files) => onEvidenceUpload(sectionIndex, `${item.id}_sub_${subIndex}`, files)}
                sectionIndex={sectionIndex}
                itemId={`${item.id}_sub_${subIndex}`}
                readOnly={readOnly}
                userPermissions={userPermissions}
              />
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

// Component cho bonus items với chức năng thêm hoạt động
const BonusItemRow = ({
  item,
  sectionIndex,
  itemIndex,
  onJustificationChange = () => {},
  onJustificationBlur = () => {},
  onScoreChange = () => {},
  onActivityScoreBlur,
  onEvidenceChange = () => {},
  onEvidenceRemove = () => {},
  onEvidenceUpload = async () => [],
  onAddActivity = () => {},
  onRemoveActivity = () => {},
  readOnly = false,
  formType = '12A',
  userPermissions,
  evaluationData,
  setEvaluationData
}: {
  item: EvaluationItem;
  sectionIndex: number;
  itemIndex: number;
  onJustificationChange?: (sectionIndex: number, itemIndex: number, activityIndex: number, justification: string) => void;
  onJustificationBlur?: (sectionIndex: number, itemIndex: number, activityIndex: number, justification: string) => void;
  onScoreChange?: (sectionIndex: number, itemIndex: number, activityIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onActivityScoreBlur?: (sectionIndex: number, itemIndex: number, activityIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onEvidenceChange?: (sectionIndex: number, itemIndex: number, activityIndex: number, files: UploadedFileInfo[], isActivity?: boolean) => void;
  onEvidenceRemove?: (sectionIndex: number, itemIndex: number, activityIndex: number, fileIndex: number, isActivity?: boolean) => void;
  onEvidenceUpload?: (sectionIndex: number, itemIndex: number, activityIndex: number, files: File[]) => Promise<UploadedFileInfo[]>;
  onAddActivity?: (sectionIndex: number, itemIndex: number) => void;
  onRemoveActivity?: (sectionIndex: number, itemIndex: number, activityIndex: number) => void;
  readOnly?: boolean;
  formType?: '12A' | '12B';
  userPermissions: any;
  evaluationData: EvaluationSection[];
  setEvaluationData: React.Dispatch<React.SetStateAction<EvaluationSection[]>>;
}) => {
  const scoreLabels = getScoreLabels(formType);

  // Tính điểm tự động dựa trên số hoạt động và loại item
  const calculateAutoScore = (itemId: string, activityCount: number) => {
    if (itemId === "3.1") {
      return activityCount * 2; // 2 điểm mỗi hoạt động cho 3.1
    } else if (itemId === "3.2") {
      return activityCount * 1; // 1 điểm mỗi hoạt động cho 3.2
    }
    return 0;
  };

  const [deleteActivityModal, setDeleteActivityModal] = useState({
    open: false,
    activityIndex: -1
  });

  const handleOpenDeleteModal = (activityIndex: number) => {
    setDeleteActivityModal({
      open: true,
      activityIndex
    });
  };

  const handleCloseDeleteModal = () => {
    setDeleteActivityModal({
      open: false,
      activityIndex: -1
    });
  };

  const handleConfirmDelete = () => {
    onRemoveActivity(sectionIndex, itemIndex, deleteActivityModal.activityIndex);
    handleCloseDeleteModal();
  };

  // Hàm xử lý upload evidence cho activity
  const handleActivityEvidenceUpload = async (activityIndex: number, files: File[]): Promise<UploadedFileInfo[]> => {
    if (onEvidenceUpload) {
      // Gọi onEvidenceUpload với đúng tham số cho activity
      const uploadedFiles = await onEvidenceUpload(sectionIndex, itemIndex, activityIndex, files);
      return uploadedFiles;
    }
    return [];
  };

  // Hàm xử lý khi evidence files thay đổi (sau khi upload)
  const handleActivityEvidenceChange = (activityIndex: number, files: UploadedFileInfo[]) => {
    if (onEvidenceChange) {
      onEvidenceChange(sectionIndex, itemIndex, activityIndex, files, true);
    }
  };

  // Hàm xử lý khi xóa file evidence
  const handleActivityEvidenceRemove = (activityIndex: number, fileIndex: number) => {
    if (onEvidenceRemove) {
      onEvidenceRemove(sectionIndex, itemIndex, activityIndex, fileIndex, true);
    }
  };

  return (
    <>  
      <TableRow>
        <TableCell colSpan={6} sx={{ pt: 2, borderBottom: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Chip
              label={item.id}
              size="small"
              color="warning"
              variant="filled"
              sx={{ minWidth: 40 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.dark">
                {item.title}
              </Typography>
              <HTMLContent content={item.content} />

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="700" fontSize={16}gutterBottom color="warning.dark">
                  Nội dung chi tiết:
                </Typography>
              </Box>
            </Box>
          </Box>
        </TableCell>
      </TableRow>

      {/* Hiển thị các hoạt động đã thêm - TRÊN NÚT */}
      {item.hasActivity && item.hasActivity.map((activity, activityIndex) => {
        const activityItemId = String(item.id).replace(/\./g, '_') + `_activity_${activityIndex}`;
        return (
          <TableRow key={activityItemId} sx={{ backgroundColor: 'grey.50' }}>
            <TableCell sx={{ py: 1, pl: 8 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium" color="text.secondary">
                    Hoạt động {activityIndex + 1}:
                  </Typography>
                  {/* Nút xóa hoạt động */}
                  {!readOnly && userPermissions.canEditJustification && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleOpenDeleteModal(activityIndex)}
                      sx={{
                        color: 'error.main',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        fontSize: '0.875rem',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        transition: 'all 0.1s',
                        minWidth: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          borderColor: 'error.light',
                        }
                      }}
                      startIcon={
                        <DeleteIcon 
                          className="delete-icon"
                          sx={{ 
                            fontSize: 18,
                            transition: 'color 0.2s ease-in-out'
                          }} 
                        />
                      }
                    >
                      Xóa
                    </Button>
                  )}
                </Box>
                <JustificationField
                  value={activity.justification || ''}
                  onBlur={(value) => {
                    // Gọi API khi blur
                    onJustificationBlur(sectionIndex, itemIndex, activityIndex, value);
                  }}
                  placeholder="Nhập mô tả chi tiết về hoạt động điểm thưởng..."
                  rows={3}
                  disabled={readOnly || !userPermissions.canEditJustification}
                />
              </Box>
            </TableCell>

            <TableCell sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="warning.main" fontWeight="bold">
                {item.id === "3.1" ? "2" : "1"} điểm
              </Typography>
            </TableCell>

            <TableCell sx={{ py: 1, textAlign: 'center' }}>
              <TextField
                type="number"
                size="small"
                value={item.id === "3.1" ? 2 : 1}
                inputProps={{
                  style: { textAlign: 'center', fontWeight: 'bold' }
                }}
                sx={{
                  width: 80,
                  '& .MuiInputBase-input': {
                    fontWeight: 'bold',
                    color: 'white'
                  }
                }}
                disabled
              />
            </TableCell>

            <TableCell sx={{ py: 1, textAlign: 'center' }}>
              <ScoreField
                value={activity.thamDinhScore || 0}
                onChange={(value) => onScoreChange(sectionIndex, itemIndex, activityIndex, 'thamDinhScore', value)}
                onBlur={(value) => {
                  if (onActivityScoreBlur) {
                    onActivityScoreBlur(sectionIndex, itemIndex, activityIndex, 'thamDinhScore', value);
                  }
                }}
                maxScore={item.id === "3.1" ? 2 : 1}
                disabled={readOnly || !userPermissions.canEditPrincipalScore(activity.hasRole ? activity : item)}
                type="thamDinhScore"
                hasRole={!!(activity.hasRole || item.hasRole)} // Kiểm tra cả activity và item
              />
            </TableCell>

            <TableCell sx={{ py: 1, textAlign: 'center' }}>
              <ScoreField
                value={activity.hieuTruongScore || 0}
                onChange={(value) => onScoreChange(sectionIndex, itemIndex, activityIndex, 'hieuTruongScore', value)}
                onBlur={(value) => {
                  if (onActivityScoreBlur) {
                    onActivityScoreBlur(sectionIndex, itemIndex, activityIndex, 'hieuTruongScore', value);
                  }
                }}
                maxScore={item.id === "3.1" ? 2 : 1}
                disabled={readOnly || !userPermissions.canEditHieuTruongScore(activity.hasRole ? activity : item)}
                type="hieuTruongScore"
                hasRole={!!(activity.hasRole || item.hasRole)} // Kiểm tra cả activity và item
              />
            </TableCell>

            <TableCell sx={{ py: 1, textAlign: 'center' }}>
             <EvidenceUpload
                files={activity.evidenceFiles || []}
                onFilesChange={(files) => handleActivityEvidenceChange(activityIndex, files)}
                onFileRemove={(fileIndex) => handleActivityEvidenceRemove(activityIndex, fileIndex)}
                onUpload={(files) => handleActivityEvidenceUpload(activityIndex, files)}
                sectionIndex={sectionIndex}
                itemId={activityItemId}
                readOnly={readOnly}
                userPermissions={userPermissions}
              />
            </TableCell>
          </TableRow>
        );
      })}
      {/* Nút Thêm hoạt động - LUÔN Ở DƯỚI CÙNG */}
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 2, borderBottom: 'none' }}>
          <Box sx={{ mt: 1, mb: 2, pl: 8 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => onAddActivity(sectionIndex, itemIndex)}
              disabled={readOnly || !userPermissions.canEditJustification}
              sx={{ mb: 2 }}
            >
              Thêm hoạt động
            </Button>
          </Box>
        </TableCell>
      </TableRow>

      {/* Modal xác nhận xóa hoạt động */}
      <DeleteActivityConfirmModal
        open={deleteActivityModal.open}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        activityInfo={{
          sectionIndex,
          itemIndex,
          activityIndex: deleteActivityModal.activityIndex,
          itemTitle: item.title
        }}
      />
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
  onOptionSelect,
  readOnly = false,
  userPermissions
}: {
  subItem: any;
  level?: number;
  sectionIndex: number;
  itemIndex: number;
  subIndex: number;
  onScoreChange: (sectionIndex: number, itemIndex: number, subIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onOptionSelect: (sectionIndex: number, itemIndex: number, subIndex: number, option: string) => void;
  readOnly?: boolean;
  userPermissions: any;
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
            readOnly={readOnly}
            userPermissions={userPermissions}
          />
        )}
      </TableCell>
      <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
        <Typography variant="body2" color="primary.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
          {subItem.points}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        {subItem.hasType === 'single-choice' ? (
          <TextField
            type="number"
            size="small"
            value={subItem.selfScore || 0}
            inputProps={{ style: { textAlign: 'center', fontWeight: 'bold' } }}
            sx={{ width: 80, '& .MuiInputBase-input': { fontWeight: 'bold' } }}
            disabled
          />
        ) : (
          <TextField
            type="number"
            size="small"
            value={subItem.selfScore || 0}
            onChange={(e) => onScoreChange(sectionIndex, itemIndex, subIndex, 'selfScore', Number(e.target.value))}
            inputProps={{ style: { textAlign: 'center' } }}
            sx={{ width: 80 }}
            disabled={readOnly || !userPermissions.canEditSelfScore}
          />
        )}
      </TableCell>
      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        <TextField
          type="number"
          size="small"
          value={subItem.thamDinhScore || 0}
          onChange={(e) => onScoreChange(sectionIndex, itemIndex, subIndex, 'thamDinhScore', Number(e.target.value))}
          inputProps={{ style: { textAlign: 'center' } }}
          sx={{ width: 80 }}
          disabled={readOnly || !userPermissions.canEditPrincipalScore}
        />
      </TableCell>
      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        <TextField
          type="number"
          size="small"
          value={subItem.hieuTruongScore || 0}
          onChange={(e) => onScoreChange(sectionIndex, itemIndex, subIndex, 'hieuTruongScore', Number(e.target.value))}
          inputProps={{ style: { textAlign: 'center' } }}
          sx={{ width: 80 }}
          disabled={readOnly || !userPermissions.canEditHieuTruongScore}
        />
      </TableCell>
      <TableCell sx={{ py: 1.5, textAlign: 'center' }} />
    </TableRow>
  );
};

const RegularItemRow = ({
  item,
  sectionIndex,
  itemIndex,
  onJustificationChange,
  onJustificationBlur,
  onScoreChange,
  onScoreBlur, 
  onEvidenceChange,
  onEvidenceRemove,
  onEvidenceUpload,
  readOnly = false,
  formType = '12A',
  userPermissions
}: {
  item: EvaluationItem;
  sectionIndex: number;
  itemIndex: number;
  onJustificationChange: (sectionIndex: number, itemIndex: number, justification: string) => void;
  onJustificationBlur: (sectionIndex: number, itemIndex: number, justification: string) => void;
  onScoreChange: (sectionIndex: number, itemIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onScoreBlur?: (sectionIndex: number, itemIndex: number, type: 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onEvidenceChange: (sectionIndex: number, itemIndex: number, files: UploadedFileInfo[]) => void;
  onEvidenceRemove: (sectionIndex: number, itemIndex: number, fileIndex: number) => void;
  onEvidenceUpload: (sectionIndex: number, itemId: string, files: File[]) => Promise<UploadedFileInfo[]>;
  readOnly?: boolean;
  formType?: '12A' | '12B';
  userPermissions: any;

}) => {

  const maxScore = parseFloat(item.points) || 0;
  const canEditThamDinh = userPermissions.canEditPrincipalScore(item);
  const canEditHieuTruong = userPermissions.canEditHieuTruongScore(item);

  return (
    <TableRow sx={{ backgroundColor: itemIndex % 2 === 0 ? 'background.default' : 'grey.50' }}>
      <TableCell sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Chip
            label={item.id}
            size="small"
            color="primary"
            variant="filled"
            sx={{ minWidth: 40 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {item.title}
            </Typography>
            <HTMLContent content={item.content} />

            {item.hasType === 'single-choice' && item.subItems && (
              <SingleChoiceSelector
                options={item.subItems}
                currentScore={item.selfScore}
                onSelect={(value) => {
                  const scoreValue = parseFloat(value);
                  onScoreChange(sectionIndex, itemIndex, 'selfScore', scoreValue);
                }}
                readOnly={readOnly}
                userPermissions={userPermissions}
              />
            )}

            {/* HIỂN THỊ JUSTIFICATION CHO TẤT CẢ ITEMS CÓ TRƯỜNG NÀY */}
            {(item.justification !== undefined) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom color="text.secondary">
                  Thuyết minh:
                </Typography>
                <JustificationField
                  value={item.justification || ''}
                  onBlur={(value) => onJustificationBlur(sectionIndex, itemIndex, value)}
                  placeholder="Hãy nhập nội dung thuyết minh..."
                  rows={2}
                  disabled={readOnly || !userPermissions.canEditJustification}
                />
              </Box>
            )}
          </Box>
        </Box>
      </TableCell>

      <TableCell sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="primary.main" fontWeight="bold">
          {item.points}
        </Typography>
      </TableCell>

      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        {item.hasType === 'single-choice' ? (
          <TextField
            type="number"
            size="small"
            value={item.selfScore || 0}
            inputProps={{
              min: 0,
              max: parseFloat(item.points),
              style: { textAlign: 'center', fontWeight: 'bold' }
            }}
            sx={{ width: 80, '& .MuiInputBase-input': { fontWeight: 'bold' } }}
            disabled
          />
        ) : (
          <TextField
            type="number"
            size="small"
            value={item.selfScore || 0}
            onChange={(e) => onScoreChange(sectionIndex, itemIndex, 'selfScore', Number(e.target.value))}
            inputProps={{
              min: 0,
              max: parseFloat(item.points),
              style: { textAlign: 'center' }
            }}
            sx={{ width: 80 }}
            disabled={readOnly || !userPermissions.canEditSelfScore}
          />
        )}
      </TableCell>

      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        <ScoreField
          value={item.thamDinhScore || 0}
          onChange={(value) => onScoreChange(sectionIndex, itemIndex, 'thamDinhScore', value)}
          onBlur={(value) => {
            if (onScoreBlur) {
              onScoreBlur(sectionIndex, itemIndex, 'thamDinhScore', value);
            }
            onScoreChange(sectionIndex, itemIndex, 'thamDinhScore', value);
          }}
          maxScore={maxScore}
          disabled={readOnly || !userPermissions.canEditPrincipalScore(item)}
          type="thamDinhScore"
          hasRole={!!item.hasRole} // Truyền prop hasRole
        />
      </TableCell>

      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        <ScoreField
          value={item.hieuTruongScore || 0}
          onChange={(value) => onScoreChange(sectionIndex, itemIndex, 'hieuTruongScore', value)}
          onBlur={(value) => {
            if (onScoreBlur) {
              onScoreBlur(sectionIndex, itemIndex, 'hieuTruongScore', value);
            }
            onScoreChange(sectionIndex, itemIndex, 'hieuTruongScore', value);
          }}
          maxScore={maxScore}
          disabled={readOnly || !userPermissions.canEditHieuTruongScore(item)}
          type="hieuTruongScore"
          hasRole={!!item.hasRole} // Truyền prop hasRole
        />
      </TableCell>

      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        {/* HIỂN THỊ EVIDENCE UPLOAD CHO TẤT CẢ ITEMS CÓ TRƯỜNG NÀY */}
        {(item.hasEvidence || item.evidenceFiles) && (
          <EvidenceUpload
            files={item.evidenceFiles || []}
            onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, files)}
            onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, fileIndex)}
            onUpload={(files) => onEvidenceUpload(sectionIndex, item.id, files)}
            sectionIndex={sectionIndex}
            itemId={item.id}
            readOnly={readOnly}
            userPermissions={userPermissions}
          />
        )}
      </TableCell>
    </TableRow>
  );
};

// Thêm component DeleteActivityConfirmModal
const DeleteActivityConfirmModal = ({
  open,
  onClose,
  onConfirm,
  activityInfo
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activityInfo: {
    sectionIndex: number;
    itemIndex: number;
    activityIndex: number;
    itemTitle?: string;
  };
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }
    }}
  >
    <DialogTitle sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      backgroundColor: 'error.light',
      color: 'error.contrastText',
      py: 2,
      px: 3
    }}>
      <WarningIcon sx={{ fontSize: 28 }} />
      <Typography variant="h6" component="span" fontWeight="bold">
        Xác nhận xóa hoạt động
      </Typography>
    </DialogTitle>

    <DialogContent sx={{ py: 3, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
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
            Bạn có chắc chắn muốn xóa hoạt động này?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hoạt động {activityInfo.activityIndex + 1} sẽ bị xóa vĩnh viễn.
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
            <strong>Lưu ý:</strong> Tất cả nội dung và minh chứng của hoạt động này sẽ bị xóa. 
            Hành động này không thể hoàn tác. Tổng điểm sẽ được tính lại tự động.
          </span>
        </Typography>
      </Box>

      <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Thông tin hoạt động:</strong>
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            • Vị trí: Hoạt động thứ {activityInfo.activityIndex + 1}
          </Typography>
          {activityInfo.itemTitle && (
            <Typography variant="body2" color="text.secondary">
              • Thuộc mục: {activityInfo.itemTitle}
            </Typography>
          )}
        </Box>
      </Box>
    </DialogContent>

    <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{
          borderRadius: 2,
          px: 3,
          py: 1,
          textTransform: 'none',
          fontWeight: 'medium',
          borderColor: 'grey.400',
          '&:hover': {
            borderColor: 'grey.600',
            backgroundColor: 'grey.50'
          }
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
          py: 1,
          textTransform: 'none',
          fontWeight: 'medium',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: 'error.dark'
          }
        }}
      >
        Xóa hoạt động
      </Button>
    </DialogActions>
  </Dialog>
);

export const JustificationField = ({
  value: initialValue,
  onChange,
  onBlur,
  placeholder = "Hãy nhập nội dung thuyết minh...",
  rows = 2,
  disabled = false,
  size = 'small' as const,
}: {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  size?: 'small' | 'medium';
}) => {
  const [localValue, setLocalValue] = React.useState(initialValue);
  
  // Cập nhật khi prop thay đổi từ bên ngoài
  React.useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (onBlur && localValue !== initialValue) {
      onBlur(localValue);
    }
  };

  return (
    <TextField
      multiline
      rows={rows}
      value={localValue}
      onChange={(e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        // Gọi onChange ngay lập tức để cập nhật parent nếu cần
        if (onChange) onChange(newValue);
      }}
      onBlur={handleBlur}
      placeholder={placeholder}
      fullWidth
      disabled={disabled}
      sx={{
        '& .MuiOutlinedInput-root': {
          '& textarea': {
            resize: 'vertical',
            minHeight: '40px',
          }
        },
      }}
      size={size}
    />
  );
};

export function EvaluateFormBody12({
  title,
  sections,
  onScoreUpdate,
  onSingleChoiceUpdate,
  onHasContentScoreUpdate,
  onEvidenceUpload,
  onEvidenceRemove,
  onJustificationUpdate,
  onJustificationBlur,
  onDataChange,
  onScoreBlur,
  onSubItemScoreBlur,
  onHasContentScoreBlur,
  onActivityScoreBlur,
  readOnly = false,
  formType = '12A',
  currentUserRole,
  // Thêm các props mới cho bonus activities
  onAddActivity = () => {},
  onActivityJustificationUpdate = () => {},
  onActivityJustificationBlur = () => {},
  onActivityScoreUpdate = () => {},
  onActivityEvidenceUpload = async () => [],
  onActivityEvidenceRemove = () => {},
  onActivityEvidenceChange = () => {},
  onRemoveActivity = () => {},
  ...other
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [evaluationData, setEvaluationData] = React.useState<EvaluationSection[]>(sections);

  React.useEffect(() => {
    setEvaluationData(sections);
  }, [sections]);

  const userPermissions = useUserPermissions(currentUserRole)
  const scoreLabels = getScoreLabels(formType);

  const getRoleInfo = () => {
    if (userPermissions.isBot) return "Bạn đang đăng nhập với vai trò các đơn vị (Tự đánh giá)";
    if (userPermissions.isPrincipal) return "Bạn đang đăng nhập với vai trò Hiệu trưởng";
    if (userPermissions.isVicePrincipal) return "Bạn đang đăng nhập với vai trò Phó Hiệu trưởng";
    if (userPermissions.isThamDinh) return "Bạn đang đăng nhập với vai trò Thẩm định";
    return "Bạn đang đăng nhập với vai trò Không xác định";
  };

  const handleOptionSelect = async (
    sectionIndex: number,
    itemIndex: number,
    subIndex?: number,
    optionValue: string = '0'
  ) => {
    if (readOnly) return;

    try {
      const scoreValue = parseFloat(optionValue);
      const item = evaluationData[sectionIndex].items[itemIndex];

      // Cập nhật state local trước
      setEvaluationData(prev => {
        const newData = JSON.parse(JSON.stringify(prev));

        if (subIndex !== undefined && newData[sectionIndex].items[itemIndex].hasContent) {
          // Cập nhật cho hasContent sub-item
          newData[sectionIndex].items[itemIndex].hasContent![subIndex].selfScore = scoreValue;
          newData[sectionIndex].items[itemIndex].hasContent![subIndex].selectedOption = optionValue;

          // Tính tổng điểm cho item chính
          const totalSelfScore = newData[sectionIndex].items[itemIndex].hasContent!.reduce(
            (sum: number, content: any) => sum + (content.selfScore || 0),
            0
          );

          newData[sectionIndex].items[itemIndex].selfScore = totalSelfScore;
        } else if (subIndex !== undefined) {
          // Cập nhật cho sub-item thông thường
          newData[sectionIndex].items[itemIndex].subItems![subIndex].selfScore = scoreValue;
          newData[sectionIndex].items[itemIndex].subItems![subIndex].selectedOption = optionValue;
        } else {
          // Cập nhật cho item chính
          newData[sectionIndex].items[itemIndex].selfScore = scoreValue;
          newData[sectionIndex].items[itemIndex].selectedOption = optionValue;
        }

        return newData;
      });

      // Gọi callback để thông báo cho parent component
      if (onSingleChoiceUpdate) {
        const scores = {
          selfScore: scoreValue,
          thamDinhScore: item.thamDinhScore,
          hieuTruongScore: item.hieuTruongScore
        };
        
        // Gọi với item.id (hoặc item.id_sub_index nếu là sub-item)
        let itemId = item.id;
        if (subIndex !== undefined) {
          itemId = `${item.id}_sub_${subIndex}`;
        }
        
        onSingleChoiceUpdate(sectionIndex, itemId, optionValue, scores); // Bỏ await
      }

      // Gửi dữ liệu cập nhật về parent
      if (onDataChange) {
        const updatedData = JSON.parse(JSON.stringify(evaluationData));
        if (subIndex !== undefined && updatedData[sectionIndex].items[itemIndex].hasContent) {
          updatedData[sectionIndex].items[itemIndex].hasContent![subIndex].selfScore = scoreValue;
          updatedData[sectionIndex].items[itemIndex].hasContent![subIndex].selectedOption = optionValue;
        } else if (subIndex !== undefined) {
          updatedData[sectionIndex].items[itemIndex].subItems![subIndex].selfScore = scoreValue;
          updatedData[sectionIndex].items[itemIndex].subItems![subIndex].selectedOption = optionValue;
        } else {
          updatedData[sectionIndex].items[itemIndex].selfScore = scoreValue;
          updatedData[sectionIndex].items[itemIndex].selectedOption = optionValue;
        }
        onDataChange(updatedData);
      }
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const handleScoreChange = async (
    sectionIndex: number,
    itemIndex: number,
    subIndex: number = -1,
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore' = 'selfScore',
    value: number = 0
  ) => {
    if (readOnly) return;

    // Lấy item hiện tại để kiểm tra quyền
    const item = evaluationData[sectionIndex].items[itemIndex];
    
    // Kiểm tra quyền cho từng loại điểm
    if (type === 'selfScore' && !userPermissions.canEditSelfScore) return;
    if (type === 'thamDinhScore' && !userPermissions.canEditPrincipalScore(item)) return;
    if (type === 'hieuTruongScore' && !userPermissions.canEditHieuTruongScore(item)) return;

    try {
      // Cập nhật state local trước
      setEvaluationData(prev => {
        const newData = JSON.parse(JSON.stringify(prev));

        if (subIndex >= 0) {
          // Xử lý sub-item
          if (newData[sectionIndex].items[itemIndex].hasContent) {
            newData[sectionIndex].items[itemIndex].hasContent![subIndex][type] = value;
            
            // Nếu là điểm thẩm định hoặc hiệu trưởng cho sub-item, cần kiểm tra quyền cụ thể
            const subItem = newData[sectionIndex].items[itemIndex].hasContent![subIndex];
            const hasRoleItem = subItem.hasRole ? subItem : newData[sectionIndex].items[itemIndex];
            
            if (type === 'thamDinhScore') {
              const canEdit = userPermissions.canEditPrincipalScore(hasRoleItem);
              if (!canEdit) return prev; // Không có quyền, không cập nhật
            } else if (type === 'hieuTruongScore') {
              const canEdit = userPermissions.canEditHieuTruongScore(hasRoleItem);
              if (!canEdit) return prev; // Không có quyền, không cập nhật
            }
          } else if (newData[sectionIndex].items[itemIndex].subItems) {
            newData[sectionIndex].items[itemIndex].subItems![subIndex][type] = value;
          }
        } else {
          // Xử lý item chính
          newData[sectionIndex].items[itemIndex][type] = value;
        }

        return newData;
      });

      // Gọi callback để thông báo cho parent component (evaluate-view-12.tsx)
      if (onScoreUpdate) {
        const scores = { [type]: value };
        const itemId = item.id;
        onScoreUpdate(sectionIndex, itemId, scores);
      }

      // Nếu có onScoreBlur và là điểm thẩm định/hiệu trưởng, gọi blur handler
      if ((type === 'thamDinhScore' || type === 'hieuTruongScore') && onScoreBlur) {
        onScoreBlur(sectionIndex, itemIndex, type, value);
      }

      // Gửi dữ liệu cập nhật về parent
      if (onDataChange) {
        const updatedData = JSON.parse(JSON.stringify(evaluationData));
        if (subIndex >= 0) {
          if (updatedData[sectionIndex].items[itemIndex].hasContent) {
            updatedData[sectionIndex].items[itemIndex].hasContent![subIndex][type] = value;
          } else if (updatedData[sectionIndex].items[itemIndex].subItems) {
            updatedData[sectionIndex].items[itemIndex].subItems![subIndex][type] = value;
          }
        } else {
          updatedData[sectionIndex].items[itemIndex][type] = value;
        }
        onDataChange(updatedData);
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleJustificationChange = async (
    sectionIndex: number,
    itemIndex: number,
    justification: string,
    subIndex: number = -1,
    isSubItem: boolean = false
  ) => {
    if (readOnly || !userPermissions.canEditJustification) return;

    const item = evaluationData[sectionIndex].items[itemIndex];
    let itemId = item.id;
    
    if (isSubItem && subIndex >= 0) {
      itemId = `${item.id}_sub_${subIndex}`;
    }

    // Gọi prop để cập nhật parent component (debounced)
    if (onJustificationUpdate) {
      onJustificationUpdate(sectionIndex, itemId, justification);
    }

    // Cập nhật state local ngay lập tức để hiển thị
    setEvaluationData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      
      if (isSubItem && subIndex >= 0) {
        // Xử lý sub-item trong hasContent
        if (newData[sectionIndex].items[itemIndex].hasContent?.[subIndex]) {
          newData[sectionIndex].items[itemIndex].hasContent[subIndex].justification = justification;
        }
      } else {
        // Xử lý regular item hoặc main item
        newData[sectionIndex].items[itemIndex].justification = justification;
      }
      
      return newData;
    });
  };

  // Hàm mới xử lý khi blur
  const handleJustificationBlur = async (
    sectionIndex: number,
    itemIndex: number,
    justification: string,
    subIndex: number = -1,
    isSubItem: boolean = false
  ) => {
    if (readOnly || !userPermissions.canEditJustification) return;

    const item = evaluationData[sectionIndex].items[itemIndex];
    let itemId = item.id;
    
    if (isSubItem && subIndex >= 0) {
      itemId = `${item.id}_sub_${subIndex}`;
    }

    // Gọi prop blur để cập nhật ngay lập tức
    if (onJustificationBlur) {
      onJustificationBlur(sectionIndex, itemId, justification);
    }

    // Gửi dữ liệu cập nhật về parent
    if (onDataChange) {
      const updatedData = JSON.parse(JSON.stringify(evaluationData));
      if (isSubItem && subIndex >= 0) {
        if (updatedData[sectionIndex].items[itemIndex].hasContent?.[subIndex]) {
          updatedData[sectionIndex].items[itemIndex].hasContent[subIndex].justification = justification;
        }
      } else {
        updatedData[sectionIndex].items[itemIndex].justification = justification;
      }
      onDataChange(updatedData);
    }
  };

  // Hàm xử lý khi evidence được thay đổi
  const handleEvidenceChange = (
    sectionIndex: number,
    itemIndex: number,
    subIndex: number = -1,
    activityIndex: number = -1,
    files: UploadedFileInfo[],
    isSubItem: boolean = false,
    isAcitivity: boolean = false
  ) => {
    if (readOnly || !userPermissions.canUploadEvidence) return;

    console.log('Handling evidence change for section:', sectionIndex, 'item:', itemIndex, 'subIndex:', subIndex, 'activityIndex:', activityIndex, 'isSubItem:', isSubItem, 'isActivity:', isAcitivity, 'files:', files);

    setEvaluationData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (isSubItem && subIndex >= 0) {
        newData[sectionIndex].items[itemIndex].hasContent![subIndex].evidenceFiles = files;
      } else if (isAcitivity && activityIndex >= 0) {
        newData[sectionIndex].items[itemIndex].hasActivity![activityIndex].evidenceFiles = files;
      } else {
        newData[sectionIndex].items[itemIndex].evidenceFiles = files;
      }

      console.log('Updated evaluation data after evidence change:', newData);
      // Gửi dữ liệu cập nhật về parent
      if (onDataChange) {
        onDataChange(newData);
      }
      return newData;
    });
  };

  // Hàm xử lý xóa evidence
  const handleEvidenceRemoveLocal = (
    sectionIndex: number,
    itemIndex: number,
    fileIndex: number,
    subIndex: number = -1,
    activityIndex: number = -1,
    isSubItem: boolean = false,
    isActivity: boolean = false
  ) => {
    if (readOnly) return;

    const item = evaluationData[sectionIndex].items[itemIndex];

    // Cập nhật state local
    setEvaluationData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      if (isSubItem && subIndex >= 0) {
        newData[sectionIndex].items[itemIndex].hasContent![subIndex].evidenceFiles?.splice(fileIndex, 1);
      } else if (isActivity && activityIndex >= 0) {
        newData[sectionIndex].items[itemIndex].hasActivity![activityIndex].evidenceFiles?.splice(fileIndex, 1);
      } else {
        newData[sectionIndex].items[itemIndex].evidenceFiles?.splice(fileIndex, 1);
      }
      // Gửi dữ liệu cập nhật về parent
      if (onDataChange) {
        onDataChange(newData);
      }
      return newData;
    });

    // Gọi prop để cập nhật state cha (nếu có)
    if (onEvidenceRemove) {
      onEvidenceRemove(sectionIndex, item.id, fileIndex);
    }
  };

  // Tính tổng điểm
  const calculateTotalScore = (type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore') =>
    evaluationData.reduce((total, section) =>
      total + section.items.reduce((sectionSum, item) => {
        let itemScore = 0;

        if (item.hasContent && item.hasContent.length > 0) {
          itemScore = item.hasContent.reduce(
            (contentSum, contentItem) => {
              const score = contentItem[type] || 0;
              return contentSum + score;
            },
            0
          );
        } else {
          itemScore = item[type] || 0;

          if (item.subItems && item.subItems.length > 0) {
            item.subItems.forEach((subItem: any) => {
              itemScore += subItem[type] || 0;
            });
          }
        }

        return sectionSum + itemScore;
      }, 0)
      , 0);

  const totalSelfScore = calculateTotalScore('selfScore');
  const totalPrincipalScore = calculateTotalScore('thamDinhScore');
  const totalHieuTruongScore = calculateTotalScore('hieuTruongScore');

  const handleHasContentScoreChange = (
    sectionIndex: number,
    itemIndex: number,
    subIndex: number,
    type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore',
    value: number
  ) => {
    handleScoreChange(sectionIndex, itemIndex, subIndex, type, value);
  };

  // Wrapper functions cho RegularItemRow và BonusItemRow
  const handleRegularEvidenceRemove = (sectionIndex: number, itemIndex: number, fileIndex: number) => {
    handleEvidenceRemoveLocal(sectionIndex, itemIndex, fileIndex, -1, -1, false);
  };

  // Wrapper functions cho RegularItemRow và BonusItemRow
  const handleActivityEvidenceRemove = (sectionIndex: number, itemIndex: number, activityIndex: number, fileIndex: number) => {
    handleEvidenceRemoveLocal(sectionIndex, itemIndex, fileIndex, -1, activityIndex, false, true);
  };

  const handleRegularEvidenceChange = (sectionIndex: number, itemIndex: number, files: UploadedFileInfo[]) => {
    handleEvidenceChange(sectionIndex, itemIndex, -1, -1, files, false);
  };

  const handleActivityEvidenceChange = (sectionIndex: number, itemIndex: number, activityIndex: number, files: UploadedFileInfo[]) => {
    handleEvidenceChange(sectionIndex, itemIndex, -1, activityIndex, files, false, true);
  };

  // Mobile view
  if (isMobile) {
    return (
      <Box sx={{ p: 1 }}>
        {/* Hiển thị thông tin quyền */}
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          icon={<InfoIcon />}
        >
          <Typography variant="body2" fontWeight="medium">
            {getRoleInfo()}
          </Typography>
        </Alert>

        {readOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Chế độ xem chỉ đọc:</strong> Không thể chỉnh sửa
          </Alert>
        )}

        {/* Mobile view với card layout */}
        {evaluationData.map((section, sectionIndex) => (
          <Card key={sectionIndex} sx={{ mb: 3, borderRadius: 2 }}>
            {/* Section header */}
            <CardHeader
              title={
                <Typography variant="subtitle1" fontWeight="bold" color="primary.contrastText">
                  {section.title}
                </Typography>
              }
              sx={{
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                py: 2,
              }}
            />
            
            <CardContent sx={{ p: 2 }}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={item.id}>
                  {section.title.includes('ĐIỂM THƯỞNG') ? (
                    <MobileBonusItem
                      item={item}
                      sectionIndex={sectionIndex}
                      itemIndex={itemIndex}
                      onJustificationChange={onActivityJustificationUpdate}
                      onJustificationBlur={onActivityJustificationBlur}
                      onScoreChange={onActivityScoreUpdate}
                      onEvidenceChange={handleActivityEvidenceChange}
                      onEvidenceRemove={handleActivityEvidenceRemove}
                      onEvidenceUpload={onActivityEvidenceUpload}
                      onAddActivity={onAddActivity}
                      onRemoveActivity={onRemoveActivity}
                      readOnly={readOnly}
                      userPermissions={userPermissions}
                    />
                  ) : item.hasContent ? (
                    <MobileHasContentItem
                      item={item}
                      sectionIndex={sectionIndex}
                      itemIndex={itemIndex}
                      onScoreChange={handleHasContentScoreChange}
                      onOptionSelect={handleOptionSelect}
                      onJustificationChange={handleJustificationChange}
                      onJustificationBlur={handleJustificationBlur}
                      onEvidenceChange={handleEvidenceChange}
                      onEvidenceRemove={handleEvidenceRemoveLocal}
                      onEvidenceUpload={onEvidenceUpload}
                      readOnly={readOnly}
                      userPermissions={userPermissions}
                    />
                  ) : (
                    <MobileRegularItem
                      item={item}
                      sectionIndex={sectionIndex}
                      itemIndex={itemIndex}
                      onJustificationChange={handleJustificationChange}
                      onJustificationBlur={handleJustificationBlur}
                      onScoreChange={(secIndex, itmIndex, type, value) =>
                        handleScoreChange(secIndex, itmIndex, -1, type, value)
                      }
                      onEvidenceChange={handleRegularEvidenceChange}
                      onEvidenceRemove={handleRegularEvidenceRemove}
                      onEvidenceUpload={onEvidenceUpload}
                      readOnly={readOnly}
                      userPermissions={userPermissions}
                    />
                  )}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Tổng điểm mobile */}
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="TỔNG ĐIỂM"
            sx={{
              backgroundColor: 'primary.dark',
              color: 'primary.contrastText',
              py: 1.5,
            }}
            titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
          />
          <CardContent>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', // 3 cột cho 3 phần tử
              gap: 2,
              mb: 2 
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Tự đánh giá
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {totalSelfScore}/100
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Thẩm định
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="secondary.main">
                  {totalPrincipalScore}/100
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Hiệu trưởng
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {totalHieuTruongScore}/100
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Desktop view
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table stickyHeader sx={{ minWidth: isSmallScreen ? 1000 : 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 400, fontWeight: 'bold', width: '45%', backgroundColor: 'primary.main', color: 'white' }}>
                NỘI DUNG ĐÁNH GIÁ
              </TableCell>
              <TableCell sx={{ minWidth: 80, fontWeight: 'bold', width: '8%', backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
                ĐIỂM
              </TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold', width: '8%', backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
                Tự đánh giá
              </TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold', width: '8%', backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
                {scoreLabels.principal}
              </TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold', width: '8%', backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
                {scoreLabels.hieuTruong}
              </TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold', width: '15%', backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
                MINH CHỨNG
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {evaluationData.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell colSpan={6} sx={{ py: 2, fontWeight: 'bold' }}>
                    <Typography variant="subtitle1" color="primary.contrastText">
                      {section.title}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* THÊM VÒNG LẶP items Ở ĐÂY */}
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={item.id}>
                    {section.title.includes('ĐIỂM THƯỞNG') ? (
                      <BonusItemRow
                        item={item}
                        sectionIndex={sectionIndex}
                        itemIndex={itemIndex}
                        onJustificationChange={onActivityJustificationUpdate}
                        onJustificationBlur={onActivityJustificationBlur}
                        onScoreChange={onActivityScoreUpdate}
                        onEvidenceChange={handleActivityEvidenceChange}
                        onEvidenceRemove={handleActivityEvidenceRemove}
                        onEvidenceUpload={onActivityEvidenceUpload}
                        onAddActivity={onAddActivity}
                        onRemoveActivity={onRemoveActivity}
                        readOnly={readOnly}
                        formType={formType}
                        userPermissions={userPermissions}
                        evaluationData={evaluationData}
                        setEvaluationData={setEvaluationData}
                      />
                    ) : item.hasContent ? (
                      /* Xử lý items có hasContent */
                      <HasContentItemRow
                        item={item}
                        sectionIndex={sectionIndex}
                        itemIndex={itemIndex}
                        onScoreChange={handleHasContentScoreChange}
                        onHasContentScoreBlur={onHasContentScoreBlur}
                        onOptionSelect={handleOptionSelect}
                        onJustificationChange={handleJustificationChange}
                        onJustificationBlur={handleJustificationBlur}
                        onEvidenceChange={handleEvidenceChange}
                        onEvidenceRemove={handleEvidenceRemoveLocal}
                        onEvidenceUpload={onEvidenceUpload}
                        readOnly={readOnly}
                        formType={formType}
                        userPermissions={userPermissions}
                        evaluationData={evaluationData}
                        setEvaluationData={setEvaluationData}
                      />
                    ) : (
                      /* Xử lý items thông thường */
                      <RegularItemRow
                        item={item}
                        sectionIndex={sectionIndex}
                        itemIndex={itemIndex}
                        onJustificationChange={handleJustificationChange}
                        onJustificationBlur={handleJustificationBlur}
                        onScoreChange={(secIndex, itmIndex, type, value) =>
                          handleScoreChange(secIndex, itmIndex, -1, type, value)
                        }
                        onEvidenceChange={handleRegularEvidenceChange}
                        onEvidenceRemove={handleRegularEvidenceRemove}
                        onEvidenceUpload={onEvidenceUpload}
                        readOnly={readOnly}
                        formType={formType}
                        userPermissions={userPermissions}
                      />
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
                        readOnly={readOnly}
                        userPermissions={userPermissions}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}

            {/* Tổng điểm */}
            <TableRow sx={{ fontWeight: 'bold' }}>
              <TableCell sx={{ py: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                TỔNG ĐIỂM
              </TableCell>
              <TableCell sx={{ py: 2, fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}>
                100
              </TableCell>
              <TableCell sx={{ py: 1, textAlign: 'center' }}>
                <TextField
                  type="number"
                  size="small"
                  value={totalSelfScore}
                  inputProps={{
                    min: 0,
                    max: 100,
                    style: {
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }
                  }}
                  sx={{
                    width: 80,
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                    },
                  }}
                  disabled
                />
              </TableCell>
              <TableCell sx={{ py: 1, textAlign: 'center' }}>
                <TextField
                  type="number"
                  size="small"
                  value={totalPrincipalScore}
                  inputProps={{
                    min: 0,
                    max: 100,
                    style: {
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }
                  }}
                  sx={{
                    width: 80,
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                    },
                  }}
                  disabled
                />
              </TableCell>
              <TableCell sx={{ py: 1, textAlign: 'center' }}>
                <TextField
                  type="number"
                  size="small"
                  value={totalHieuTruongScore}
                  inputProps={{
                    min: 0,
                    max: 100,
                    style: {
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }
                  }}
                  sx={{
                    width: 80,
                    '& .MuiInputBase-input': {
                      fontWeight: 'bold',
                    },
                  }}
                  disabled
                />
              </TableCell>
              <TableCell sx={{ py: 1, textAlign: 'center' }} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}