'use client';

import NextLink, { LinkProps } from 'next/link';
import { ReactNode } from 'react';
import NProgress from 'nprogress';
import { useSidebar } from '@/hooks/use-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export function CustomLink({ children, className, ...props }: CustomLinkProps) {
  const { setOpenMobile } = useSidebar()
  const isMobile = useIsMobile()
  
  const handleClick = () => {

    if (isMobile) {
      console.log("------------ iam in mobile mode")
      setOpenMobile(false);
    }

    NProgress.start();
  };

  return (
    <NextLink {...props} onClick={handleClick} className={className}>
      {children}
    </NextLink>
  );
}
