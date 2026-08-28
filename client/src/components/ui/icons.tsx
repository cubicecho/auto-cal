/**
 * The icon set, native implementation. `icons.web.tsx` is its web counterpart
 * and `icons-base.ts` holds what they share.
 *
 * Every icon is imported from `lucide-react-native/icons/<name>` rather than
 * the package barrel: the barrel re-exports 1600-odd separate modules and
 * Metro does not tree-shake, so a barrel import pulls the entire set into the
 * bundle.
 *
 * Two things happen to each icon on the way out:
 *
 * - `cssInterop` teaches it `className`. `h-4 w-4` and `text-*` are lifted out
 *   of the resolved style and handed to the icon as `width` / `height` /
 *   `color` props, which is what lucide reads; everything else (margins,
 *   opacity) stays on `style`, which `Svg` accepts.
 * - The colour is resolved eagerly, because there is no `currentColor` to
 *   inherit off device. `text-foreground` is the floor, `IconClassContext`
 *   overrides it for containers that set their own colour, and the call
 *   site's own `text-*` overrides both.
 *
 * Names are lucide's canonical ones. Several of the icons this app uses are
 * reachable under legacy aliases too (`AlertCircle`, `CheckCircle2`,
 * `Loader2`, `Wand2`) — those are deprecated upstream, so importing through
 * this module is also what keeps the next lucide bump from being a rename
 * sweep across 37 files.
 */
import { IconClassContext } from '@/components/ui/icons-base';
import { cn } from '@/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import ArchiveSource from 'lucide-react-native/icons/archive';
import ArrowLeftSource from 'lucide-react-native/icons/arrow-left';
import ArrowRightSource from 'lucide-react-native/icons/arrow-right';
import CalendarSource from 'lucide-react-native/icons/calendar';
import CheckSource from 'lucide-react-native/icons/check';
import ChevronDownSource from 'lucide-react-native/icons/chevron-down';
import ChevronLeftSource from 'lucide-react-native/icons/chevron-left';
import ChevronRightSource from 'lucide-react-native/icons/chevron-right';
import ChevronUpSource from 'lucide-react-native/icons/chevron-up';
import CircleAlertSource from 'lucide-react-native/icons/circle-alert';
import CircleCheckSource from 'lucide-react-native/icons/circle-check';
import ClockSource from 'lucide-react-native/icons/clock';
import CopySource from 'lucide-react-native/icons/copy';
import DownloadSource from 'lucide-react-native/icons/download';
import FolderKanbanSource from 'lucide-react-native/icons/folder-kanban';
import KeySource from 'lucide-react-native/icons/key';
import ListChecksSource from 'lucide-react-native/icons/list-checks';
import ListTodoSource from 'lucide-react-native/icons/list-todo';
import ListXSource from 'lucide-react-native/icons/list-x';
import LoaderCircleSource from 'lucide-react-native/icons/loader-circle';
import MoonSource from 'lucide-react-native/icons/moon';
import PencilSource from 'lucide-react-native/icons/pencil';
import PinSource from 'lucide-react-native/icons/pin';
import PlusSource from 'lucide-react-native/icons/plus';
import RefreshCwSource from 'lucide-react-native/icons/refresh-cw';
import SettingsSource from 'lucide-react-native/icons/settings';
import SkipForwardSource from 'lucide-react-native/icons/skip-forward';
import SunSource from 'lucide-react-native/icons/sun';
import TagSource from 'lucide-react-native/icons/tag';
import Trash2Source from 'lucide-react-native/icons/trash-2';
import TriangleAlertSource from 'lucide-react-native/icons/triangle-alert';
import Undo2Source from 'lucide-react-native/icons/undo-2';
import UploadSource from 'lucide-react-native/icons/upload';
import WandSparklesSource from 'lucide-react-native/icons/wand-sparkles';
import XSource from 'lucide-react-native/icons/x';
import { cssInterop } from 'nativewind';
import { useContext } from 'react';

type IconProps = Omit<LucideProps, 'className'> & {
  className?: string | undefined;
};

function icon(Source: LucideIcon) {
  const Styled = cssInterop(Source, {
    className: {
      target: 'style',
      nativeStyleToProp: { width: true, height: true, color: true },
    },
  });

  return function Icon({ className, ...props }: IconProps) {
    const inherited = useContext(IconClassContext);
    return (
      <Styled
        className={cn('text-foreground', inherited, className)}
        {...props}
      />
    );
  };
}

export const Archive = icon(ArchiveSource);
export const ArrowLeft = icon(ArrowLeftSource);
export const ArrowRight = icon(ArrowRightSource);
export const Calendar = icon(CalendarSource);
export const Check = icon(CheckSource);
export const ChevronDown = icon(ChevronDownSource);
export const ChevronLeft = icon(ChevronLeftSource);
export const ChevronRight = icon(ChevronRightSource);
export const ChevronUp = icon(ChevronUpSource);
export const CircleAlert = icon(CircleAlertSource);
export const CircleCheck = icon(CircleCheckSource);
export const Clock = icon(ClockSource);
export const Copy = icon(CopySource);
export const Download = icon(DownloadSource);
export const FolderKanban = icon(FolderKanbanSource);
export const Key = icon(KeySource);
export const ListChecks = icon(ListChecksSource);
export const ListTodo = icon(ListTodoSource);
export const ListX = icon(ListXSource);
export const LoaderCircle = icon(LoaderCircleSource);
export const Moon = icon(MoonSource);
export const Pencil = icon(PencilSource);
export const Pin = icon(PinSource);
export const Plus = icon(PlusSource);
export const RefreshCw = icon(RefreshCwSource);
export const Settings = icon(SettingsSource);
export const SkipForward = icon(SkipForwardSource);
export const Sun = icon(SunSource);
export const Tag = icon(TagSource);
export const Trash2 = icon(Trash2Source);
export const TriangleAlert = icon(TriangleAlertSource);
export const Undo2 = icon(Undo2Source);
export const Upload = icon(UploadSource);
export const WandSparkles = icon(WandSparklesSource);
export const X = icon(XSource);
