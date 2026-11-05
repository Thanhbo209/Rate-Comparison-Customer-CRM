import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  Calculator,
  CircleHelp,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
} from "lucide-react";

export interface NavConfigItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const ADMIN_NAV_ITEMS: NavConfigItem[] = [
  {
    label: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Customers",
    href: "/dashboard/admin/customers",
    icon: Users,
  },
  {
    label: "Shipments",
    href: "/dashboard/admin/shipments",
    icon: Package,
  },
  {
    label: "Rate comparison",
    href: "/dashboard/admin/rates",
    icon: ArrowLeftRight,
  },
  {
    label: "RFQs",
    href: "/dashboard/admin/rfqs",
    icon: FileSpreadsheet,
    badge: "Soon",
  },
  {
    label: "Quotations",
    href: "/dashboard/admin/quotations",
    icon: Calculator,
    badge: "Soon",
  },
  {
    label: "Reports",
    href: "/dashboard/admin/reports",
    icon: BarChart3,
    badge: "Soon",
  },
  {
    label: "Users & roles",
    href: "/dashboard/admin/users",
    icon: ShieldCheck,
    badge: "Soon",
  },
];

export const ADMIN_BOTTOM_ITEMS: NavConfigItem[] = [
  {
    label: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/dashboard/admin/help",
    icon: CircleHelp,
    badge: "Soon",
  },
];

export const SALES_BOTTOM_ITEMS: NavConfigItem[] = [
  {
    label: "Settings",
    href: "/dashboard/sales/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/dashboard/sales/help",
    icon: CircleHelp,
    badge: "Soon",
  },
];

export const SALES_NAV_ITEMS: NavConfigItem[] = [
  {
    label: "Overview",
    href: "/dashboard/sales",
    icon: LayoutDashboard,
  },
  {
    label: "My customers",
    href: "/dashboard/sales/customers",
    icon: Users,
  },
  {
    label: "Shipments",
    href: "/dashboard/sales/shipments",
    icon: Package,
  },
  {
    label: "Rate comparison",
    href: "/dashboard/sales/rates",
    icon: ArrowLeftRight,
  },
  {
    label: "Team members",
    href: "/dashboard/sales/team",
    icon: UserPlus,
  },

  {
    label: "Sales targets",
    href: "/dashboard/sales/targets",
    icon: Target,
    badge: "Soon",
  },
  {
    label: "AI Asking",
    href: "/dashboard/sales/targets",
    icon: Bot,
    badge: "Soon",
  },
];
