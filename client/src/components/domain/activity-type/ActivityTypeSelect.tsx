import { graphql } from '@/__generated__/index.js';
import { ColorDot } from '@/components/ui/color-dot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@apollo/client/react';
import { Link } from 'expo-router';

const GET_ACTIVITY_TYPES = graphql(`
  query GetActivityTypesForSelect {
    myActivityTypes {
      id
      name
      color
    }
  }
`);

interface ActivityTypeSelectProps {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  onBlur?: () => void;
}

export function ActivityTypeSelect({
  value,
  onValueChange,
  onBlur,
}: ActivityTypeSelectProps) {
  const { data } = useQuery(GET_ACTIVITY_TYPES);

  const activityTypes = data?.myActivityTypes ?? [];

  if (activityTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity types yet —{' '}
        <Link href="/activity-types" className="underline">
          create one first
        </Link>
        .
      </p>
    );
  }

  return (
    <Select value={value ?? ''} onValueChange={(v) => onValueChange(v)}>
      <SelectTrigger onBlur={onBlur}>
        <SelectValue placeholder="Select an activity type">
          {value
            ? (() => {
                const at = activityTypes.find((a) => a.id === value);
                return at ? (
                  <span className="flex items-center gap-2">
                    <ColorDot color={at.color} />
                    {at.name}
                  </span>
                ) : (
                  'Select an activity type'
                );
              })()
            : 'Select an activity type'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {activityTypes.map((at) => (
          <SelectItem key={at.id} value={at.id}>
            <span className="flex items-center gap-2">
              <ColorDot color={at.color} />
              {at.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
