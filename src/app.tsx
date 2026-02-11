// App.tsx
import 'src/global.css';

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // Thêm Outlet

import Fab from '@mui/material/Fab';

import { usePathname } from 'src/routes/hooks';

import { ThemeProvider } from 'src/theme/theme-provider';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function App() { // Xóa props children
  useScrollToTop();

  const githubButton = () => (
    <Fab
      size="medium"
      aria-label="Github"
      href="https://github.com/JONNYDAN/UI_HCMUE_XetTuyen.git"
      sx={{
        zIndex: 9,
        right: 20,
        bottom: 20,
        width: 48,
        height: 48,
        position: 'fixed',
        bgcolor: 'grey.800',
      }}
    >
      <Iconify width={24} icon="socials:github" sx={{ '--color': 'white' }} />
    </Fab>
  );

  return (
    <ThemeProvider>
      <Outlet /> {/* Thay children bằng Outlet */}
      {/* {githubButton()} */}
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}