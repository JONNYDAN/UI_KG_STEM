import type { Breakpoint } from '@mui/material/styles';

import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';
import { createContext, useContext, useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import { _langs, _notifications } from 'src/_mock';
import { useAuth } from 'src/contexts/AuthContext';

import { NavMobile, NavDesktop } from './nav';
import { layoutClasses } from '../core/classes';
import { _account } from '../nav-config-account';
import { dashboardLayoutVars } from './css-vars';
import { MainSection } from '../core/main-section';
import { Searchbar } from '../components/searchbar';
import { useNavData } from '../nav-config-dashboard';
import { _workspaces } from '../nav-config-workspace';
import { MenuButton } from '../components/menu-button';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { AccountPopover } from '../components/account-popover';
import { LanguagePopover } from '../components/language-popover';
import { NotificationsPopover } from '../components/notifications-popover';

import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';

// Tạo Context để chia sẻ trạng thái collapsed
const SidebarContext = createContext<{
  collapsed: boolean;
  toggleCollapsed: () => void;
}>({
  collapsed: false,
  toggleCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
  };
};

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
}: DashboardLayoutProps) {
  const theme = useTheme();
  const { user } = useAuth(); 
  const navData = useNavData();

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();
  
  // Thêm state quản lý trạng thái collapsed
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
      },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          />
          <NavMobile data={navData} open={open} onClose={onClose} workspaces={_workspaces} />
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
          {/** @slot Account drawer */}
          <AccountPopover data={_account} user={user} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderFooter = () => null;

  const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <LayoutSection
        /** **************************************
         * @Header
         *************************************** */
        headerSection={renderHeader()}
        /** **************************************
         * @Sidebar
         *************************************** */
        sidebarSection={
          <NavDesktop 
            data={navData} 
            layoutQuery={layoutQuery} 
            workspaces={_workspaces}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
          />
        }
        /** **************************************
         * @Footer
         *************************************** */
        footerSection={renderFooter()}
        /** **************************************
         * @Styles
         *************************************** */
        cssVars={{ 
          ...dashboardLayoutVars(theme), 
          ...cssVars,
          // Thêm CSS variable cho width sidebar
          '--layout-nav-collapsed-width': '70px',
        }}
        sx={[
          {
            // Điều chỉnh container chính (chứa cả sidebar và main)
            [`& .${layoutClasses.sidebarContainer}`]: {
              [theme.breakpoints.up(layoutQuery)]: {
                // Điều chỉnh padding-left cho toàn bộ content area
                pl: collapsed 
                  ? 'var(--layout-nav-collapsed-width, 70px)' 
                  : 'var(--layout-nav-vertical-width, 280px)',
                transition: theme.transitions.create(['padding-left'], {
                  easing: 'var(--layout-transition-easing, ease-in-out)',
                  duration: 'var(--layout-transition-duration, 300ms)',
                }),
              },
            },
            // Đảm bảo main content chiếm toàn bộ không gian còn lại
            [`& .${layoutClasses.main}`]: {
              [theme.breakpoints.up(layoutQuery)]: {
                width: '100%',
                transition: theme.transitions.create(['width'], {
                  easing: 'var(--layout-transition-easing, ease-in-out)',
                  duration: 'var(--layout-transition-duration, 300ms)',
                }),
              },
            },
            // Điều chỉnh header để đồng bộ với sidebar
            [`& .${layoutClasses.header}`]: {
              [theme.breakpoints.up(layoutQuery)]: {
                width:'100%',
                left: collapsed 
                  ? 'var(--layout-nav-collapsed-width, 70px)'
                  : 'var(--layout-nav-vertical-width, 280px)',
                transition: theme.transitions.create(['width', 'left'], {
                  easing: 'var(--layout-transition-easing, ease-in-out)',
                  duration: 'var(--layout-transition-duration, 300ms)',
                }),
              },
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {renderMain()}
      </LayoutSection>
    </SidebarContext.Provider>
  );
}