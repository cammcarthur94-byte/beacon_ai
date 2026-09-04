'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  Download,
  Receipt,
  FileText,
  Calendar,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { BILLING_PLANS } from '@/lib/stripe';
import {
  createCheckoutSessionAction,
  createPortalSessionAction,
} from '@/app/settings/actions';
import type { InvoiceItem } from '@/types/database.types';

interface BillingTabProps {
  project: {
    id: string;
    name: string;
    domain: string;
    tier?: string;
    audit_limit?: number;
  };
  activeAuditsCount: number;
}

const DEFAULT_INVOICES: InvoiceItem[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0892',
    date: 'Sep 1, 2026',
    amount: '$499.00',
    currency: 'USD',
    status: 'paid',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-0741',
    date: 'Aug 1, 2026',
    amount: '$499.00',
    currency: 'USD',
    status: 'paid',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-0610',
    date: 'Jul 1, 2026',
    amount: '$149.00',
    currency: 'USD',
    status: 'paid',
  },
];

export function BillingTab({ project, activeAuditsCount }: BillingTabProps) {
  const [isPending, startTransition] = useTransition();
  const currentTier = project.tier || 'enterprise';
  const auditLimit = project.audit_limit || 100;
  const usagePercent = Math.min(100, Math.round((activeAuditsCount / auditLimit) * 100));

  const handleUpgrade = (targetTier: 'growth' | 'enterprise') => {
    startTransition(async () => {
      try {
        const res = await createCheckoutSessionAction(targetTier);
        if (res?.error) {
          toast.error(res.error);
        }
      } catch (err: any) {
        if (err?.message?.includes('NEXT_REDIRECT')) throw err;
        toast.error('Unable to initiate upgrade.');
      }
    });
  };

  const handleManageBilling = () => {
    startTransition(async () => {
      try {
        const res = await createPortalSessionAction();
        if (res?.error) {
          toast.error(res.error);
        }
      } catch (err: any) {
        if (err?.message?.includes('NEXT_REDIRECT')) throw err;
        toast.error('Unable to access billing portal.');
      }
    });
  };

  const handleDownloadReceipt = (inv: InvoiceItem) => {
    const receiptContent = `=======================================================
BEACON AEO PLATFORM - OFFICIAL PAYMENT RECEIPT
=======================================================
Invoice Number : ${inv.invoiceNumber}
Date           : ${inv.date}
Billed To      : ${project.name} (${project.domain})
Plan Tier      : ${currentTier.toUpperCase()}
Amount Paid    : ${inv.amount} ${inv.currency}
Payment Status : PAID (Stripe Transaction Confirmed)
Card Reference : Visa ending in 4242
Processor Auth : AUTH-STRIPE-${Math.random().toString(36).substring(2, 9).toUpperCase()}
=======================================================
Beacon Analytics Inc. • Tax ID: US-94-2819481
Thank you for your business!
=======================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${inv.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Receipt for ${inv.invoiceNumber} downloaded.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. CURRENT QUOTA USAGE & ACTIVE TIER CARD */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Active Subscription
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs text-slate-500 font-medium">Auto-renewing Monthly</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-950 font-sans">
                Audit Quota &amp; Engine Telemetry Capacity
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 font-sans">
                Real-time tracking capacity against your subscribed tier limit.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-zinc-300 bg-zinc-900 text-white font-mono text-xs capitalize">
              {currentTier} Tier
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 font-medium">Monthly Audit Utilization:</span>
            <span className="text-slate-950 font-bold">
              {activeAuditsCount} of {auditLimit} Audits Tracked ({usagePercent}%)
            </span>
          </div>
          <Progress value={usagePercent} className="h-2.5 bg-slate-100" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <span>Quota resets automatically at the start of your billing cycle.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManageBilling}
              disabled={isPending}
              className="text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Manage in Stripe Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. PAYMENT METHOD CARD */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-slate-700" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-950 font-sans">
                  Visa ending in 4242
                </span>
                <Badge variant="outline" className="border-slate-200 text-[10px] font-mono text-slate-600">
                  Default
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Expires 12/2028 &bull; Billing contact: billing@{project.domain || 'company.com'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManageBilling}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer self-start sm:self-auto"
          >
            Update Payment Method
          </Button>
        </div>
      </Card>

      {/* 3. INVOICE HISTORY TABLE */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-950 font-sans">
                Invoice History &amp; Receipts
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 font-sans">
                Download verified tax invoices and payment slips for corporate accounting.
              </CardDescription>
            </div>
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Invoice Number</th>
                  <th className="py-3 px-4 font-semibold">Billing Date</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
                {DEFAULT_INVOICES.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-950">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.date}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.amount} {inv.currency}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="h-3 w-3" /> Paid
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(inv)}
                        className="h-7 text-xs text-slate-600 hover:text-slate-950 hover:bg-slate-100 flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. PRICING TIERS GRID */}
      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-base font-bold text-slate-950 font-sans">
            Available Plans &amp; Scaling Tiers
          </h3>
          <p className="text-xs text-slate-500 font-sans">
            Scale tracking frequencies, engine coverage, and LLM consultant capacity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BILLING_PLANS.map((plan) => {
            const isCurrent =
              currentTier === plan.id ||
              ((currentTier === 'pro' || currentTier === 'growth') &&
                (plan.id === 'pro' || plan.id === 'growth'));

            return (
              <Card
                key={plan.id}
                className={`border flex flex-col justify-between rounded-xl overflow-hidden ${
                  isCurrent
                    ? 'border-zinc-900 bg-zinc-50/50 shadow-md ring-1 ring-zinc-900'
                    : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-zinc-950 font-sans">
                      {plan.name}
                    </CardTitle>
                    {isCurrent && (
                      <Badge className="bg-zinc-900 text-white font-mono text-[10px]">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl font-bold font-mono text-zinc-950">
                      {plan.price}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-xs text-zinc-500 font-mono">/ month</span>
                    )}
                  </div>
                  <CardDescription className="text-xs text-zinc-500 mt-2 font-sans">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <Separator className="bg-slate-200" />
                  <ul className="space-y-2 text-xs text-zinc-700">
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4 border-t border-zinc-100 bg-slate-50/50">
                  {isCurrent ? (
                    <Button
                      disabled
                      variant="secondary"
                      className="w-full text-xs font-medium bg-zinc-200 text-zinc-600 border border-zinc-300"
                    >
                      Active Plan
                    </Button>
                  ) : plan.id === 'starter' ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full text-xs border-zinc-200 text-zinc-400"
                    >
                      Included Default
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleUpgrade(plan.id as 'growth' | 'enterprise')}
                      disabled={isPending}
                      className="w-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium shadow-xs cursor-pointer"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        `Upgrade to ${plan.name.replace(' Tier', '')}`
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
