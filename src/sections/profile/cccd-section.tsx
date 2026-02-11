import { useState } from 'react';

import {
  Box,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button} from '@mui/material';

  import { Iconify } from 'src/components/iconify';

import { IUserProfile } from './profile-info-item';
import { ProfileInfoItem } from './profile-info-item';

// ----------------------------------------------------------------------

interface CccdSectionProps { 
  user: IUserProfile;
  onUpdateCccd: (side: 'front' | 'back', imageUrl: string) => void;
}

// ----------------------------------------------------------------------

export function CccdSection({ user, onUpdateCccd }: CccdSectionProps) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front');

  const handleOpenModal = (side: 'front' | 'back') => {
    setSelectedSide(side);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (file) {
      // Tạo URL tạm thời để preview
      const imageUrl = URL.createObjectURL(file);
      onUpdateCccd(side, imageUrl);
      
      // Ở đây bạn có thể gọi API upload file thực tế
      // uploadCccdImage(file).then((response) => {
      //   onUpdateCccd(side, response.imageUrl);
      // });
    }
  };

  const handleSaveImage = () => {
    // Có thể thêm logic xử lý trước khi đóng modal
    handleCloseModal();
  };

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h6" gutterBottom>
        CCCD / CMND
      </Typography>

      {/* CCCD Images Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Front Side */}
          <CccdImageCard
            title="Mặt trước"
            imageUrl={user.cccdFront}
            onEdit={() => handleOpenModal('front')}
          />
          
          {/* Back Side */}
          <CccdImageCard
            title="Mặt sau"
            imageUrl={user.cccdBack}
            onEdit={() => handleOpenModal('back')}
          />
        </Box>
      </Box>

      {/* Basic Information */}
      <Typography variant="h6" gutterBottom>
        Thông tin cơ bản
      </Typography>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ProfileInfoItem
            icon="mingcute:briefcase-line"
            label="Current Position"
            value={user.currentPosition}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ProfileInfoItem
            icon="mingcute:building-line"
            label="Company"
            value={user.company}
          />
        </Grid>
      </Grid>

      {/* Upload Modal */}
      <CccdUploadModal
        open={openModal}
        onClose={handleCloseModal}
        selectedSide={selectedSide}
        onSideSelect={setSelectedSide}
        frontImage={user.cccdFront}
        backImage={user.cccdBack}
        onImageUpload={handleImageUpload}
        onSave={handleSaveImage}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

interface CccdImageCardProps {
  title: string;
  imageUrl?: string;
  onEdit: () => void;
}

function CccdImageCard({ title, imageUrl, onEdit }: CccdImageCardProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          position: 'relative',
          width: 320,
          height: 180,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          bgcolor: 'background.neutral'
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <Iconify icon={"material-symbols:image-outline" as any} width={40} color="text.disabled" />
        )}
        
        <IconButton
          onClick={onEdit}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.default' }
          }}
        >
          <Iconify icon={"material-symbols:edit-outline" as any} width={16} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

interface CccdUploadModalProps {
  open: boolean;
  onClose: () => void;
  selectedSide: 'front' | 'back';
  onSideSelect: (side: 'front' | 'back') => void;
  frontImage?: string;
  backImage?: string;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => void;
  onSave: () => void;
}

function CccdUploadModal({
  open,
  onClose,
  selectedSide,
  onSideSelect,
  frontImage,
  backImage,
  onImageUpload,
  onSave
}: CccdUploadModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Cập nhật ảnh CCCD
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', py: 2 }}>
          <CccdModalImage
            title="Mặt trước"
            imageUrl={frontImage}
            isSelected={selectedSide === 'front'}
            onSelect={() => onSideSelect('front')}
          />
          
          <CccdModalImage
            title="Mặt sau"
            imageUrl={backImage}
            isSelected={selectedSide === 'back'}
            onSelect={() => onSideSelect('back')}
          />
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<Iconify icon={"material-symbols:cloud-upload" as any} />}
          >
            Tải lên ảnh {selectedSide === 'front' ? 'mặt trước' : 'mặt sau'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => onImageUpload(e, selectedSide)}
            />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Chọn file ảnh từ thiết bị của bạn
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={onSave}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

interface CccdModalImageProps {
  title: string;
  imageUrl?: string;
  isSelected: boolean;
  onSelect: () => void;
}

function CccdModalImage({ title, imageUrl, isSelected, onSelect }: CccdModalImageProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="body2" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          width: 250,
          height: 150,
          border: '2px solid',
          borderColor: isSelected ? 'primary.main' : 'divider',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          bgcolor: 'background.neutral'
        }}
        onClick={onSelect}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Iconify icon={"material-symbols:image-outline" as any} width={50} color="text.disabled" />
        )}
      </Box>
    </Box>
  );
}