"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Users } from "lucide-react";
import { CustomerStats } from "./customer-stats";
import { CustomerTable } from "./customer-table";
import { CustomerDialog } from "./customer-dialog";
import { CustomerViewDialog } from "./customer-view-dialog";
import { CustomerDeleteDialog } from "./customer-delete-dialog";
import type { CustomerItem, CustomerStats as CustomerStatsType } from "@/lib/customer/types";

interface CustomersViewProps {
  initialCustomers: CustomerItem[];
  stats: CustomerStatsType;
  role: "ADMIN" | "SALES" | "SALES_MANAGER";
  organizationName: string;
}

export function CustomersView({
  initialCustomers,
  stats,
  role,
  organizationName,
}: CustomersViewProps) {
  const router = useRouter();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerItem | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerItem | null>(null);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Top CTA Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Customer Directory
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {stats.totalCustomers} Accounts
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Manage shipper accounts, manufacturing plants, contacts, and commodity profiles for {organizationName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <CustomerStats stats={stats} />

      {/* Customer List Data Table */}
      <CustomerTable
        customers={initialCustomers}
        onAddNew={() => setCreateDialogOpen(true)}
        onView={(cust) => setViewingCustomer(cust)}
        onEdit={(cust) => setEditingCustomer(cust)}
        onDelete={(cust) => setDeletingCustomer(cust)}
      />

      {/* Create Customer Dialog */}
      <CustomerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* Edit Customer Dialog */}
      <CustomerDialog
        open={!!editingCustomer}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
        customer={editingCustomer}
        onSuccess={handleSuccess}
      />

      {/* View Customer Details Dialog */}
      <CustomerViewDialog
        open={!!viewingCustomer}
        onOpenChange={(open) => !open && setViewingCustomer(null)}
        customer={viewingCustomer}
        onEdit={(cust) => {
          setViewingCustomer(null);
          setEditingCustomer(cust);
        }}
      />

      {/* Delete Customer Confirmation Dialog */}
      <CustomerDeleteDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        customer={deletingCustomer}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
