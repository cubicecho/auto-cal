/**
 * One card for both platforms — see `ui/button.tsx` for the conversion rules.
 *
 * `CardTitle` and `CardDescription` are `<Text>`, which is not optional on
 * native: a bare string inside a `<View>` throws there while rendering fine on
 * web, so the two platforms disagree silently unless the text nodes are typed.
 */
import { ColorBar } from '@/components/ui/color-bar';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

// `className` is re-declared rather than inherited: nativewind types it as
// `className?: string`, which under `exactOptionalPropertyTypes` rejects the
// conditional `cond ? 'x' : undefined` several call sites pass.
type ViewProps = Omit<React.ComponentProps<typeof View>, 'className'> & {
  className?: string | undefined;
};
type TextProps = Omit<React.ComponentProps<typeof Text>, 'className'> & {
  className?: string | undefined;
};

type CardProps = ViewProps & {
  /** Renders a left-edge ColorBar along with the positioning it requires. */
  accentColor?: string | null | undefined;
  /** Hover/accessible label for the accent bar (e.g. the activity type name). */
  accentLabel?: string | undefined;
  /**
   * Makes the whole card a target. A card that takes this renders a
   * `Pressable` instead of a `View` — a `View` has no press handling on
   * native, and an `onClick` on a plain `div` is not reachable by keyboard.
   */
  onPress?: React.ComponentProps<typeof Pressable>['onPress'] | undefined;
};

const Card = React.forwardRef<React.ElementRef<typeof View>, CardProps>(
  (
    { className, accentColor, accentLabel, onPress, children, ...props },
    ref,
  ) => {
    const Container = onPress ? Pressable : View;
    return (
      <Container
        ref={ref}
        {...(onPress ? ({ onPress, role: 'button' } as const) : {})}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          accentColor && 'relative overflow-hidden',
          className,
        )}
        {...props}
      >
        <ColorBar color={accentColor} label={accentLabel} />
        {children}
      </Container>
    );
  },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight text-card-foreground',
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  React.ElementRef<typeof Text>,
  TextProps
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex flex-row items-center p-6 pt-0', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
