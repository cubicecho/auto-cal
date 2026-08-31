/**
 * The native file picker — which does not exist yet.
 *
 * Reading a file off web needs `expo-document-picker` plus its permission
 * flow; until that lands the screen says so rather than rendering a drop zone
 * that cannot open anything. `onPick` is therefore never called here.
 */
import type { FilePickerProps } from '@/components/ui/file-picker-base';
import { Upload } from '@/components/ui/icons';
import { Text, View } from 'react-native';

export function FilePicker({ label }: FilePickerProps) {
  return (
    <View className="w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-6 py-12">
      <Upload className="h-8 w-8 text-muted-foreground" />
      <Text className="text-center text-sm font-medium text-foreground">
        {label}
      </Text>
      <Text className="text-center text-xs text-muted-foreground">
        Importing a file is only available on the web app for now.
      </Text>
    </View>
  );
}
