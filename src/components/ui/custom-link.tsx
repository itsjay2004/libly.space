'use client';

import NextLink, { LinkProps } from 'next/link';
import { ReactNode } from 'react';
import NProgress from 'nprogress';

interface CustomLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export function CustomLink({ children, className, ...props }: CustomLinkProps) {
  const handleClick = () => {
    NProgress.start();
  };

  return (
    <NextLink {...props} onClick={handleClick} className={className}>
      {children}
    </NextLink>
  );
}
