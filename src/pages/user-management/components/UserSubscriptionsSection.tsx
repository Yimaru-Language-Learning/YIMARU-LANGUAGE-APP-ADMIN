import { CreditCard, RefreshCw } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { SpinnerIcon } from "../../../components/ui/spinner-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { cn } from "../../../lib/utils";
import type { UserSubscriptionsData } from "../../../types/userAdmin.types";

function formatStatusLabel(status: string): string {
  const value = status.trim();
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCategoryLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTime(value?: string | null): string {
  if (!value?.trim()) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSubscriptionStatusClasses(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE" || normalized === "SUCCESS") {
    return "bg-mint-500/15 text-mint-500 border border-mint-500/25";
  }
  if (normalized === "PENDING") {
    return "bg-gold-100 text-gold-600 border border-gold-300/40";
  }
  if (normalized === "FAILED" || normalized === "EXPIRED") {
    return "bg-destructive/15 text-destructive border border-destructive/25";
  }
  return "bg-grayScale-100 text-grayScale-600 border border-grayScale-200";
}

function formatDuration(value: number, unit: string): string {
  if (!value) return "—";
  const label = unit.trim().toLowerCase();
  const plural = value === 1 ? label.replace(/s$/, "") : label.endsWith("s") ? label : `${label}s`;
  return `${value} ${plural}`;
}

function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "—";
  const code = currency.trim() || "ETB";
  return `${amount.toLocaleString()} ${code}`;
}

export function UserSubscriptionsSection({
  subscriptions,
  loading,
  error,
}: {
  subscriptions: UserSubscriptionsData | null;
  loading: boolean;
  error: string | null;
}) {
  const recentPayments = subscriptions?.payments.slice(0, 8) ?? [];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/50">
              <CreditCard className="h-4 w-4 text-brand-600" />
            </div>
            <CardTitle className="text-base">Subscriptions</CardTitle>
          </div>
          {subscriptions ? (
            <Badge className={cn(getSubscriptionStatusClasses(subscriptions.display_status))}>
              {formatStatusLabel(subscriptions.display_status)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-grayScale-400">
            <SpinnerIcon className="h-4 w-4" />
            Loading subscriptions...
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!loading && !error && subscriptions ? (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-grayScale-500">Active subscription</span>
              <span className="font-medium text-grayScale-700">
                {subscriptions.has_active_subscription ? "Yes" : "No"}
              </span>
            </div>

            {Object.keys(subscriptions.active_by_category).length > 0 ? (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                    Access by category
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(subscriptions.active_by_category).map(([category, active]) => (
                      <Badge
                        key={category}
                        variant={active ? "default" : "outline"}
                        className={cn(!active && "text-grayScale-500")}
                      >
                        {formatCategoryLabel(category)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <Separator />

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                Active plans
              </p>
              {subscriptions.active_subscriptions.length === 0 ? (
                <p className="text-sm text-grayScale-400">No active subscriptions.</p>
              ) : (
                <div className="space-y-3">
                  {subscriptions.active_subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="rounded-xl border border-grayScale-100 bg-grayScale-50/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-grayScale-800">{subscription.plan_name}</p>
                          <p className="text-xs text-grayScale-500">
                            {formatCategoryLabel(subscription.plan_category)}
                          </p>
                        </div>
                        <Badge className={cn(getSubscriptionStatusClasses(subscription.status))}>
                          {formatStatusLabel(subscription.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-grayScale-600 sm:grid-cols-2">
                        <p>
                          <span className="text-grayScale-400">Price: </span>
                          {formatMoney(subscription.price, subscription.currency)}
                        </p>
                        <p>
                          <span className="text-grayScale-400">Duration: </span>
                          {formatDuration(subscription.duration_value, subscription.duration_unit)}
                        </p>
                        <p>
                          <span className="text-grayScale-400">Starts: </span>
                          {formatDateTime(subscription.starts_at)}
                        </p>
                        <p>
                          <span className="text-grayScale-400">Expires: </span>
                          {formatDateTime(subscription.expires_at)}
                        </p>
                        <p>
                          <span className="text-grayScale-400">Payment: </span>
                          {subscription.payment_method || "—"}
                        </p>
                        <p className="inline-flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 text-grayScale-400" />
                          Auto-renew: {subscription.auto_renew ? "On" : "Off"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {recentPayments.length > 0 ? (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-grayScale-400">
                    Recent payments
                  </p>
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-sm text-grayScale-700">
                              {payment.plan_name || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-grayScale-700">
                              {formatMoney(payment.amount, payment.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(getSubscriptionStatusClasses(payment.status))}>
                                {formatStatusLabel(payment.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-grayScale-500">
                              {payment.payment_method || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-grayScale-500">
                              {formatDateTime(payment.paid_at || payment.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {!loading && !error && !subscriptions ? (
          <p className="text-sm text-grayScale-400">No subscription data available.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
