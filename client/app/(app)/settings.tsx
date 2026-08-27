import { ApiKeyManager } from '@/components/domain/settings/ApiKeyManager';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Page, PageHeader } from '@/components/ui/page';
import { storage } from '@/storage';
import { Link, useRouter } from 'expo-router';
import { Upload, Wand2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  function handleRunWizard() {
    storage.removeItem('onboarding_done');
    router.push('/onboarding?step=1&force=true');
  }

  return (
    <Page width="narrow" className="space-y-4 py-8">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader>
          <CardTitle>Setup wizard</CardTitle>
          <CardDescription>
            Re-run the onboarding wizard to add activity types, time blocks,
            habits, or todos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onPress={handleRunWizard}>
            <Wand2 className="mr-2 h-4 w-4" />
            Run setup wizard
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import todos</CardTitle>
          <CardDescription>
            Bring your tasks over from Google Tasks. Upload a Tasks.json export
            and map each list to an activity type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/import-todos" asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Import from Google Tasks
            </Button>
          </Link>
        </CardContent>
      </Card>

      <ApiKeyManager />
    </Page>
  );
}
