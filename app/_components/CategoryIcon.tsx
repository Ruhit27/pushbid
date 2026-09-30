import {
  Baby, Bitcoin, Bot, BriefcaseBusiness, Building2, Calendar, Camera, Car, ChartColumn, Cloud, Code, Coins, Database,
  Dumbbell, Film, Gamepad2, Globe, GraduationCap, Hammer, HeartPulse, House, Image, KanbanSquare, Leaf, Link, ListTodo,
  Mail, Megaphone, Mic, Music, Newspaper, Palette, PawPrint, PenLine, Plane, Rocket, Scale, SearchCheck, Shapes, Share2,
  ShieldCheck, Shirt, ShoppingBag, Sparkles, Store, Tag, Target, Trophy, UserRound, Users, Utensils, Video, Wand2,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/category-icons";

const ICONS: Record<IconKey, LucideIcon> = {
  trophy: Trophy, megaphone: Megaphone, "search-check": SearchCheck, "list-todo": ListTodo, bot: Bot, code: Code,
  bitcoin: Bitcoin, gamepad: Gamepad2, "heart-pulse": HeartPulse, scale: Scale, "shopping-bag": ShoppingBag, plane: Plane,
  rocket: Rocket, building: Building2, wand: Wand2, share: Share2, "graduation-cap": GraduationCap, user: UserRound,
  palette: Palette, briefcase: BriefcaseBusiness, globe: Globe, target: Target, "shield-check": ShieldCheck,
  newspaper: Newspaper, house: House, pen: PenLine, mic: Mic, chart: ChartColumn, kanban: KanbanSquare, shapes: Shapes,
  tag: Tag, music: Music, utensils: Utensils, film: Film, car: Car, leaf: Leaf, camera: Camera, dumbbell: Dumbbell,
  baby: Baby, paw: PawPrint, shirt: Shirt, hammer: Hammer, cloud: Cloud, database: Database, mail: Mail,
  calendar: Calendar, coins: Coins, sparkles: Sparkles, image: Image, video: Video, users: Users, link: Link, store: Store,
};

export function CategoryIcon({ icon, size = 16, className }: { icon: IconKey; size?: number; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
}
