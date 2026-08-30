/**
 * The native tooltip: long-press the trigger and the bubble appears above it
 * until the next press or a few seconds pass.
 *
 * Hover does not exist on a touch screen, so radix's trigger has no direct
 * equivalent — but dropping the content entirely would lose the only place
 * some labels are written down. Long-press is the platform's own convention
 * for "tell me more about this control", and it costs no dependency.
 *
 * `Tooltip` wraps its children in a relatively-positioned `View` so the bubble
 * can be absolutely placed against the trigger; on web radix's root is a
 * fragment and the wrapper is not there.
 */
import {
  TOOLTIP_CONTENT_CLASS,
  TOOLTIP_TEXT_CLASS,
  type TooltipContentProps,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
} from '@/components/ui/tooltip-base';
import { cn } from '@/lib/utils';
import {
  type ReactElement,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';

type TooltipState = { open: boolean; setOpen: (open: boolean) => void };

const TooltipContext = createContext<TooltipState>({
  open: false,
  setOpen: () => {},
});

/** Nothing to provide on native; kept so call sites need not branch. */
function TooltipProvider({ children }: TooltipProviderProps) {
  return children;
}

function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <View className="relative">{children}</View>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({ asChild, children }: TooltipTriggerProps) {
  const { setOpen } = useContext(TooltipContext);
  const show = () => setOpen(true);
  if (asChild && isValidElement(children)) {
    return cloneElement(
      children as ReactElement<{ onLongPress?: () => void }>,
      {
        onLongPress: show,
      },
    );
  }
  return <Pressable onLongPress={show}>{children}</Pressable>;
}

/** How long the bubble stays up before dismissing itself. */
const VISIBLE_MS = 2500;

function TooltipContent({ className, children }: TooltipContentProps) {
  const { open, setOpen } = useContext(TooltipContext);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <View
      className={cn(
        'absolute bottom-full z-50 mb-1 self-center',
        TOOLTIP_CONTENT_CLASS,
        className,
      )}
      pointerEvents="none"
    >
      <Text className={TOOLTIP_TEXT_CLASS}>{children}</Text>
    </View>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
