"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import {
  activitiesApi,
  activityDetailsApi,
  lookupApi,
  orderStatusesApi,
} from "@/lib/api";
import type {
  Activity,
  ActivityDetail,
  ActivityWrite,
  Customer,
  User,
  OrderStatus,
  Product,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ActivityDetailDialogProps = {
  activityId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
  users: User[];
  customers: Customer[];
};

const emptyLineForm = {
  productId: "",
  quantity: "1",
  salePrice: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function ActivityDetailDialog({
  activityId,
  open,
  onOpenChange,
  onChanged,
  users,
  customers,
}: ActivityDetailDialogProps) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [details, setDetails] = useState<ActivityDetail[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lineForm, setLineForm] = useState(emptyLineForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [headerForm, setHeaderForm] = useState({
    userId: "",
    customerId: "",
    activityDate: "",
    content: "",
  });

  const isDraft = activity?.status === "draft";
  const statusLabel =
    statuses.find((s) => s.statusCode === activity?.status)?.statusName ??
    activity?.status ??
    "";
  const currentStatus = statuses.find((s) => s.statusCode === activity?.status);
  const nextStatus = currentStatus
    ? statuses.find((s) => s.sortOrder === currentStatus.sortOrder + 1)
    : undefined;

  const load = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    setError(null);
    try {
      const [act, detailList, productList, statusList] = await Promise.all([
        activitiesApi.getOne(activityId),
        activityDetailsApi.getByActivity(activityId),
        lookupApi.products(),
        orderStatusesApi.getAll(),
      ]);
      setActivity(act);
      setDetails(detailList);
      setProducts(productList);
      setStatuses(statusList);
      setHeaderForm({
        userId: String(act.userId),
        customerId: String(act.customerId),
        activityDate: act.activityDate.slice(0, 16),
        content: act.content,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (open && activityId) {
      setLineForm(emptyLineForm);
      setEditingProductId(null);
      void load();
    }
  }, [open, activityId, load]);

  async function saveHeader() {
    if (!activity) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: activity.id,
        userId: Number(headerForm.userId),
        customerId: Number(headerForm.customerId),
        activityDate: new Date(headerForm.activityDate).toISOString(),
        content: headerForm.content,
        status: activity.status,
        invoiceId: activity.invoiceId,
      };
      const updated = await activitiesApi.update(payload);
      setActivity(updated);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thông tin thất bại");
    } finally {
      setSaving(false);
    }
  }

  function onProductChange(productId: string) {
    const product = products.find((p) => p.id === Number(productId));
    setLineForm((f) => ({
      ...f,
      productId,
      salePrice: product ? String(product.unitPrice) : f.salePrice,
    }));
  }

  async function saveLine(e: React.FormEvent) {
    e.preventDefault();
    if (!activity) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        activityId: activity.id,
        productId: Number(lineForm.productId),
        quantity: Number(lineForm.quantity),
        salePrice: Number(lineForm.salePrice),
      };
      if (editingProductId !== null) {
        await activityDetailsApi.update(payload);
      } else {
        await activityDetailsApi.add(payload);
      }
      setLineForm(emptyLineForm);
      setEditingProductId(null);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu dòng hàng thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLine(productId: number) {
    if (!activity || !confirm("Xóa sản phẩm khỏi đơn?")) return;
    setError(null);
    try {
      await activityDetailsApi.delete(activity.id, productId);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    }
  }

  async function confirmOrder() {
    if (!activity) return;
    setSaving(true);
    setError(null);
    try {
      await activitiesApi.confirm(activity.id);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xác nhận đơn thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function advanceStatus() {
    if (!activity) return;
    setSaving(true);
    setError(null);
    try {
      await activitiesApi.advanceStatus(activity.id);
      await load();
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chuyển trạng thái thất bại",
      );
    } finally {
      setSaving(false);
    }
  }

  const orderTotal = details.reduce((sum, d) => sum + d.lineTotal, 0);
  const userName =
    users.find((u) => u.id === activity?.userId)?.fullname ?? "—";
  const customerName =
    customers.find((c) => c.id === activity?.customerId)?.companyName ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết hoạt động #{activityId}</DialogTitle>
        </DialogHeader>

        {loading || !activity ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <div className="space-y-6">
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <section className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{statusLabel}</Badge>
                {activity.invoiceId ? (
                  <Badge variant="outline">Hóa đơn #{activity.invoiceId}</Badge>
                ) : (
                  <Badge variant="secondary">Chưa có hóa đơn</Badge>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nhân viên</p>
                  {isDraft ? (
                    <Select
                      value={headerForm.userId}
                      onValueChange={(v) =>
                        setHeaderForm((f) => ({ ...f, userId: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.fullname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{userName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Khách hàng</p>
                  {isDraft ? (
                    <Select
                      value={headerForm.customerId}
                      onValueChange={(v) =>
                        setHeaderForm((f) => ({ ...f, customerId: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium">{customerName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày hoạt động</p>
                  {isDraft ? (
                    <Input
                      type="datetime-local"
                      value={headerForm.activityDate}
                      onChange={(e) =>
                        setHeaderForm((f) => ({
                          ...f,
                          activityDate: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{formatDate(activity.activityDate)}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nội dung</p>
                  {isDraft ? (
                    <Input
                      value={headerForm.content}
                      onChange={(e) =>
                        setHeaderForm((f) => ({ ...f, content: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{activity.content}</p>
                  )}
                </div>
              </div>
              {isDraft && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void saveHeader()}
                >
                  Lưu thông tin hoạt động
                </Button>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Chi tiết đơn hàng</h3>

              {isDraft && (
                <form
                  className="grid gap-3 rounded-lg border p-4"
                  onSubmit={(e) => void saveLine(e)}
                >
                  <p className="text-sm font-medium">
                    {editingProductId !== null
                      ? "Sửa sản phẩm"
                      : "Thêm sản phẩm"}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label>Sản phẩm</Label>
                      <Select
                        value={lineForm.productId}
                        onValueChange={onProductChange}
                        disabled={editingProductId !== null}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.productName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Số lượng</Label>
                      <Input
                        type="number"
                        min={1}
                        required
                        value={lineForm.quantity}
                        onChange={(e) =>
                          setLineForm((f) => ({
                            ...f,
                            quantity: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Giá bán</Label>
                      <Input
                        type="number"
                        min={0}
                        required
                        value={lineForm.salePrice}
                        onChange={(e) =>
                          setLineForm((f) => ({
                            ...f,
                            salePrice: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      <Plus className="h-4 w-4" />
                      {editingProductId !== null ? "Cập nhật" : "Thêm"}
                    </Button>
                    {editingProductId !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProductId(null);
                          setLineForm(emptyLineForm);
                        }}
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </form>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Giá gốc</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>SL</TableHead>
                    <TableHead>Thành tiền</TableHead>
                    {isDraft && (
                      <TableHead className="text-right">Thao tác</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isDraft ? 6 : 5}
                        className="text-center text-muted-foreground"
                      >
                        Chưa có sản phẩm
                      </TableCell>
                    </TableRow>
                  ) : (
                    details.map((d) => (
                      <TableRow key={d.productId}>
                        <TableCell>{d.productName}</TableCell>
                        <TableCell>{formatMoney(d.unitPrice)}</TableCell>
                        <TableCell>{formatMoney(d.salePrice)}</TableCell>
                        <TableCell>{d.quantity}</TableCell>
                        <TableCell>{formatMoney(d.lineTotal)}</TableCell>
                        {isDraft && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProductId(d.productId);
                                setLineForm({
                                  productId: String(d.productId),
                                  quantity: String(d.quantity),
                                  salePrice: String(d.salePrice),
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void deleteLine(d.productId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <p className="text-right text-sm font-semibold">
                Tổng tạm tính: {formatMoney(orderTotal)} đ
              </p>
            </section>

            <section className="flex flex-wrap gap-2 border-t pt-4">
              {isDraft && (
                <Button disabled={saving} onClick={() => void confirmOrder()}>
                  Xác nhận đơn (tạo hóa đơn)
                </Button>
              )}
              {activity.status !== "draft" &&
                nextStatus &&
                !currentStatus?.isTerminal && (
                  <Button
                    variant="secondary"
                    disabled={saving}
                    onClick={() => void advanceStatus()}
                  >
                    Chuyển sang: {nextStatus.statusName}
                  </Button>
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load()}
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </Button>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
