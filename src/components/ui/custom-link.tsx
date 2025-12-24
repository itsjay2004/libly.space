'use client';

import NextLink, { LinkProps } from 'next/link';
import { ReactNode, useContext } from 'react'; // Import useContext
import NProgress from 'nprogress';
import { SidebarContext } from '@/contexts/SidebarContext'; // Import the context directly
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export function CustomLink({ children, className, ...props }: CustomLinkProps) {
  const sidebarContext = useContext(SidebarContext); // Safely get the context
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    // Only try to close the sidebar if we are inside the provider
    if (isMobile && sidebarContext) {
      sidebarContext.setOpenMobile(false);
    }

    NProgress.start();
  };

  return (
    <NextLink {...props} onClick={handleClick} className={className}>
      {children}
    </NextLink>
  );
}
