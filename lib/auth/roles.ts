export type AppRole = "ADMIN" | "SALES_MANAGER" | "SALES";

export const ROLE_LABEL: Record<AppRole, string> = {
  ADMIN: "Admin",
  SALES_MANAGER: "Sales manager",
  SALES: "Sales",
};

// Where each role lands after login
export const ROLE_HOME: Record<AppRole, string> = {
  ADMIN: "/dashboard/admin",
  SALES_MANAGER: "/dashboard/sales", // TODO: give managers their own dashboard
  SALES: "/dashboard/sales",
};

// No href = page not built yet, shown as "Soon"
export type NavItem = { label: string; href?: string };

const SALES_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/sales" },
  { label: "My customers", href: "/dashboard/sales/customers" },
  { label: "My RFQs" },
  { label: "My quotations" },
];

export const NAV: Record<AppRole, NavItem[]> = {
  ADMIN: [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Customers", href: "/dashboard/admin/customers" },
    { label: "RFQs" },
    { label: "Quotations" },
    { label: "Reports" },
    { label: "Users & roles" },
  ],
  SALES_MANAGER: SALES_NAV,
  SALES: SALES_NAV,
};
