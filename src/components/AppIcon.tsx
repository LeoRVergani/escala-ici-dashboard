import {
  Bell,
  Undo2,
  Redo2,
  UploadCloud,
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  History,
  CalendarRange,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  Menu,
  LayoutGrid,
  Repeat2,
  Settings,
  Building2,
  UsersRound,
  Clock3,
  Plus,
  Save,
  Search,
  Loader2,
  Inbox,
  LogOut,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react';

/** Official Órbita icon set — every UI icon must be one of these, never a raw emoji/glyph/lucide import outside this file. */
const ICONS = {
  bell: Bell,
  undo: Undo2,
  redo: Redo2,
  upload: UploadCloud,
  check: Check,
  checkCircle: CheckCircle2,
  close: X,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  history: History,
  schedules: CalendarRange,
  calendar: CalendarDays,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  shield: ShieldCheck,
  flask: FlaskConical,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  menu: Menu,
  organizations: LayoutGrid,
  exchange: Repeat2,
  settings: Settings,
  building: Building2,
  users: UsersRound,
  clock: Clock3,
  add: Plus,
  save: Save,
  search: Search,
  loading: Loader2,
  empty: Inbox,
  logout: LogOut,
  more: MoreHorizontal,
  edit: Pencil,
  delete: Trash2,
  dragHandle: GripVertical,
} as const;

export type AppIconName = keyof typeof ICONS;
export const APP_ICON_NAMES = Object.keys(ICONS) as AppIconName[];

export const APP_ICON_SIZES = [14, 16, 18, 20, 24] as const;
export type AppIconSize = (typeof APP_ICON_SIZES)[number];

export const APP_ICON_STROKE_WIDTHS = [1.5, 1.75, 2] as const;
export type AppIconStrokeWidth = (typeof APP_ICON_STROKE_WIDTHS)[number];

export type AppIconTone = 'default' | 'muted' | 'active' | 'success' | 'warning' | 'danger';

// "default" deliberately applies no color utility — lucide icons stroke with
// `currentColor`, so with no override here the icon inherits whatever text
// color its container already sets (button text, badge text, etc). This
// avoids a real bug: two competing `text-*` utilities on the same element
// are resolved by Tailwind's generated CSS order, not JSX attribute order,
// so an explicit "default" color can silently lose to a parent's — e.g. the
// arrow icon on the white "Entrar com Microsoft" button needs to inherit the
// button's dark text, never assert its own light-on-dark default color.
const TONE_CLASSES: Record<AppIconTone, string> = {
  default: '',
  muted: 'text-orbita-text-faint',
  active: 'text-orbita-blue',
  success: 'text-orbita-success',
  warning: 'text-orbita-warning',
  danger: 'text-orbita-danger',
};

export interface AppIconProps {
  name: AppIconName;
  size?: AppIconSize;
  tone?: AppIconTone;
  strokeWidth?: AppIconStrokeWidth;
  className?: string;
  /** Purely visual, doesn't add information beyond adjacent text (default). Set false for icon-only controls. */
  decorative?: boolean;
  /** Required accessible name when decorative=false — e.g. an icon-only button with no visible text. */
  label?: string;
}

/** The single source of icon rendering in the app — never import lucide-react or drop an emoji/glyph directly in a page. */
export function AppIcon({
  name,
  size = 18,
  tone = 'default',
  strokeWidth = 1.75,
  className = '',
  decorative = true,
  label,
}: AppIconProps) {
  const Component = ICONS[name];

  if (!decorative && !label && import.meta.env.DEV) {
    console.error(`AppIcon: name="${name}" has decorative={false} but no label was provided.`);
  }

  return (
    <Component
      aria-hidden={decorative ? 'true' : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${TONE_CLASSES[tone]} ${className}`}
    />
  );
}
