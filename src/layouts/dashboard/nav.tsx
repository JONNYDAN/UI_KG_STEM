import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useEffect, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import { NavUpgrade } from '../components/nav-upgrade';
import { WorkspacesPopover } from '../components/workspaces-popover';

import type { NavItem } from '../nav-config-dashboard';
import type { WorkspacesPopoverProps } from '../components/workspaces-popover';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data: NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  workspaces: WorkspacesPopoverProps['data'];
  sx?: SxProps<Theme>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function NavDesktop({
  sx,
  data,
  slots,
  workspaces,
  layoutQuery,
  collapsed = false, // Nhận từ parent
  onToggleCollapse, // Nhận từ parent
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  // Nếu có onToggleCollapse từ parent thì dùng, không thì tạo local state
  const [localCollapsed, setLocalCollapsed] = useState(false);
  
  const isCollapsed = onToggleCollapse ? collapsed : localCollapsed;
  
  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setLocalCollapsed(!localCollapsed);
    }
  };

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: isCollapsed 
          ? 'var(--layout-nav-collapsed-width, 70px)' 
          : 'var(--layout-nav-vertical-width)',
        transition: 'width 0.3s ease',
        borderRight: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
        backgroundColor: 'background.paper',
      }}
    >
      {/* Nút toggle */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: isCollapsed ? 'center' : 'flex-end',
        mb: 1 
      }}>
        <IconButton 
          onClick={toggleCollapse} 
          size="small"
          sx={{ 
            mr: isCollapsed ? 0 : -1,
          }}
        >
          {isCollapsed ? (
            <ChevronRightIcon fontSize="small" />
          ) : (
            <ChevronLeftIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      <NavContent 
        data={data} 
        slots={slots} 
        workspaces={workspaces} 
        collapsed={isCollapsed} 
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
  workspaces,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, workspaces, sx, collapsed }: NavContentProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo - Ẩn khi thu gọn */}
      {!collapsed && <Logo />}
      {collapsed && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Logo sx={{ width: 50, height: 40 }} />
        </Box>
      )}

      {slots?.topArea}

      <Scrollbar fillContent>
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box
            component="ul"
            sx={{
              gap: 0.5,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {data.map((item) => {
              const isActived = item.path === pathname;

              return (
                <ListItem disableGutters disablePadding key={item.title}>
                  <ListItemButton
                    disableGutters
                    component={RouterLink}
                    href={item.path}
                    sx={[
                      (theme) => ({
                        pl: collapsed ? 1.5 : 2,
                        py: 1,
                        gap: collapsed ? 0 : 2,
                        pr: collapsed ? 1.5 : 1.5,
                        borderRadius: 0.75,
                        typography: collapsed ? 'caption' : 'body2',
                        fontWeight: 'fontWeightMedium',
                        color: theme.vars.palette.text.secondary,
                        minHeight: 44,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        ...(isActived && {
                          fontWeight: 'fontWeightSemiBold',
                          color: theme.vars.palette.primary.main,
                          bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                          '&:hover': {
                            bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
                          },
                        }),
                      }),
                    ]}
                  >
                    <Box component="span" sx={{ width: 24, height: 24 }}>
                      {item.icon}
                    </Box>

                    {/* Ẩn text khi thu gọn */}
                    {!collapsed && (
                      <Box component="span" sx={{ flexGrow: 1 }}>
                        {item.title}
                      </Box>
                    )}

                    {!collapsed && item.info && item.info}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}

      {/* Ẩn NavUpgrade khi thu gọn */}
      {!collapsed && <NavUpgrade />}
    </>
  );
}