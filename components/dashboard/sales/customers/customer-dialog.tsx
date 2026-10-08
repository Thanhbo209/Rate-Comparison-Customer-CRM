"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Building2, User, Mail, Phone, MapPin, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createCustomerAction, updateCustomerAction } from "@/lib/customer/actions";
import type { CustomerItem, CustomerFormData } from "@/lib/customer/types";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerItem | null;
  onSuccess: () => void;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const isEdit = !!customer;

  const [formData, setFormData] = useState<CustomerFormData>({
    companyName: "",
    industrialZone: "",
    location: "",
    address: "",
    commodity: "",
    contactPerson: "",
    cellPhone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName || "",
        industrialZone: customer.industrialZone || "",
        location: customer.location || "",
        address: customer.address || "",
        commodity: customer.commodity || "",
        contactPerson: customer.contactPerson || "",
        cellPhone: customer.cellPhone || "",
        email: customer.email || "",
      });
    } else {
      setFormData({
        companyName: "",
        industrialZone: "",
        location: "",
        address: "",
        commodity: "",
        contactPerson: "",
        cellPhone: "",
        email: "",
      });
    }
    setError(null);
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = isEdit
        ? await updateCustomerAction(customer.id, formData)
        : await createCustomerAction(formData);

      if (!res.success) {
        setError(res.error || "An error occurred");
        setLoading(false);
        return;
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Customer Details" : "Add New Customer Account"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update company information, logistics locations, and contact points."
              : "Register a new forwarder customer, manufacturing plant, or cargo shipper."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Company Name <span className="text-destructive">*</span>
            </label>
            <div className="relative mt-1">
              <Building2 className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="e.g. Foxconn Vietnam Precision Co."
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Contact Person & Email */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">
                Contact Person
              </label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Ms. Linh Nguyen"
                  value={formData.contactPerson || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="e.g. logistics@company.com"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Phone & Commodity */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">
                Phone / Cell
              </label>
              <div className="relative mt-1">
                <Phone className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="e.g. +84 908 123 456"
                  value={formData.cellPhone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cellPhone: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">
                Primary Commodity / Cargo
              </label>
              <div className="relative mt-1">
                <Tag className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Consumer Electronics, Garments"
                  value={formData.commodity || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, commodity: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Industrial Zone & Location/City */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">
                Industrial Zone (IZ)
              </label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. VSIP II, Amata IZ, Tan Thuan"
                  value={formData.industrialZone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industrialZone: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">
                Location / Province
              </label>
              <input
                type="text"
                placeholder="e.g. Binh Duong, Dong Nai, Hai Phong"
                value={formData.location || ""}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-medium text-foreground">
              Factory / Office Address
            </label>
            <input
              type="text"
              placeholder="e.g. Road 12, Lot B2, VSIP II Industrial Park"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isEdit ? "Save Changes" : "Create Customer"}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
