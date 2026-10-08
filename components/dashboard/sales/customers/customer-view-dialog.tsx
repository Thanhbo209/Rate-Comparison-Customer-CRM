"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Package,
  Calendar,
  ExternalLink,
  Award,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { CustomerItem } from "@/lib/customer/types";
import { getCustomerAgentSummaryAction } from "@/lib/customer/actions";
import type { CustomerAgentSummaryItem } from "@/lib/rate/ranking";

interface CustomerViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerItem | null;
  onEdit: (customer: CustomerItem) => void;
}

export function CustomerViewDialog({
  open,
  onOpenChange,
  customer,
  onEdit,
}: CustomerViewDialogProps) {
  const [agentSummary, setAgentSummary] = useState<CustomerAgentSummaryItem[]>([]);
  const [bestAgent, setBestAgent] = useState<CustomerAgentSummaryItem | null>(null);
  const [agentBaseCurrency, setAgentBaseCurrency] = useState("USD");
  const [loadingAgentSummary, setLoadingAgentSummary] = useState(false);

  useEffect(() => {
    let active = true;
    if (open && customer?.id) {
      queueMicrotask(() => {
        if (active) setLoadingAgentSummary(true);
      });
      getCustomerAgentSummaryAction(customer.id)
        .then((res) => {
          if (!active) return;
          if (res.success && res.data) {
            setAgentSummary(res.data.agentSummary);
            setBestAgent(res.data.bestAgent);
            setAgentBaseCurrency(res.data.baseCurrency);
          } else {
            setAgentSummary([]);
            setBestAgent(null);
          }
        })
        .catch((err) => {
          if (!active) return;
          console.error("Failed to load customer agent summary:", err);
          setAgentSummary([]);
          setBestAgent(null);
        })
        .finally(() => {
          if (active) setLoadingAgentSummary(false);
        });
    }

    return () => {
      active = false;
    };
  }, [open, customer?.id]);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
              {customer.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <DialogTitle>{customer.companyName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                <span>Customer ID: {customer.id}</span>
                {customer.organization && (
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                    <Building2 className="size-2.5" />
                    {customer.organization.name}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-xs">
          {/* Key Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground">
                Primary Commodity
              </span>
              <p className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                <Tag className="size-3.5 text-primary" />
                <span>{customer.commodity || "Not specified"}</span>
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground">
                Active Shipments
              </span>
              <p className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                <Package className="size-3.5 text-sky-500" />
                <span>{customer._count?.shipments ?? 0} freight flows</span>
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <h4 className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              Contact Person
            </h4>

            <div className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {customer.contactPerson || "No contact person listed"}
              </span>
            </div>

            {customer.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-primary hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}

            {customer.cellPhone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <a
                    href={`tel:${customer.cellPhone}`}
                    className="text-primary hover:underline font-mono"
                  >
                    {customer.cellPhone}
                  </a>
                </div>
                <a
                  href={`tel:${customer.cellPhone}`}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </div>

          {/* Facility Location */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <h4 className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              Facility Location
            </h4>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {customer.industrialZone || "No Industrial Zone specified"}
                  {customer.location && ` • ${customer.location}`}
                </p>
                {customer.address && (
                  <p className="mt-0.5 text-muted-foreground">
                    {customer.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* BEST AGENT & AGENT PERFORMANCE ROLL-UP */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Best Agent & Carrier Performance</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Roll-up of selected / winning rates
              </span>
            </div>

            {loadingAgentSummary ? (
              <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
                Analyzing customer shipment rates...
              </div>
            ) : agentSummary.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground italic">
                No active carrier rates configured yet for this customer&apos;s shipments.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Best Agent Highlight Card */}
                {bestAgent && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Top Performing Agent
                      </span>
                      <h4 className="font-heading text-sm font-bold text-foreground mt-0.5">
                        {bestAgent.providerName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {bestAgent.shipmentsWon}{" "}
                        {bestAgent.shipmentsWon === 1 ? "shipment won" : "shipments won"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +{bestAgent.totalProfit.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {agentBaseCurrency}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        avg. +
                        {bestAgent.averageProfitPerShipment.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        / shipment
                      </p>
                    </div>
                  </div>
                )}

                {/* Agents Summary Table */}
                <div className="overflow-x-auto rounded-lg border border-border/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-[10px] text-muted-foreground uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Agent / Provider</th>
                        <th className="py-2 px-3 text-center">Shipments Won</th>
                        <th className="py-2 px-3 font-mono">Total Profit</th>
                        <th className="py-2 px-3 font-mono text-right">Avg / Shipment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {agentSummary.map((ag, idx) => (
                        <tr
                          key={ag.providerId}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2 px-3 font-semibold text-foreground flex items-center gap-1.5">
                            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                              {idx + 1}
                            </span>
                            <span className="truncate">{ag.providerName}</span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                            {ag.shipmentsWon}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{ag.totalProfit.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {agentBaseCurrency}
                          </td>
                          <td className="py-2 px-3 font-mono text-right text-foreground">
                            +{ag.averageProfitPerShipment.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {agentBaseCurrency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              Created {new Date(customer.createdAt).toLocaleDateString()}
            </span>
            <span>
              Updated {new Date(customer.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onEdit(customer);
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            Edit Customer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
