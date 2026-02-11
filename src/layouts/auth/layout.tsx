import type { CSSObject, Breakpoint } from '@mui/material/styles';

import { merge } from 'es-toolkit';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';

import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';

import { AuthContent } from './content';
import { MainSection } from '../core/main-section';
import { LayoutSection } from '../core/layout-section';
import { HeaderSection } from '../core/header-section';

import type { AuthContentProps } from './content';
import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';


// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type AuthLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
    content?: AuthContentProps;
  };
};

// export function AuthLayout({
//   sx,
//   cssVars,
//   children,
//   slotProps,
//   layoutQuery = 'md',
// }: AuthLayoutProps) {
//   const renderHeader = () => {
//     const headerSlotProps: HeaderSectionProps['slotProps'] = { container: { maxWidth: false } };

//     const headerSlots: HeaderSectionProps['slots'] = {
//       topArea: (
//         <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
//           This is an info Alert.
//         </Alert>
//       ),
//       leftArea: (
//         <>
//           {/** @slot Logo */}
//           <Logo />
//         </>
//       ),
//       rightArea: (
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
//           {/** @slot Help link */}
//           <Link href="#" component={RouterLink} color="inherit" sx={{ typography: 'subtitle2' }}>
//             {/* Need help? */}
//           </Link>
//         </Box>
//       ),
//     };

//     return (
//       <HeaderSection
//         disableElevation
//         layoutQuery={layoutQuery}
//         {...slotProps?.header}
//         slots={{ ...headerSlots, ...slotProps?.header?.slots }}
//         slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
//         sx={[
//           { position: { [layoutQuery]: 'fixed' } },
//           ...(Array.isArray(slotProps?.header?.sx)
//             ? (slotProps?.header?.sx ?? [])
//             : [slotProps?.header?.sx]),
//         ]}
//       />
//     );
//   };

//   const renderFooter = () => null;

//   const renderMain = () => (
//     <MainSection
//       {...slotProps?.main}
//       sx={[
//         (theme) => ({
//           alignItems: 'center',
//           p: theme.spacing(3, 2, 10, 2),
//           [theme.breakpoints.up(layoutQuery)]: {
//             justifyContent: 'center',
//             p: theme.spacing(10, 0, 10, 0),
//           },
//         }),
//         ...(Array.isArray(slotProps?.main?.sx)
//           ? (slotProps?.main?.sx ?? [])
//           : [slotProps?.main?.sx]),
//       ]}
//     >
//       <AuthContent {...slotProps?.content}>{children}</AuthContent>
//     </MainSection>
//   );

//   const { pathname } = useLocation();
//   const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';
//   return (
    
//     <LayoutSection
//       /** **************************************
//        * @Header
//        *************************************** */
//       headerSection={renderHeader()}
//       /** **************************************
//        * @Footer
//        *************************************** */
//       footerSection={renderFooter()}
//       /** **************************************
//        * @Styles
//        *************************************** */
//       cssVars={{'--layout-auth-content-width': isAuthPage ? '420px' : '992px',...cssVars, }}
//       sx={[
//         (theme) => ({
//           position: 'relative',
//           '&::before': backgroundStyles(),
//         }),
//         ...(Array.isArray(sx) ? sx : [sx]),
//       ]}
//     >
//       {renderMain()}
//     </LayoutSection>
//   );
// }

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutSection
      headerSection={
        <HeaderSection
          disableElevation
          slotProps={{ container: { maxWidth: false } }}
          slots={{
            topArea: (
              <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                This is an info Alert.
              </Alert>
            ),
            leftArea: <Logo />,
            rightArea: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Link href="#" component={RouterLink} color="inherit" sx={{ typography: 'subtitle2' }}>
                  {/* Need help? */}
                </Link>  
              </Box>
            ),
          }}
          sx={{ position: 'fixed' }}
        />
      }
      footerSection={null}
      cssVars={{ '--layout-auth-content-width': '420px' }}
      sx={{
        position: 'relative',
        '&::before': backgroundStyles(),
      }}
    >
      <MainSection
        sx={(theme) => ({
          alignItems: 'center',
          justifyContent: 'center',
          p: theme.spacing(10, 2),
        })}
      >
        <AuthContent>{children}</AuthContent>
      </MainSection>
    </LayoutSection>
  );
}

// ----------------------------------------------------------------------

export function BackgroundLayout({
  sx,
  cssVars,
  children,
}: LayoutBaseProps) {
  return (
    <LayoutSection
  headerSection={null}
  footerSection={null}
  cssVars={{ '--layout-auth-content-width': '100%', ...cssVars }}
  sx={[
    {
      position: 'relative',
      '&::before': backgroundStyles(), // overlay
    },
    ...(Array.isArray(sx) ? sx : [sx]),
  ]}
>
  <Box sx={{ position: 'relative', zIndex: 1 }}>
    {children}
  </Box>
</LayoutSection>
  );
}

// ----------------------------------------------------------------------

const backgroundStyles = (): CSSObject => ({
  zIndex: 1,
  // opacity: 0.24,
  width: '100%',
  height: '100%',
  content: "''",
  position: 'absolute',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  // backgroundPosition: 'center center',
  // backgroundImage: 'url(/assets/background/overlay.jpg)',
  backgroundImage: 'url(/hcmue_white_bg.png)',          
});
