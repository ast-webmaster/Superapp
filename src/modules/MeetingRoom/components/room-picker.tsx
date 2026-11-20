import { ChipGroup, SegmentedControl, type SegmentedControlProps } from '@/shared/ui';

import type { MeetingRoom } from '../types';

export interface RoomPickerProps {
  rooms: readonly Pick<MeetingRoom, 'uuid' | 'name'>[];
  /** The chosen room's uuid, or empty while none is chosen. */
  value: string;
  onChange: (uuid: string) => void;
}

/** The rooms as a segmented control. The server owns the list, so one room or more than four fall back to chips. */
export function RoomPicker({ rooms, value, onChange }: RoomPickerProps) {
  const options = rooms.map((room) => ({ value: room.uuid, label: room.name }));

  if (options.length < 2 || options.length > 4) {
    return <ChipGroup label="Room" options={options} value={value} onChange={onChange} />;
  }

  return (
    <SegmentedControl
      label="Room"
      fullWidth
      className="border border-border"
      options={options as unknown as SegmentedControlProps['options']}
      value={value}
      onChange={onChange}
    />
  );
}
