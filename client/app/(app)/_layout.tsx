import { Moon, Settings, Sun } from '@/components/ui/icons';
import { RouteError } from '@/components/ui/route-error';
import { segmentedItemClass } from '@/components/ui/segmented';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useLiveUpdates } from '@/hooks/useLiveUpdates';
import { cn } from '@/lib/utils';
import { storage } from '@/storage';
import type { ErrorBoundaryProps } from 'expo-router';
import {
  Link,
  Redirect,
  Slot,
  Tabs,
  usePathname,
  useRouter,
} from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

/**
 * Catches a crash inside any signed-in screen before it reaches the root
 * boundary, so a bad render loses this segment rather than the whole app.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <RouteError error={error} reset={retry} />;
}

const NAV_LINKS = [
  { href: '/today', label: 'Today' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/todo-lists', label: 'Todos' },
  { href: '/projects', label: 'Projects' },
  { href: '/habits', label: 'Habits' },
  { href: '/time-blocks', label: 'Time Blocks' },
  { href: '/activity-types', label: 'Activity Types' },
  { href: '/stats', label: 'Stats' },
] as const;

function WebLayout() {
  const [dark, setDark] = useDarkMode();
  const pathname = usePathname();
  const router = useRouter();
  const isOnboarding = pathname.startsWith('/onboarding');

  function handleLogout() {
    storage.removeItem('auth_token');
    router.replace('/auth/login');
  }

  return (
    <TooltipProvider>
      <View className="h-screen flex-col overflow-hidden bg-background text-foreground">
        {!isOnboarding && (
          <View className="flex-shrink-0 border-b bg-card text-card-foreground">
            <View className="container mx-auto px-4 py-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-2xl font-bold leading-none">
                    Auto Cal
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Smart todo and habit scheduling
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  {NAV_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={segmentedItemClass(pathname.startsWith(href))}
                    >
                      {label}
                    </Link>
                  ))}
                  <Pressable
                    onPress={() => setDark(!dark)}
                    // biome-ignore lint/a11y/useSemanticElements: a Pressable is a <div> without it
                    role="button"
                    aria-label={
                      dark ? 'Switch to light mode' : 'Switch to dark mode'
                    }
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {dark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Pressable>
                  <Link
                    href="/settings"
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      pathname === '/settings'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    aria-label="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                  <Pressable
                    onPress={handleLogout}
                    // biome-ignore lint/a11y/useSemanticElements: a Pressable is a <div> without it
                    role="button"
                    className="rounded-md px-3 py-1.5 transition-colors hover:bg-muted"
                  >
                    <Text className="text-sm font-medium text-muted-foreground">
                      Sign out
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
        <View className="min-h-0 flex-1 flex-col overflow-hidden">
          <Slot />
        </View>
      </View>
    </TooltipProvider>
  );
}

function NativeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="today" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="stats" options={{ href: null }} />
      <Tabs.Screen name="import-todos" options={{ href: null }} />
      <Tabs.Screen name="todo-lists" options={{ title: 'Todos' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="time-blocks" options={{ title: 'Time Blocks' }} />
      <Tabs.Screen
        name="activity-types"
        options={{ title: 'Activity Types' }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

export default function AppLayout() {
  const pathname = usePathname();
  // One subscriber for the whole app; pages read the cache it keeps current.
  useLiveUpdates();
  const onboardingDone = storage.getItem('onboarding_done');

  if (!onboardingDone && !pathname.startsWith('/onboarding')) {
    return <Redirect href="/onboarding" />;
  }

  if (Platform.OS === 'web') return <WebLayout />;
  return <NativeLayout />;
}
