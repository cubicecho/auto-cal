import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { storage } from '@/storage';
import {
  Link,
  Redirect,
  Slot,
  Tabs,
  usePathname,
  useRouter,
} from 'expo-router';
import { Moon, Settings, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const NAV_LINKS = [
  { href: '/today', label: 'Today' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/todo-lists', label: 'Todos' },
  { href: '/habits', label: 'Habits' },
  { href: '/time-blocks', label: 'Time Blocks' },
  { href: '/activity-types', label: 'Activity Types' },
  { href: '/stats', label: 'Stats' },
] as const;

function getInitialDark(): boolean {
  if (Platform.OS !== 'web') return false;
  const stored = storage.getItem('theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function useDarkMode() {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.classList.toggle('dark', dark);
    storage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark] as const;
}

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
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        {!isOnboarding && (
          <header className="flex-shrink-0 border-b bg-card text-card-foreground">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold leading-none">Auto Cal</h1>
                  <p className="text-xs text-muted-foreground">
                    Smart todo and habit scheduling
                  </p>
                </div>
                <nav className="flex items-center gap-1">
                  {NAV_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        pathname.startsWith(href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDark((d) => !d)}
                    aria-label={
                      dark ? 'Switch to light mode' : 'Switch to dark mode'
                    }
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {dark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </button>
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
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Sign out
                  </button>
                </nav>
              </div>
            </div>
          </header>
        )}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Slot />
        </main>
      </div>
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
      <Tabs.Screen name="todo-lists" options={{ title: 'Todos' }} />
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
  const onboardingDone = storage.getItem('onboarding_done');

  if (!onboardingDone && !pathname.startsWith('/onboarding')) {
    return <Redirect href="/onboarding" />;
  }

  if (Platform.OS === 'web') return <WebLayout />;
  return <NativeLayout />;
}
