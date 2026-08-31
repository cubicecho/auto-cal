import { graphql } from '@/__generated__/index.js';
import { StepActivityTypes } from '@/components/domain/onboarding/StepActivityTypes';
import { StepHabits } from '@/components/domain/onboarding/StepHabits';
import { StepTimeBlocks } from '@/components/domain/onboarding/StepTimeBlocks';
import { StepTodos } from '@/components/domain/onboarding/StepTodos';
import { Button } from '@/components/ui/button';
import { Check, X } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { storage } from '@/storage';
import { useQuery } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

const CHECK_ONBOARDED = graphql(`
  query CheckOnboarded {
    myActivityTypes {
      id
    }
  }
`);

const STEPS = [
  { label: 'Activity Types' },
  { label: 'Time Blocks' },
  { label: 'Habits' },
  { label: 'Todos' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string; force?: string }>();
  const step = Math.max(1, Math.min(4, Number(params.step ?? 1)));
  const force = params.force === 'true';
  const checked = useRef(false);

  const { data, loading } = useQuery(CHECK_ONBOARDED, {
    skip: step > 1 || force,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (checked.current || loading || step > 1 || force) return;
    if (data && data.myActivityTypes.length > 0) {
      checked.current = true;
      storage.setItem('onboarding_done', '1');
      router.replace('/today');
    }
  }, [data, loading, step, force, router]);

  function goToStep(s: number) {
    router.push({ pathname: '/onboarding', params: { step: String(s) } });
  }

  function handleFinish() {
    storage.setItem('onboarding_done', '1');
    router.replace('/today');
  }

  function handleSkipAll() {
    storage.setItem('onboarding_done', '1');
    router.replace('/today');
  }

  if (step === 1 && loading) {
    return (
      <View className="flex-row flex-1 items-center justify-center">
        <Text className="text-muted-foreground text-sm">Checking setup…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="items-center py-8 px-4"
    >
      <View className="w-full max-w-2xl gap-6">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-2xl font-bold">Welcome to Auto Cal</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Let's get your schedule set up — takes about 2 minutes.
            </Text>
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleSkipAll}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Skip setup
          </Button>
        </View>

        <View className="flex-row items-center">
          {STEPS.map((s, i) => (
            <View key={s.label} className="flex-row flex-1 items-center">
              <View className="flex-row items-center gap-2">
                <View
                  className={cn(
                    'h-7 w-7 shrink-0 flex-row items-center justify-center rounded-full',
                    i + 1 === step
                      ? 'bg-primary'
                      : i + 1 < step
                        ? 'bg-primary/15'
                        : 'bg-muted',
                  )}
                >
                  {i + 1 < step ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        i + 1 === step
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  className={cn(
                    'hidden text-sm sm:block',
                    i + 1 === step
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  className={cn(
                    'mx-3 h-px flex-1',
                    i + 1 < step ? 'bg-primary/40' : 'bg-muted',
                  )}
                />
              )}
            </View>
          ))}
        </View>

        {step === 1 && <StepActivityTypes onNext={() => goToStep(2)} />}
        {step === 2 && (
          <StepTimeBlocks
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        )}
        {step === 3 && (
          <StepHabits
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
            onSkip={() => goToStep(4)}
          />
        )}
        {step === 4 && (
          <StepTodos
            onBack={() => goToStep(3)}
            onFinish={handleFinish}
            onSkip={handleFinish}
          />
        )}

        <Text className="text-center text-xs text-muted-foreground">
          Step {step} of {STEPS.length}
          {step > 2 && ' · optional from here'}
        </Text>
      </View>
    </ScrollView>
  );
}
