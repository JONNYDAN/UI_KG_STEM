import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { blue } from '@mui/material/colors';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { OPTIONS } from '../options';
import { CardPortal } from '../card-portal';
import { PortalContainer } from '../portal-container';

// ----------------------------------------------------------------------

export function PortalView() {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<{ key: string; label: string } | null>(null);

  const handleOpen = (option: { key: string; label: string }) => {
    setSelectedOption(option);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    // setSelectedOption(null);
  };

  return (
    <PortalContainer>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1, fontSize: 20, fontWeight: 500, }}>
          Cổng thông tin trường Đại học Sư phạm Thành phố Hồ Chí Minh
        </Box>
      </Box>

        <Box
          sx={{
            display: 'grid',
            rowGap: 3,
           columnGap: 3.5,
            
            gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',    
            sm: 'repeat(2, 1fr)',   
            md: 'repeat(3, 1fr)',   
          },

          }}
        >
          {OPTIONS.map((option) => (
            <Box
              key={option.key}
             sx={{
    cursor: 'pointer',
    boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    boxSizing: 'border-box',
    bgcolor: 'background.paper',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-8px)',      
      border: '2px solid #2196f3',
      boxShadow: 6,
    },
    
              }}
              onClick={() => handleOpen(option)}
            >
              <CardPortal
                icon={<img src={option.image} alt={option.label} />}
                title={option.label}
                topIcon={option.topIcon}
              />
            </Box>
          ))}
        </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedOption?.key === 'admission' ? 'Thông tin tuyển sinh' : 'Thông báo'}
        </DialogTitle>
        <DialogContent>
          {selectedOption?.key === 'admission'
            ? 'Đây là nội dung chi tiết về thông tin tuyển sinh.'
            : 'Bạn cần đăng nhập để sử dụng chức năng này.'}
        </DialogContent>
        {selectedOption?.key !== 'admission' && (
          <DialogActions>
            <Button variant="contained" href="/sign-in">
              Đăng nhập
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </PortalContainer>
  );
}