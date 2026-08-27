/**
 * The chrome every onboarding step shares: a card with a title, a description,
 * the step's form, and a Back / Skip / Next footer.
 *
 * All four steps are the same shape — add something, see what you have added,
 * move on — so only the middle differs. Keeping the shell here means a change
 * to the footer or the "Created (n)" block lands once instead of four times.
 */
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ColorDot } from '@/components/ui/color-dot';
import { ArrowLeft, ArrowRight, CheckCircle2, SkipForward } from 'lucide-react';
import type { ReactNode } from 'react';

type OnboardingStepProps = {
  title: string;
  description: ReactNode;
  /** The step's form and its created-items list. */
  children: ReactNode;
  /** Omitted on the first step, which has nothing to go back to. */
  onBack?: (() => void) | undefined;
  /** Only the optional steps offer this. */
  onSkip?: (() => void) | undefined;
  onNext: () => void;
  nextLabel?: string;
  /** Set on the last step: a leading check replaces the trailing arrow. */
  isFinal?: boolean;
  /** The required steps hold the user until they have created something. */
  nextDisabled?: boolean;
};

export function OnboardingStep({
  title,
  description,
  children,
  onBack,
  onSkip,
  onNext,
  nextLabel = 'Next',
  isFinal = false,
  nextDisabled = false,
}: OnboardingStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">{children}</CardContent>

      <CardFooter
        className={onBack ? 'flex justify-between' : 'flex justify-end'}
      >
        {onBack ? (
          <Button variant="outline" onPress={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        ) : null}
        <div className="flex gap-2">
          {onSkip ? (
            <Button variant="ghost" onPress={onSkip}>
              <SkipForward className="mr-1 h-4 w-4" />
              Skip
            </Button>
          ) : null}
          <Button onPress={onNext} disabled={nextDisabled}>
            {isFinal ? <CheckCircle2 className="mr-1 h-4 w-4" /> : null}
            {nextLabel}
            {isFinal ? null : <ArrowRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

type CreatedListProps = {
  count: number;
  /** `rows` for a bordered list, `chips` for the wrapping pill layout. */
  layout?: 'rows' | 'chips';
  children: ReactNode;
};

/** The "Created (n)" block under each step's form. Renders nothing at zero. */
export function CreatedList({
  count,
  layout = 'rows',
  children,
}: CreatedListProps) {
  if (count === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Created ({count})
      </p>
      <div
        className={
          layout === 'chips'
            ? 'flex flex-wrap gap-2'
            : 'divide-y rounded-md border'
        }
      >
        {children}
      </div>
    </div>
  );
}

type CreatedRowProps = {
  activityType?: { name: string; color: string } | null;
  title: string;
  /** Sits next to the title — days of the week, a list name, and so on. */
  detail?: ReactNode;
  /** Right-aligned: a time range, a frequency, a priority. */
  meta?: ReactNode;
};

/** One row inside a `layout="rows"` `CreatedList`. */
export function CreatedRow({
  activityType,
  title,
  detail,
  meta,
}: CreatedRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm">
      {activityType ? (
        <ColorDot
          color={activityType.color}
          size="sm"
          title={activityType.name}
        />
      ) : null}
      <span className="font-medium">{title}</span>
      {detail ? <span className="text-muted-foreground">{detail}</span> : null}
      {meta ? (
        <span className="ml-auto text-muted-foreground">{meta}</span>
      ) : null}
    </div>
  );
}
