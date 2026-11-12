import { clsx } from 'clsx';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';
import {
  Alert,
  AppText,
  Avatar,
  Badge,
  BottomNav,
  Button,
  ChipGroup,
  Icon,
  IconButton,
  InfoCard,
  ListGroup,
  ListRow,
  Logo,
  ModuleCard,
  Skeleton,
  SkeletonGroup,
  SegmentedControl,
  Stepper,
  TextField,
  Toggle,
  useToast,
  type AppTextProps,
  type IconName,
} from '@/shared/ui';

import { BoardCard, BoardRow, TypeRow } from '../components/board-card';
import { navItems } from '../components/sample-data';

const palette = [
  {
    name: 'Primary Indigo',
    value: '#130066',
    use: 'Primary actions, active states',
    swatch: 'bg-primary',
  },
  {
    name: 'Lavender',
    value: '#C9B4FF',
    use: 'Secondary actions, highlights',
    swatch: 'bg-lavender',
  },
  { name: 'Text Primary', value: '#0B0B1A', use: 'Headings, primary text', swatch: 'bg-ink' },
  {
    name: 'Text Secondary',
    value: '#5B6270',
    use: 'Body text, secondary text',
    swatch: 'bg-ink-muted',
  },
  {
    name: 'Surface White',
    value: '#FFFFFF',
    use: 'Cards, sheets, modals',
    swatch: 'bg-surface border border-border',
  },
  {
    name: 'Surface Gray',
    value: '#F4F5F7',
    use: 'App background, input fields',
    swatch: 'bg-surface-gray border border-border',
  },
  { name: 'Border Gray', value: '#E5E7EB', use: 'Dividers, borders', swatch: 'bg-border' },
  {
    name: 'Glass Blur',
    value: 'rgba(255,255,255,0.7)',
    use: 'Tab bar, glass surfaces',
    swatch: 'bg-lavender',
  },
] as const;

const typeScale: readonly {
  role: string;
  spec: string;
  variant: NonNullable<AppTextProps['variant']>;
  sample: string;
  tone?: AppTextProps['tone'];
}[] = [
  { role: 'Display', spec: 'ExtraBold, 40 / 44', variant: 'display', sample: 'Work, anywhere' },
  { role: 'Heading', spec: 'Bold, 28 / 34', variant: 'heading', sample: 'Stock opname review' },
  {
    role: 'Body',
    spec: 'Regular, 16 / 24',
    variant: 'body',
    sample: 'Approve, track and request from any department, anywhere and anytime.',
  },
  {
    role: 'Caption',
    spec: 'Medium, 13 / 20',
    variant: 'caption',
    sample: 'Warehouse, Jakarta DC',
    tone: 'muted',
  },
];

const iconography: readonly IconName[] = [
  'home',
  'grid',
  'bell',
  'calendar',
  'user',
  'settings',
  'building',
  'sliders',
];

