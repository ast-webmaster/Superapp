import AiMagic from '@hugeicons/core-free-icons/SparklesIcon';
import Add from '@hugeicons/core-free-icons/Add01Icon';
import Refresh from '@hugeicons/core-free-icons/RefreshIcon';
import Alert from '@hugeicons/core-free-icons/Alert02Icon';
import ArrowDown from '@hugeicons/core-free-icons/ArrowDown02Icon';
import ArrowLeft from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import ArrowRight from '@hugeicons/core-free-icons/ArrowRight02Icon';
import ArrowRightSmall from '@hugeicons/core-free-icons/ArrowRight01Icon';
import ArrowUp from '@hugeicons/core-free-icons/ArrowUp02Icon';
import Bell from '@hugeicons/core-free-icons/Notification01Icon';
import Bookmark from '@hugeicons/core-free-icons/Bookmark01Icon';
import Building from '@hugeicons/core-free-icons/Building03Icon';
import Calendar from '@hugeicons/core-free-icons/Calendar03Icon';
import Cart from '@hugeicons/core-free-icons/ShoppingCart01Icon';
import Chart from '@hugeicons/core-free-icons/ChartColumnIcon';
import Chat from '@hugeicons/core-free-icons/Message01Icon';
import Check from '@hugeicons/core-free-icons/Tick02Icon';
import Clipboard from '@hugeicons/core-free-icons/TaskDone01Icon';
import Close from '@hugeicons/core-free-icons/Cancel01Icon';
import Copy from '@hugeicons/core-free-icons/Copy01Icon';
import Doc from '@hugeicons/core-free-icons/File01Icon';
import Download from '@hugeicons/core-free-icons/Download01Icon';
import Eye from '@hugeicons/core-free-icons/ViewIcon';
import EyeOff from '@hugeicons/core-free-icons/ViewOffIcon';
import Grid from '@hugeicons/core-free-icons/GridViewIcon';
import Heart from '@hugeicons/core-free-icons/FavouriteIcon';
import History from '@hugeicons/core-free-icons/Clock01Icon';
import Home from '@hugeicons/core-free-icons/Home01Icon';
import Info from '@hugeicons/core-free-icons/InformationCircleIcon';
import List from '@hugeicons/core-free-icons/ListViewIcon';
import Lock from '@hugeicons/core-free-icons/LockIcon';
import LogOut from '@hugeicons/core-free-icons/Logout01Icon';
import Map from '@hugeicons/core-free-icons/Location01Icon';
import Mic from '@hugeicons/core-free-icons/Mic01Icon';
import Minus from '@hugeicons/core-free-icons/MinusSignIcon';
import More from '@hugeicons/core-free-icons/MoreHorizontalIcon';
import Package from '@hugeicons/core-free-icons/PackageIcon';
import Pencil from '@hugeicons/core-free-icons/PencilEdit01Icon';
import Pin from '@hugeicons/core-free-icons/PinIcon';
import Search from '@hugeicons/core-free-icons/Search01Icon';
import Send from '@hugeicons/core-free-icons/SentIcon';
import Settings from '@hugeicons/core-free-icons/Settings02Icon';
import Share from '@hugeicons/core-free-icons/Share01Icon';
import Sliders from '@hugeicons/core-free-icons/SlidersHorizontalIcon';
import Star from '@hugeicons/core-free-icons/StarIcon';
import Truck from '@hugeicons/core-free-icons/TruckIcon';
import Upload from '@hugeicons/core-free-icons/Upload01Icon';
import User from '@hugeicons/core-free-icons/UserIcon';
import Users from '@hugeicons/core-free-icons/UserGroupIcon';
import Wallet from '@hugeicons/core-free-icons/Wallet01Icon';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import { View } from 'react-native';

import { colors, type ColorToken } from '@/shared/theme/tokens';

const icons = {
  home: Home,
  grid: Grid,
  search: Search,
  bell: Bell,
  user: User,
  calendar: Calendar,
  settings: Settings,
  building: Building,
  box: Package,
  wallet: Wallet,
  users: Users,
  chart: Chart,
  truck: Truck,
  clipboard: Clipboard,
  doc: Doc,
  chat: Chat,
  ai: AiMagic,
  heart: Heart,
  bookmark: Bookmark,
  share: Share,
  pin: Pin,
  lock: Lock,
  'log-out': LogOut,
  pencil: Pencil,
  eye: Eye,
  'eye-off': EyeOff,
  sliders: Sliders,
  list: List,
  history: History,
  mic: Mic,
  map: Map,
  cart: Cart,
  star: Star,
  plus: Add,
  more: More,
  copy: Copy,
  download: Download,
  upload: Upload,
  minus: Minus,
  check: Check,
  x: Close,
  alert: Alert,
  info: Info,
  send: Send,
  refresh: Refresh,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'chevron-left': ArrowLeft,
  'chevron-right': ArrowRightSmall,
} as const satisfies Record<string, IconSvgElement>;

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

/** The free Hugeicons set is outline only, so a filled icon paints the same paths solid. */
function fillShapes(shapes: IconSvgElement, fill: string): IconSvgElement {
  return shapes.map(([tag, attrs]) => [tag, { ...attrs, fill }] as const);
}

export function Icon({
  name,
  size = 24,
  color = 'ink',
  filled = false,
  label,
  className,
}: IconProps) {
  const value = colors[color];
  const shapes: IconSvgElement = filled ? fillShapes(icons[name], value) : icons[name];

  return (
    <View
      className={className}
      {...(label
        ? { accessible: true, role: 'img' as const, 'aria-label': label }
        : { 'aria-hidden': true })}>
      <HugeiconsIcon icon={shapes} size={size} color={value} strokeWidth={1.75} />
    </View>
  );
}
