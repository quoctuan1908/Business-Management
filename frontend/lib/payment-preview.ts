import type { PaymentStatus } from "@/lib/types";

export const PAYMENT_METHOD_BALANCE = "So du khach hang";

export type PendingPaymentLine = {
  clientId: string;
  paidAmount: number;
  method: string;
};

export type PaymentPreviewRow = PendingPaymentLine & {
  isBalance?: boolean;
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  partial: "Thanh toán một phần",
  paid: "Đã thanh toán",
};

export function computePaymentPreview(
  invoiceTotal: number,
  customerBalance: number,
  pendingLines: PendingPaymentLine[],
  useBalanceOnComplete: boolean,
): {
  paidTotal: number;
  remaining: number;
  projectedCustomerBalance: number;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  displayRows: PaymentPreviewRow[];
} {
  let paid = 0;
  let balance = customerBalance;
  let remaining = invoiceTotal;
  const displayRows: PaymentPreviewRow[] = [];

  if (useBalanceOnComplete && balance > 0 && remaining > 0) {
    const apply = Math.min(balance, remaining);
    paid += apply;
    balance -= apply;
    remaining -= apply;
    displayRows.push({
      clientId: "__balance__",
      paidAmount: apply,
      method: PAYMENT_METHOD_BALANCE,
      isBalance: true,
    });
  }

  for (const line of pendingLines) {
    let amountLeft = line.paidAmount;
    if (remaining > 0 && amountLeft > 0) {
      const toOrder = Math.min(amountLeft, remaining);
      paid += toOrder;
      remaining -= toOrder;
      amountLeft -= toOrder;
    }
    if (amountLeft > 0) {
      balance += amountLeft;
    }
    displayRows.push(line);
  }

  let paymentStatus: PaymentStatus = "unpaid";
  if (paid <= 0) paymentStatus = "unpaid";
  else if (paid >= invoiceTotal) paymentStatus = "paid";
  else paymentStatus = "partial";

  return {
    paidTotal: paid,
    remaining,
    projectedCustomerBalance: balance,
    paymentStatus,
    paymentStatusLabel: STATUS_LABELS[paymentStatus],
    displayRows,
  };
}
