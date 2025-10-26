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
  <img src="/logo/1000x1000_icon.png" alt="Libly.space Icon" {...props} />
);

/**
 * BG Logo: The primary logo graphic without text.
 * Asset: /public/images/libly-space.png
 * @param {ImgProps} props - Standard props for an HTML <img> element.
 */
export const BgLogo = (props: ImgProps) => (
  <img src="/logo/1000x1000_rounded-corner.png" alt="Libly.space Logo" {...props} />
);

/**
 * Full Logo: The primary logo graphic with the brand name.
 * Uses a `span` instead of `h1` for better semantic flexibility across the app.
 * @param {DivProps} props - Standard props for the wrapping HTML <div> element.
 */
export const FullLogo = ({ className, ...props }: DivProps) => (
  <div className={cn("flex items-center justify-center gap-2", className)} {...props}>
    <IconLogo className="h-6 w-6" />
    <span className="text-xl font-semibold text-foreground font-headline">libly.space</span>
  </div>
);

// Smaller version of fulllogo
export const FullLogoSm = ({ className, ...props }: DivProps) => (
  <div className={cn("flex items-center justify-center gap-2", className)} {...props}>
    <IconLogo className="h-5 w-5" />
    <span className="text-sm font-semibold text-foreground font-headline">libly.space</span>
  </div>
);


/**
 * Text-only minimalist logo (for clean UIs, navbars, or splash screens)
 */
export const LogoMinimal = ({ className, ...props }: DivProps) => (
  <div className={cn("text-2xl font-semibold text-foreground font-headline", className)} {...props}>
    libly<span className="text-muted-foreground">.space</span>
  </div>
);

/**
 * Gradient text logo (brand-colored headline)
 */
export const LogoGradient = ({ className, ...props }: DivProps) => (
  <div
    className={cn(
      "flex items-center justify-center gap-2 font-headline",
      className
    )}
    {...props}
  >
    <IconLogo className="h-8 w-8" />
    <span className="text-2xl font-bold bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
      libly.space
    </span>
  </div>
);

// The default export is the `FullLogo` for convenience.
export default FullLogo;
