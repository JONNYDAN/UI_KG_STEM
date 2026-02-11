import React, { useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { UploadedFileInfo } from 'src/services/type';

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  fileName
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

// Helper function để format kích thước file
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const MobileEvidenceUploadCompact = ({
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
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ index: number; fileName: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isDisabled = readOnly || !userPermissions.canUploadEvidence;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;

    const selectedFiles = Array.from(event.target.files || []) as File[];

    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
      setUploadError(`Một số file vượt quá giới hạn 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

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
        // Reset input file
        event.target.value = '';
      }
    }
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

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
        disabled={isDisabled}
        fullWidth
        sx={{
          justifyContent: 'flex-start',
          textTransform: 'none',
          fontSize: '0.875rem',
        }}
      >
        Minh chứng ({files.length})
      </Button>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: 1
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          py: 1.5
        }}>
          <Typography variant="h6" fontWeight="bold">
            Quản lý minh chứng
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          {/* Thông báo giới hạn file */}
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-icon': {
                color: 'info.main'
              }
            }}
            icon={<InfoIcon />}
          >
            <Typography variant="body2">
              <strong>Giới hạn tải lên:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              • Kích thước mỗi file tối đa: <strong>10MB</strong>
            </Typography>
            <Typography variant="body2">
              • Định dạng cho phép: <strong>Hình ảnh, PDF, Word</strong>
            </Typography>
          </Alert>

          {uploadError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setUploadError(null)}
            >
              {uploadError}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
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
                sx={{ borderRadius: 2 }}
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
                  p: 1.5,
                  mb: 1,
                  border: 1,
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium" noWrap>
                    {file.originalname}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={formatFileSize(file.size)}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {file.mimetype}
                    </Typography>
                  </Box>
                  {file.url && (
                    <Button
                      size="small"
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<VisibilityIcon />}
                      sx={{ mt: 1 }}
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
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            {files.length === 0 && !uploading && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center"
                sx={{ py: 3 }}
              >
                Chưa có minh chứng nào được tải lên
              </Typography>
            )}
            {uploading && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Đang tải lên file...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Hiển thị tổng kích thước */}
          {files.length > 0 && (
            <Box sx={{ 
              mt: 2, 
              p: 1.5, 
              backgroundColor: 'grey.50', 
              borderRadius: 1,
              border: 1,
              borderColor: 'grey.200'
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Tổng kích thước:</strong> {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={uploading}
            sx={{ borderRadius: 2 }}
          >
            Đóng
          </Button>
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