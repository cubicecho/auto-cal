import { storage } from '@/storage';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();

  function handleRunWizard() {
    storage.removeItem('onboarding_done');
    router.push('/onboarding?step=1&force=true');
  }

  function handleLogout() {
    Alert.alert('Sign out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          storage.removeItem('auth_token');
          router.replace('/auth/login');
        },
      },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 gap-3"
    >
      <Text className="text-2xl font-bold text-foreground mb-2">Settings</Text>

      <View className="rounded-xl border border-border bg-card overflow-hidden">
        <View className="px-4 py-3 border-b border-border">
          <Text className="font-semibold text-foreground">Setup wizard</Text>
          <Text className="text-sm text-muted-foreground mt-0.5">
            Re-run the onboarding wizard to add activity types, time blocks,
            habits, or todos.
          </Text>
        </View>
        <TouchableOpacity
          className="px-4 py-3 active:opacity-70"
          onPress={handleRunWizard}
        >
          <Text className="text-primary font-medium">Run setup wizard</Text>
        </TouchableOpacity>
      </View>

      <View className="rounded-xl border border-border bg-card overflow-hidden">
        <TouchableOpacity
          className="px-4 py-3 active:opacity-70"
          onPress={handleLogout}
        >
          <Text className="text-destructive font-medium">Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
