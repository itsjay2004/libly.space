import React from 'react';

// Define prop types for better type safety and autocompletion in a TypeScript environment.
type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>;
type DivProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * A simple utility to safely join class names, filtering out any falsy values.
 * This is a common pattern in React projects for robust className handling.
 */
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Icon Logo: A standalone themed icon.
 * Asset: /public/images/libly-space-theme.png
 * @param {ImgProps} props - Standard props for an HTML <img> element.
 */
export const IconLogo = (props: ImgProps) => (
  <img src="/images/libly-space-theme.png" alt="Libly.space Icon" {...props} />
);

/**
 * BG Logo: The primary logo graphic without text.
 * Asset: /public/images/libly-space.png
 * @param {ImgProps} props - Standard props for an HTML <img> element.
 */
export const BgLogo = (props: ImgProps) => (
  <img src="/images/libly-space.png" alt="Libly.space Logo" {...props} />
);

/**
 * Full Logo: The primary logo graphic with the brand name.
 * Uses a `span` instead of `h1` for better semantic flexibility across the app.
 * @param {DivProps} props - Standard props for the wrapping HTML <div> element.
 */
export const FullLogo = ({ className, ...props }: DivProps) => (
  <div className={cn("flex items-center justify-center gap-2", className)} {...props}>
    <IconLogo className="h-8 w-8" />
    <span className="text-xl font-semibold text-foreground font-headline">libly.space</span>
  </div>
);

// The default export is the `FullLogo` for convenience.
export default FullLogo;
