/**
 * One button for both platforms.
 *
 * Built on `Pressable` rather than `<button>`: nativewind emits real CSS for
 * `className` on web, so the same file styles a DOM node there and a native
 * view on device. Three things had to change to make that work, and they are
 * the shape every converted primitive will take:
 *
 * - `onClick` → `onPress`.
 * - Text colour cannot be inherited on native, so the variants split into
 *   container classes and text classes. Bare string children are wrapped in a
 *   `<Text>` automatically; elements (icons) pass through untouched, and the
 *   container keeps its `text-*` class so web icons still inherit `currentColor`.
 * - `asChild` is gone. Its two call sites were `<Button asChild><Link/></Button>`;
 *   expo-router's `Link` has its own `asChild`, so they invert to
 *   `<Link asChild><Button/></Link>` and work on both platforms.
 *
 * `type="submit"` is gone too — a Pressable is not a form control. `SubmitButton`
 * in `ui/form.tsx` calls `form.handleSubmit()` on press instead; the `<form>`
 * element is still there on web, so Enter-to-submit is unaffected.
 */
import { IconClassContext } from '@/components/ui/icons-base';
import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, Text } from 'react-native';

const buttonVariants = cva(
  'inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/** The half of each variant that has to live on the `<Text>` for native. */
const buttonTextVariants = cva('text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-muted-foreground',
      link: 'text-primary underline',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type ButtonProps = Omit<
  React.ComponentProps<typeof Pressable>,
  'children' | 'style'
> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    children?: React.ReactNode;
  };

const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(({ className, variant, size, disabled, children, ...props }, ref) => (
  <Pressable
    ref={ref}
    // A `Pressable` is a plain `<div>` on web unless it is given a role. This
    // is what gets the tab stop, the Enter/Space activation and the screen
    // reader announcement back that the `<button>` element gave for free.
    // biome-ignore lint/a11y/useSemanticElements: this is not a DOM element — a `<button>` has no native counterpart
    role="button"
    disabled={disabled}
    className={cn(
      buttonVariants({ variant, size, className }),
      // `disabled:` has no pseudo-class to hang off a Pressable on either
      // platform, so the disabled look is applied directly.
      disabled && 'opacity-50',
    )}
    {...props}
  >
    {/* Icons inside a button take the variant's text colour. On web they
        already inherit it, so `icons.web.tsx` ignores this; native has no
        inheritance and this is where the colour comes from. */}
    <IconClassContext.Provider value={buttonTextVariants({ variant })}>
      {React.Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <Text className={buttonTextVariants({ variant })}>{child}</Text>
        ) : (
          child
        ),
      )}
    </IconClassContext.Provider>
  </Pressable>
));
Button.displayName = 'Button';

export { Button, buttonVariants, buttonTextVariants };
