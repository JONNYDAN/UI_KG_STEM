import React, { useState } from 'react';

import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { UploadedFileInfo, EvaluationItem } from 'src/services/type';

import { HTMLContent } from '../form-evaluate-body-12';
import { MobileScoreDisplay } from './MobileScoreDisplay';
import { JustificationField } from './JustificationField ';
import { MobileEvidenceUploadCompact } from './MobileEvidenceUploadCompact';

interface DeleteActivityConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activityIndex: number;
  itemTitle?: string;
}

const DeleteActivityConfirmModal: React.FC<DeleteActivityConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  activityIndex,
  itemTitle
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
            Hoạt động {activityIndex + 1} sẽ bị xóa vĩnh viễn.
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
            • Vị trí: Hoạt động thứ {activityIndex + 1}
          </Typography>
          {itemTitle && (
            <Typography variant="body2" color="text.secondary">
              • Thuộc mục: {itemTitle}
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

export const MobileBonusItem = ({
  item,
  sectionIndex,
  itemIndex,
  onJustificationChange = () => {},
  onJustificationBlur = () => {},
  onScoreChange = () => {},
  onEvidenceChange = () => {},
  onEvidenceRemove = () => {},
  onEvidenceUpload = async () => [],
  onAddActivity = () => {},
  onRemoveActivity = () => {},
  readOnly = false,
  userPermissions,
}: {
  item: EvaluationItem;
  sectionIndex: number;
  itemIndex: number;
  onJustificationChange?: (sectionIndex: number, itemIndex: number, activityIndex: number, justification: string) => void;
  onJustificationBlur?: (sectionIndex: number, itemIndex: number, activityIndex: number, justification: string) => void;
  onScoreChange?: (sectionIndex: number, itemIndex: number, activityIndex: number, type: 'selfScore' | 'thamDinhScore' | 'hieuTruongScore', value: number) => void;
  onEvidenceChange?: (sectionIndex: number, itemIndex: number, activityIndex: number, files: UploadedFileInfo[], isActivity?: boolean) => void;
  onEvidenceRemove?: (sectionIndex: number, itemIndex: number, activityIndex: number, fileIndex: number, isActivity?: boolean) => void;
  onEvidenceUpload?: (sectionIndex: number, itemIndex: number, activityIndex: number, files: File[]) => Promise<UploadedFileInfo[]>;
  onAddActivity?: (sectionIndex: number, itemIndex: number) => void;
  onRemoveActivity?: (sectionIndex: number, itemIndex: number, activityIndex: number) => void;
  readOnly?: boolean;
  userPermissions: any;
}) => {
  const theme = useTheme();
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

  const maxScorePerActivity = item.id === "3.1" ? 2 : 1;

  return (
    <Box sx={{
      border: `1px solid ${theme.palette.warning.main}`,
      borderRadius: 2,
      padding: 2,
      marginBottom: 2,
    }}>
      {/* Item header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Chip
            label={item.id}
            size="small"
            color="warning"
            variant="filled"
            sx={{ minWidth: 36 }}
          />
          <Typography variant="subtitle2" fontWeight="bold" color="warning.dark">
            {item.title}
          </Typography>
        </Box>
        
        <HTMLContent content={item.content} />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold" fontSize={14} color="warning.dark">
            Nội dung chi tiết:
          </Typography>
        </Box>
      </Box>

      {/* Các hoạt động đã thêm */}
      {item.hasActivity?.map((activity, activityIndex) => {
        const activityItemId = `${item.id.replace(/\./g, '_')}_activity_${activityIndex}`;
        
        return (
          <Box
            key={activityItemId}
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `2px dashed ${theme.palette.warning.main}`,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              p: 2,
            }}
          >
            {/* Header với nút xóa */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="body2" fontWeight="bold" color="text.secondary">
                Hoạt động {activityIndex + 1}:
              </Typography>
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
                      backgroundColor: 'error.light + 20'
                    }
                  }}
                  startIcon={<DeleteIcon sx={{ fontSize: 18 }} />}
                >
                  Xóa
                </Button>
              )}
            </Box>

            {/* Mô tả hoạt động */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" fontWeight="medium" color="text.secondary" sx={{ mb: 0.5 }}>
                Mô tả chi tiết:
              </Typography>
              <JustificationField
                value={activity.justification || ''}
                onBlur={(value) => onJustificationBlur(sectionIndex, itemIndex, activityIndex, value)}
                placeholder="Nhập mô tả chi tiết về hoạt động điểm thưởng..."
                rows={3}
                disabled={readOnly || !userPermissions.canEditJustification}
                size="small"
              />
            </Box>

            {/* Scores cho hoạt động */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 1, 
              mb: 2 
            }}>
              <Box>
                <MobileScoreDisplay
                  label="Điểm tối đa"
                  value={maxScorePerActivity}
                  maxValue={maxScorePerActivity}
                  color="warning"
                  disabled
                />
              </Box>
              <Box>
                <MobileScoreDisplay
                  label="Tự đánh giá"
                  value={maxScorePerActivity}
                  maxValue={maxScorePerActivity}
                  color="warning"
                  disabled
                />
              </Box>
              <Box>
                <MobileScoreDisplay
                  label="Thẩm định"
                  value={activity.thamDinhScore || 0}
                  maxValue={maxScorePerActivity}
                  onChange={(value) => onScoreChange(sectionIndex, itemIndex, activityIndex, 'thamDinhScore', value)}
                  disabled={readOnly || !userPermissions.canEditPrincipalScore}
                  color="warning"
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <MobileScoreDisplay
                label="Hiệu trưởng"
                value={activity.hieuTruongScore || 0}
                maxValue={maxScorePerActivity}
                onChange={(value) => onScoreChange(sectionIndex, itemIndex, activityIndex, 'hieuTruongScore', value)}
                disabled={readOnly || !userPermissions.canEditHieuTruongScore}
                color="warning"
              />
            </Box>

            {/* Evidence cho hoạt động */}
            {(activity.evidenceFiles) && (
              <MobileEvidenceUploadCompact
                files={activity.evidenceFiles || []}
                onFilesChange={(files) => onEvidenceChange(sectionIndex, itemIndex, activityIndex, files, true)}
                onFileRemove={(fileIndex) => onEvidenceRemove(sectionIndex, itemIndex, activityIndex, fileIndex, true)}
                onUpload={async (files) => {
                  const uploaded = await onEvidenceUpload(sectionIndex, itemIndex, activityIndex, files);
                  if (uploaded && uploaded.length) {
                    onEvidenceChange(sectionIndex, itemIndex, activityIndex, 
                      [...(activity.evidenceFiles || []), ...uploaded], true);
                  }
                  return uploaded;
                }}
                sectionIndex={sectionIndex}
                itemId={activityItemId}
                readOnly={readOnly}
                userPermissions={userPermissions}
              />
            )}
          </Box>
        );
      })}

      {/* Nút Thêm hoạt động */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => onAddActivity(sectionIndex, itemIndex)}
          disabled={readOnly || !userPermissions.canEditJustification}
          fullWidth
          sx={{
            borderRadius: 2,
            py: 1,
            borderColor: 'primary.main',
            '&:hover': {
              borderColor: 'primary.dark',
              backgroundColor: 'primary.light'
            }
          }}
        >
          Thêm hoạt động
        </Button>
      </Box>

      {/* Modal xác nhận xóa hoạt động */}
      <DeleteActivityConfirmModal
        open={deleteActivityModal.open}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        activityIndex={deleteActivityModal.activityIndex}
        itemTitle={item.title}
      />
    </Box>
  );
};