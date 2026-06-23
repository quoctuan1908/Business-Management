"use client";

import { useEffect, useState } from "react";

import { ActivitiesPanel } from "@/components/activities/activities-panel";
import { CustomersPanel } from "@/components/customers/customers-panel";
import { ImportsPanel } from "@/components/imports/imports-panel";
import {
  AppShell,
  sectionMeta,
  type AppSection,
} from "@/components/layout/app-shell";
import { ProductsPanel } from "@/components/products/products-panel";
import { SalariesPanel } from "@/components/salaries/salaries-panel";
import { SuppliersPanel } from "@/components/suppliers/suppliers-panel";
import { UsersPanel } from "@/components/users/users-panel";
import { useAuth } from "@/lib/auth-context";
import {
  canAccessSection,
  isAdmin,
  sectionsForRole,
} from "@/lib/permissions";
import { UserDashboard } from "@/components/users/user-dashboard";
import { AdminSalesDashboard } from "@/components/users/admin-sales-dashboard";

function SectionPanel({ section }: { section: AppSection }) {
  switch (section) {
    case "products":
      return <ProductsPanel />;
    case "suppliers":
      return <SuppliersPanel />;
    case "imports":
      return <ImportsPanel />;
    case "customers":
      return <CustomersPanel />;
    case "activities":
      return <ActivitiesPanel />;
    case "users":
      return <UsersPanel />;
    case "salaries":
      return <SalariesPanel />;
    // Added: Handler to render the employee dashboard view
    case "user-dashboard":
      return <UserDashboard />;
    case "admin-sales-dashboard":
      return <AdminSalesDashboard />;
    default:
      return null;
  }
}

function defaultSection(role: string | undefined): AppSection {
  return isAdmin(role) ? "admin-sales-dashboard" : "user-dashboard";
}

export default function HomePage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AppSection>("activities");

  useEffect(() => {
    if (!user) return;
    const allowed = sectionsForRole(user.role);
    if (!canAccessSection(user.role, activeSection)) {
      setActiveSection(allowed[0] ?? defaultSection(user.role));
    }
  }, [user, activeSection]);

  useEffect(() => {
    if (user?.userId) {
      setActiveSection(defaultSection(user.role));
    }
  }, [user?.userId, user?.role]);

  const meta = sectionMeta[activeSection];

  return (
    <AppShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <header className="border-b bg-card px-6 py-4">
        {/* Safe navigation guard in case metadata for the new section isn't registered yet */}
        <h2 className="text-xl font-semibold">{meta?.title || "Dashboard"}</h2>
        <p className="text-sm text-muted-foreground">{meta?.description || "Employee Overview Analytics"}</p>
      </header>
      <div className="flex-1 p-6 overflow-auto">
        <SectionPanel section={activeSection} />
      </div>
    </AppShell>
  );
}