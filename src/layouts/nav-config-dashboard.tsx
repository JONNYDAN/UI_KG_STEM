import { useAuth } from 'src/contexts/AuthContext';

import { SvgColor } from 'src/components/svg-color';

// Icon helper
const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  role?: string | string[];
};

// Navigation items for STEM Query System
export const baseNavData: NavItem[] = [
  {
    title: 'Truy vấn STEM',
    path: '/stem/query',
    icon: icon('majesticons--search'),
  },
];

// Create admin-specific nav items
const createRoleBasedNavItems = (userRole: string): NavItem[] => {
  const items: NavItem[] = [];

  // Admin-only routes
  if (['admin', 'ADMIN'].includes(userRole)) {
    items.push({
      title: 'Xem Logs Truy vấn',
      path: '/stem/admin',
      icon: icon('majesticons--checkbox-list-detail-line'),
    });
    items.push({
      title: 'Quản lý Entities',
      path: '/stem/entities',
      icon: icon('majesticons--settings-cog-line'),
    });
    items.push({
      title: 'Quản lý Bộ 3 (S-R-O)',
      path: '/stem/triples',
      icon: icon('majesticons--link'),
    });
  }

  return items;
};

// Hook to get navigation data based on user role
export const useNavData = (): NavItem[] => {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) {
    return baseNavData;
  }

  // Get admin-specific items if applicable
  const roleBasedItems = createRoleBasedNavItems(user.role);
  
  return [
    ...baseNavData,
    ...roleBasedItems
  ];
};

// Export for global use
export const navData = baseNavData;