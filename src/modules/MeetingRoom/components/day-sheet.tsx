import { DateRangePicker, Sheet } from '@/shared/ui';

export interface DaySheetProps {
  visible: boolean;
  title: string;
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

/** One day, chosen on a month calendar. The first tap picks it and closes the sheet. */
export function DaySheet({ visible, title, value, onChange, onClose }: DaySheetProps) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <DateRangePicker
        value={{ from: value, to: value }}
        initialMonth={value}
        onChange={({ from }) => {
          if (from === null) return;
          onChange(from);
          onClose();
        }}
      />
    </Sheet>
  );
}
