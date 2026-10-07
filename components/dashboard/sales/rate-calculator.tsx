"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, Ship, Clock, Send } from "lucide-react";

interface CarrierRate {
  carrier: string;
  transitDays: number;
  rate20: number;
  rate40: number;
  rate40HC: number;
  validUntil: string;
  direct: boolean;
}

const CARRIER_RATES: CarrierRate[] = [
  {
    carrier: "Maersk",
    transitDays: 14,
    rate20: 1650,
    rate40: 2150,
    rate40HC: 2280,
    validUntil: "May 15, 2026",
    direct: true,
  },
  {
    carrier: "CMA CGM",
    transitDays: 16,
    rate20: 1580,
    rate40: 2080,
    rate40HC: 2190,
    validUntil: "May 18, 2026",
    direct: true,
  },
  {
    carrier: "Ocean Network Express (ONE)",
    transitDays: 15,
    rate20: 1620,
    rate40: 2120,
    rate40HC: 2240,
    validUntil: "May 12, 2026",
    direct: true,
  },
  {
    carrier: "Evergreen Marine",
    transitDays: 18,
    rate20: 1490,
    rate40: 1980,
    rate40HC: 2090,
    validUntil: "May 20, 2026",
    direct: false,
  },
];

export function RateCalculator() {
  const [origin, setOrigin] = useState("CNSHA - Shanghai, China");
  const [destination, setDestination] = useState("USLAX - Los Angeles, USA");
  const [equipment, setEquipment] = useState<"rate20" | "rate40" | "rate40HC">(
    "rate40HC",
  );
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(
    "Maersk",
  );
  const [quoteSent, setQuoteSent] = useState(false);

  const handleCreateQuote = () => {
    setQuoteSent(true);
    setTimeout(() => setQuoteSent(false), 3000);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Ship className="size-4 text-primary" />
            <h3 className="font-heading text-base font-semibold text-foreground">
              Live Freight Rate Comparison
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Instantly compare ocean container rates across premier shipping
            lines
          </p>
        </div>

        {/* Equipment Selector */}
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setEquipment("rate20")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              equipment === "rate20"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            20&apos; GP
          </button>
          <button
            type="button"
            onClick={() => setEquipment("rate40")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              equipment === "rate40"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            40&apos; GP
          </button>
          <button
            type="button"
            onClick={() => setEquipment("rate40HC")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              equipment === "rate40HC"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            40&apos; HC
          </button>
        </div>
      </div>

      {/* Port Inputs */}
      <div className="grid grid-cols-1 gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">
            Port of Loading (POL)
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="CNSHA - Shanghai, China">
              CNSHA - Shanghai, China
            </option>
            <option value="CNNGB - Ningbo, China">CNNGB - Ningbo, China</option>
            <option value="VNSGN - Ho Chi Minh, Vietnam">
              VNSGN - Ho Chi Minh, Vietnam
            </option>
            <option value="SGSIN - Singapore, Singapore">
              SGSIN - Singapore, Singapore
            </option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground">
            Port of Discharge (POD)
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="USLAX - Los Angeles, USA">
              USLAX - Los Angeles, USA
            </option>
            <option value="USLGB - Long Beach, USA">
              USLGB - Long Beach, USA
            </option>
            <option value="NLRTM - Rotterdam, Netherlands">
              NLRTM - Rotterdam, Netherlands
            </option>
            <option value="DEHAM - Hamburg, Germany">
              DEHAM - Hamburg, Germany
            </option>
          </select>
        </div>
      </div>

      {/* Comparison Results */}
      <div className="divide-y divide-border overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Carrier</th>
              <th className="px-5 py-2.5 font-medium">Transit</th>
              <th className="px-5 py-2.5 font-medium">Validity</th>
              <th className="px-5 py-2.5 font-medium">Estimated Rate</th>
              <th className="px-5 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CARRIER_RATES.map((item) => {
              const rate = item[equipment];
              const isSelected = selectedCarrier === item.carrier;

              return (
                <tr
                  key={item.carrier}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-primary/5 font-medium"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-foreground">
                        {item.carrier}
                      </div>
                      {item.direct && (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                          Direct
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {item.transitDays} days
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {item.validUntil}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-heading text-sm font-bold text-foreground">
                      ${rate.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {" "}
                      / unit
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCarrier(item.carrier)}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="size-3" />
                      ) : (
                        <ArrowLeftRight className="size-3" />
                      )}
                      <span>{isSelected ? "Selected" : "Select"}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action footer */}
      <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Selected:{" "}
          <strong className="text-foreground">{selectedCarrier}</strong> on lane{" "}
          <span className="font-mono text-[11px]">
            {origin.split(" - ")[0]} &rarr; {destination.split(" - ")[0]}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCreateQuote}
          disabled={quoteSent}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {quoteSent ? (
            <>
              <Check className="size-3.5" />
              <span>Quote Prepared & Saved!</span>
            </>
          ) : (
            <>
              <Send className="size-3.5" />
              <span>Prepare Quotation for Customer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
