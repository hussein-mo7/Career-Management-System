import {
  Building2,
  Compass,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  NotebookPen,
  Send,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/career", label: "Career", icon: Compass },
  { href: "/criteria", label: "Criteria", icon: ListChecks },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/networking", label: "Networking", icon: Users },
  { href: "/applications", label: "Applications", icon: Send },
  { href: "/interviews", label: "Interviews", icon: MessagesSquare },
  { href: "/learning", label: "Learning", icon: GraduationCap },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
] as const;

export const SETTINGS_ITEM = { href: "/settings", label: "Settings", icon: Settings };
