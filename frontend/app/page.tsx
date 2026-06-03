"use client";

import { useState } from "react";

import { ActivitiesPanel } from "@/components/activities/activities-panel";
import { CustomersPanel } from "@/components/customers/customers-panel";
import {
  AppShell,
  sectionMeta,
  type AppSection,
} from "@/components/layout/app-shell";
import { InvoicesPanel } from "@/components/invoices/invoices-panel";
import { ProductsPanel } from "@/components/products/products-panel";
import { SalariesPanel } from "@/components/salaries/salaries-panel";
import { UsersPanel } from "@/components/users/users-panel";
// Imported: Integrated the dedicated employee statistics page
import { UserDashboard } from "@/components/users/user-dashboard";

function SectionPanel({ section }: { section: AppSection }) {
  switch (section) {
    case "products":
      return <ProductsPanel />;
    case "customers":
      return <CustomersPanel />;
    case "activities":
      return <ActivitiesPanel />;
    case "invoices":
      return <InvoicesPanel />;
    case "users":
      return <UsersPanel />;
    case "salaries":
      return <SalariesPanel />;
    // Added: Handler to render the employee dashboard view
    case "user-dashboard":
      return <UserDashboard />;
    default:
      return null;
  }
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<AppSection>("products");
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