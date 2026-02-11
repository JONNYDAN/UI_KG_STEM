import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useRouter, usePathname } from 'src/routes/hooks';

import { useAuth } from 'src/contexts/AuthContext';

// ----------------------------------------------------------------------

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
  user?: {
    name?: string;
    photoURL?: string;
    role?: string;
    group?: string[];
  } | null;
};

export function AccountPopover({ 
  data = [],
  user, 
  sx, ...other 
}: AccountPopoverProps) {
  const { user: authUser, logout } = useAuth(); // Lấy user từ context
  const router = useRouter();
  const pathname = usePathname();

  // Ưu tiên sử dụng user từ props, nếu không có thì dùng từ auth context
  const _myAccount = user || authUser;

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleClickItem = useCallback(
    (path: string) => {
      handleClosePopover();
      router.push(path);
    },
    [handleClosePopover, router]
  );

  const handleSignIn = useCallback(() => {
    handleClosePopover();
    router.push('/');
  }, [handleClosePopover, router]);

  const handleLogout = useCallback(async () => {
    handleClosePopover();
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  }, [handleClosePopover, router, logout]);

  // Kiểm tra user có tồn tại không
  const isUserAuthenticated = !!_myAccount;

  // Lấy chữ cái đầu của tên để hiển thị trên avatar
  const getInitial = () => {
    if (!_myAccount?.name) return 'U';
    return _myAccount.name.charAt(0).toUpperCase();
  };

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          p: '2px',
          width: 40,
          height: 40,
          background: (theme) =>
            `conic-gradient(${theme.vars.palette.primary.light}, ${theme.vars.palette.warning.light}, ${theme.vars.palette.primary.light})`,
          ...sx,
        }}
        {...other}
      >
        <Avatar 
          src={_myAccount?.photoURL} 
          alt={_myAccount?.name || 'User'} 
          sx={{ width: 1, height: 1 }}
        >
          {getInitial()}
        </Avatar>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 240 },
          },
        }}
      >
        {isUserAuthenticated ? (
          <>
            <Box sx={{ p: 2, pb: 1.5 }}>
              <Typography variant="subtitle2" noWrap>
                {_myAccount?.name || 'Người dùng'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {_myAccount?.role ? (
                  <>
                    {_myAccount.role.replace(/_/g, ' ')}
                  </>
                ) : (
                  'Không có thông tin vai trò'
                )}
              </Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <MenuList
              disablePadding
              sx={{
                p: 1,
                gap: 0.5,
                display: 'flex',
                flexDirection: 'column',
                [`& .${menuItemClasses.root}`]: {
                  px: 1,
                  gap: 2,
                  borderRadius: 0.75,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                  [`&.${menuItemClasses.selected}`]: {
                    color: 'text.primary',
                    bgcolor: 'action.selected',
                    fontWeight: 'fontWeightSemiBold',
                  },
                },
              }}
            >
              {data.map((option) => (
                <MenuItem
                  key={option.label}
                  selected={option.href === pathname}
                  onClick={() => handleClickItem(option.href)}
                >
                  {option.icon}
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box sx={{ p: 1 }}>
              <Button 
                fullWidth 
                color="error" 
                size="medium" 
                variant="text" 
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" noWrap sx={{ mb: 1 }}>
              Bạn chưa đăng nhập
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Vui lòng đăng nhập để tiếp tục
            </Typography>
            <Button 
              fullWidth 
              color="primary" 
              variant="contained" 
              onClick={handleSignIn}
            >
              Đăng nhập
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}