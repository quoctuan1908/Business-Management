"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { CustomerDetailDialog } from "@/components/customers/customer-detail-dialog";
import { customersApi, locationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Customer, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const emptyForm = {
  id: 0,
  locationId: "",
  companyName: "",
  businessType: "",
  representativeName: "",
  position: "",
  phoneNumber: "",
  currentBalance: "",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function locationLabel(loc: Location) {
  return `${loc.ward}, ${loc.province}`;
}

export function CustomersPanel() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const locationMap = Object.fromEntries(
    locations.map((l) => [l.id, locationLabel(l)]),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customerList, locationList] = await Promise.all([
        customersApi.getAll(),
        locationsApi.getAll(),
      ]);
      setCustomers(customerList);
      setLocations(locationList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm({
      ...emptyForm,
      locationId: locations[0] ? String(locations[0].id) : "",
    });
    setDialogOpen(true);
  }

  function openDetail(customer: Customer) {
    setDetailCustomerId(customer.id);
    setDetailOpen(true);
  }

  function openEdit(customer: Customer) {
    setForm({
      id: customer.id,
      locationId: String(customer.locationId),
      companyName: customer.companyName,
      businessType: customer.businessType,
      representativeName: customer.representativeName,
      position: customer.position,
      phoneNumber: customer.phoneNumber,
      currentBalance: String(customer.currentBalance),
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: form.id,
        locationId: Number(form.locationId),
        companyName: form.companyName,
        businessType: form.businessType,
        representativeName: form.representativeName,
        position: form.position,
        phoneNumber: form.phoneNumber,
        currentBalance: Number(form.currentBalance),
      };
      if (form.id === 0) {
        const { id: _id, ...createPayload } = payload;
        await customersApi.add(createPayload);
      } else {
        await customersApi.update(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa khách hàng này?")) return;
    setError(null);
    try {
      await customersApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Khách hàng</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              onClick={openCreate}
              disabled={locations.length === 0}
            >
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {locations.length === 0 && !loading && (
          <p className="mb-4 text-sm text-amber-700">
            Chưa có địa điểm. Hãy đồng bộ hoặc thêm location trước khi tạo
            khách hàng.
          </p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có khách hàng.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Công ty</TableHead>
                <TableHead>Loại hình</TableHead>
                <TableHead>Người đại diện</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Số dư</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => openDetail(customer)}
                    >
                      {customer.companyName}
                    </button>
                  </TableCell>
                  <TableCell>{customer.businessType}</TableCell>
                  <TableCell>
                    {customer.representativeName}
                    <span className="block text-xs text-muted-foreground">
                      {customer.position}
                    </span>
                  </TableCell>
                  <TableCell>{customer.phoneNumber}</TableCell>
                  <TableCell>{formatMoney(customer.currentBalance)}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">
                    {locationMap[customer.locationId] ?? customer.locationId}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Xem chi tiết"
                      onClick={() => openDetail(customer)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Sửa"
                          onClick={() => openEdit(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CustomerDetailDialog
        customerId={detailCustomerId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canManageAccount={isAdmin}
        onAccountUpdated={() => void load()}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id === 0 ? "Thêm khách hàng" : "Sửa khách hàng"}
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid gap-2">
              <Label>Địa điểm</Label>
              <Select
                value={form.locationId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, locationId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn địa điểm" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {locationLabel(loc)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyName">Tên công ty</Label>
              <Input
                id="companyName"
                required
                value={form.companyName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessType">Loại hình kinh doanh</Label>
              <Input
                id="businessType"
                required
                value={form.businessType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, businessType: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="representativeName">Người đại diện</Label>
                <Input
                  id="representativeName"
                  required
                  value={form.representativeName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      representativeName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Chức vụ</Label>
                <Input
                  id="position"
                  required
                  value={form.position}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, position: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  required
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentBalance">Số dư hiện tại</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  required
                  value={form.currentBalance}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentBalance: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button type="submit" disabled={saving || !form.locationId}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