/** The reference board, built only from the real components. */
export default function BoardScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { show } = useToast();
  const [favorite, setFavorite] = useState(true);
  const [tab, setTab] = useState<string>('home');
  const [alerts, setAlerts] = useState({ success: true, danger: true });

  return (
    <ScrollView
      className="flex-1 bg-surface-gray"
      contentContainerClassName="w-full max-w-board gap-4 self-center p-4"
      contentContainerStyle={{
        paddingTop: top + sizes.screenTopGap,
        paddingBottom: bottom + sizes.screenTopGap,
      }}>
      <BoardRow>
        <BoardCard number="01" title="Brand" span={4}>
          <Logo width={240} />
          <AppText variant="title" tone="muted">
            One Superapp for every department. Access anywhere, anytime.
          </AppText>
        </BoardCard>
        <BoardCard number="02" title="Color palette" span={8}>
          <View className="flex-row flex-wrap gap-3">
            {palette.map((color) => (
              <View key={color.name} className="w-20 grow gap-1">
                <View className={clsx('h-20 overflow-hidden rounded-lg', color.swatch)}>
                  {color.name === 'Glass Blur' ? <View className="flex-1 bg-glass" /> : null}
                </View>
                <AppText variant="body-strong">{color.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {color.value}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {color.use}
                </AppText>
              </View>
            ))}
          </View>
        </BoardCard>
      </BoardRow>

      <BoardRow>
        <BoardCard number="03" title="Typography" span={5}>
          {typeScale.map((row) => (
            <TypeRow key={row.role} role={row.role} spec={row.spec}>
              <AppText variant={row.variant} tone={row.tone}>
                {row.sample}
              </AppText>
            </TypeRow>
          ))}
          <TypeRow role="Button" spec="SemiBold, 17 / 20">
            <Button>Open workspace</Button>
          </TypeRow>
        </BoardCard>
        <BoardCard number="04" title="Buttons" span={4}>
          <Button block iconRight="arrow-right">
            Open workspace
          </Button>
          <Button block variant="secondary" iconLeft="building">
            Continue with SSO
          </Button>
          <Button block variant="soft">
            View details
          </Button>
          <View className="flex-row flex-wrap gap-3">
            <IconButton icon="heart" label="Save to favorites" />
            <IconButton icon="share" label="Share" />
            <IconButton icon="search" label="Search" />
            <IconButton icon="bookmark" label="Bookmark" active />
          </View>
          <View className="flex-row flex-wrap gap-3">
            <Button loading>Saving</Button>
            <Button disabled>Not yet</Button>
          </View>
        </BoardCard>
        <BoardCard number="05" title="Input fields" span={3}>
          <TextField icon="search" placeholder="Departments" trailing={<Icon name="sliders" />} />
          <TextField icon="user" placeholder="Enter your name" />
          <TextField icon="user" aria-label="Your name" defaultValue="Budi Santoso" />
          <TextField icon="lock" type="password" aria-label="Password" defaultValue="password1" />
          <TextField
            label="Work email"
            icon="user"
            defaultValue="budi@"
            error="Enter a valid email"
          />
        </BoardCard>
      </BoardRow>

      <BoardRow>
        <BoardCard number="06" title="Filter chips" span={3}>
          <ChipGroup
            label="Filter apps"
            defaultValue="all"
            options={[
              { value: 'all', label: 'All apps' },
              { value: 'favorites', label: 'Favorites' },
              { value: 'recent', label: 'Recent' },
            ]}
          />
          <ChipGroup
            label="Switch department"
            defaultValue="all"
            options={[
              { value: 'all', label: 'All', icon: 'home' },
              { value: 'sales', label: 'Sales', icon: 'chart' },
              { value: 'finance', label: 'Finance', icon: 'wallet' },
              { value: 'stock', label: 'Stock', icon: 'box' },
            ]}
          />
        </BoardCard>
        <BoardCard number="07" title="Module card" span={5}>
          <ModuleCard
            title="Stock opname"
            department="Warehouse, Jakarta DC"
            icon="box"
            badges={[
              { label: '12 pending', tone: 'warning' },
              { label: 'Approval', tone: 'info' },
            ]}
            meta="Updated 5m ago"
            favorite={favorite}
            onToggleFavorite={() => setFavorite((current) => !current)}
            onOpen={() => show({ tone: 'success', message: 'Stock opname opened' })}
          />
          <ModuleCard loading />
          <SkeletonGroup
            label="Loading request"
            className="gap-2 rounded-xl bg-surface p-4 border border-border">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </SkeletonGroup>
        </BoardCard>
        <BoardCard number="08" title="Info cards" span={4}>
          <InfoCard
            icon="chat"
            title="Ask the HR helpdesk"
            description="Leave, payslip, policies and more."
            onPress={() => show({ tone: 'info', message: 'HR helpdesk opened' })}
          />
          <InfoCard
            icon="clipboard"
            title="3 approvals waiting"
            description="Review requests from Sales and Finance."
            onPress={() => show({ tone: 'warning', message: 'You have 3 approvals waiting' })}
          />
        </BoardCard>
      </BoardRow>

      <BoardRow>
        <BoardCard number="09" title="Profile row" span={4}>
          <ListGroup>
            <ListRow icon="user" label="Personal info" onPress={() => {}} />
            <ListRow icon="building" label="My departments" onPress={() => {}} />
            <ListRow icon="clipboard" label="Approvals" value="3" onPress={() => {}} />
            <ListRow icon="log-out" label="Sign out" destructive onPress={() => {}} />
          </ListGroup>
        </BoardCard>
        <BoardCard number="10" title="Bottom navigation (black tab bar)" span={4}>
          <View className="rounded-lg bg-lavender p-4">
            <BottomNav items={navItems} activeKey={tab} onChange={setTab} placement="inline" />
          </View>
        </BoardCard>
        <BoardCard number="11" title="Iconography" span={4}>
          <View className="flex-row flex-wrap gap-y-4">
            {iconography.map((name) => (
              <View key={name} className="w-1/4 items-center">
                <View className="size-touch items-center justify-center rounded-pill bg-surface-gray">
                  <Icon name={name} label={name} />
                </View>
              </View>
            ))}
          </View>
        </BoardCard>
      </BoardRow>

      <BoardRow>
        <BoardCard number="12" title="Segmented control" span={3}>
          <SegmentedControl
            label="View as"
            options={[
              { value: 'list', label: 'List', icon: 'list' },
              { value: 'grid', label: 'Grid', icon: 'grid' },
            ]}
          />
        </BoardCard>
        <BoardCard number="13" title="Toggles / steppers" span={3}>
          <View className="flex-row flex-wrap items-center gap-4">
            <Toggle label="Notifications" defaultValue />
            <Toggle label="Sound" />
            <Stepper label="Quantity" defaultValue={1} min={0} max={9} />
          </View>
        </BoardCard>
        <BoardCard number="14" title="Status / alerts" span={6}>
          {alerts.success ? (
            <Alert
              tone="success"
              message="Account created successfully"
              onDismiss={() => setAlerts((current) => ({ ...current, success: false }))}
            />
          ) : null}
          {alerts.danger ? (
            <Alert
              tone="danger"
              message="Something went wrong. Please try again."
              onDismiss={() => setAlerts((current) => ({ ...current, danger: false }))}
            />
          ) : null}
          <Alert tone="warning" message="Your session ends in five minutes" />
          <Alert tone="info" message="A new version is ready" />
        </BoardCard>
      </BoardRow>

      <BoardRow>
        <BoardCard number="15" title="Tags / badges" span={6}>
          <View className="flex-row flex-wrap gap-3">
            <Badge label="Pinned" tone="warning" icon="star" iconFilled />
            <Badge label="New" tone="success" />
            <Badge label="Overdue" tone="danger" />
            <Badge label="Admin" tone="info" />
            <Badge label="Draft" />
          </View>
        </BoardCard>
        <BoardCard number="16" title="Avatar" span={6}>
          <View className="flex-row items-center gap-4">
            <Avatar name="Diana Larussa" size="xl" />
            <Avatar name="Budi Santoso" />
            <Avatar name="Rina" />
          </View>
        </BoardCard>
      </BoardRow>
    </ScrollView>
  );
}
