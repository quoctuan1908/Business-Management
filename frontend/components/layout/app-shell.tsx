"use client";

import {
  ClipboardList,
  FileText,
  Package,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type AppSection = "products" | "customers" | "activities" | "invoices";

type NavItem = {
  id: AppSection;
  label: string;
  icon: React.ReactNode;
};

const moduleNavItems: NavItem[] = [
  {
    id: "products",
    label: "Sản phẩm",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "customers",
    label: "Khách hàng",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "activities",
    label: "Hoạt động",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    id: "invoices",
    label: "Hóa đơn",
    icon: <FileText className="h-4 w-4" />,
  },
];

type AppShellProps = {
  children: React.ReactNode;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
};

export function AppShell({
  children,
  activeSection,
  onSectionChange,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="flex w-56 flex-col border-r bg-card">
        <div className="border-b px-4 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Business Management
          </p>
          <h1 className="mt-1 text-lg font-semibold">Nhân viên</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <div className="px-3 pb-1 text-xs font-medium uppercase text-muted-foreground">
            Module
          </div>
          {moduleNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

export const sectionMeta: Record<
  AppSection,
  { title: string; description: string }
> = {
  products: {
    title: "Sản phẩm",
    description: "Quản lý danh mục sản phẩm và tồn kho",
  },
  customers: {
    title: "Khách hàng",
    description: "Quản lý thông tin khách hàng và số dư",
  },
  activities: {
    title: "Hoạt động",
    description: "Tạo đơn hàng, chi tiết và trạng thái xử lý",
  },
  invoices: {
    title: "Hóa đơn",
    description: "Quản lý hóa đơn và trạng thái thanh toán",
  },
};
