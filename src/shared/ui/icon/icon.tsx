import AlertTriangle from 'lucide-react-native/icons/triangle-alert';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import BarChart3 from 'lucide-react-native/icons/chart-column';
import Bell from 'lucide-react-native/icons/bell';
import Bookmark from 'lucide-react-native/icons/bookmark';
import Box from 'lucide-react-native/icons/box';
import Building2 from 'lucide-react-native/icons/building-2';
import Calendar from 'lucide-react-native/icons/calendar';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ClipboardCheck from 'lucide-react-native/icons/clipboard-check';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import FileText from 'lucide-react-native/icons/file-text';
import Heart from 'lucide-react-native/icons/heart';
import House from 'lucide-react-native/icons/house';
import Info from 'lucide-react-native/icons/info';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import List from 'lucide-react-native/icons/list';
import Lock from 'lucide-react-native/icons/lock';
import Map from 'lucide-react-native/icons/map';
import MessageSquare from 'lucide-react-native/icons/message-square';
import Minus from 'lucide-react-native/icons/minus';
import Pin from 'lucide-react-native/icons/pin';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import Share from 'lucide-react-native/icons/share';
import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Star from 'lucide-react-native/icons/star';
import Truck from 'lucide-react-native/icons/truck';
import User from 'lucide-react-native/icons/user';
import Users from 'lucide-react-native/icons/users';
import Wallet from 'lucide-react-native/icons/wallet';
import X from 'lucide-react-native/icons/x';
import { View } from 'react-native';

import { colors, type ColorToken } from '@/shared/theme/tokens';

const icons = {
  home: House,
  grid: LayoutGrid,
  search: Search,
  bell: Bell,
  user: User,
  calendar: Calendar,
  settings: Settings,
  building: Building2,
  box: Box,
  wallet: Wallet,
  users: Users,
  chart: BarChart3,
  truck: Truck,
  clipboard: ClipboardCheck,
  doc: FileText,
  chat: MessageSquare,
  heart: Heart,
  bookmark: Bookmark,
  share: Share,
  pin: Pin,
  lock: Lock,
  eye: Eye,
  'eye-off': EyeOff,
  sliders: SlidersHorizontal,
  list: List,
  map: Map,
  cart: ShoppingCart,
  star: Star,
  plus: Plus,
  minus: Minus,
  check: Check,
  x: X,
  alert: AlertTriangle,
  info: Info,
  'arrow-right': ArrowRight,
  'chevron-right': ChevronRight,
} as const;

export type IconName = keyof typeof icons;

export const iconNames = Object.keys(icons) as IconName[];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorToken;
  /** Fills the shape, for a selected heart or a pinned star. */
  filled?: boolean;
  /** Only for an icon that stands alone. Without it, screen readers skip the icon. */
  label?: string;
  className?: string;
}

export function Icon({
  name,
  size = 24,
  color = 'ink',
  filled = false,
  label,
  className,
}: IconProps) {
  const Glyph = icons[name];
  const value = colors[color];

  return (
    <View
      className={className}
      {...(label
        ? { accessible: true, role: 'img' as const, 'aria-label': label }
        : { 'aria-hidden': true })}>
      <Glyph size={size} color={value} strokeWidth={1.75} fill={filled ? value : 'none'} />
    </View>
  );
}
