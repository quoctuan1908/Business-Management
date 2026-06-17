"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Plus, RefreshCw, Trash2, Check, Map } from "lucide-react";

import { CustomerDetailDialog } from "@/components/customers/customer-detail-dialog";
import { customersApi, locationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Customer, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { FieldScanDialog } from "./customer-scan-dialog";

const emptyForm = {
  id: 0,
  locationId: "",
  companyName: "",
  businessType: "",
  representativeName: "",
  position: "",
  phoneNumber: "",
  currentBalance: "",
  lat: "",
  lng: "",
  isApproved: true,
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
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const {
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedCustomers,
  } = usePagination(customers);

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
      let pendingCustomers: Customer[] = [];
      if(isAdmin)
        pendingCustomers = await customersApi.getPendingApproval(); 

      setCustomers([...pendingCustomers, ...customerList]);
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

  const handleSelectFieldData = (data: {
    companyName: string;
    businessType: string;
    lat: string;
    lng: string;
    phoneNumber: string;
  }) => {
    setForm({
      id: 0,
      locationId: locations[0] ? String(locations[0].id) : "",
      companyName: data.companyName,
      businessType: data.businessType,
      representativeName: "",
      position: "Chủ cửa hàng",
      phoneNumber: data.phoneNumber,
      currentBalance: "0",
      lat: data.lat,
      lng: data.lng,
      isApproved: false,
    });
    setDialogOpen(true);
  };

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
      lat: customer.lat ? String(customer.lat) : "",
      lng: customer.lng ? String(customer.lng) : "",
      isApproved: customer.isApproved ?? true,
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
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        isApproved: isAdmin ? form.isApproved : false,
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

  async function handleApprove(id: number) {
    if (!confirm("Phê duyệt hoạt động chính thức cho đại lý này?")) return;
    setError(null);
    try {
      await customersApi.approve(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Phê duyệt thất bại");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setMapDialogOpen(true)}
            className="border-indigo-200 hover:bg-indigo-50 text-indigo-700 gap-1.5 font-medium shadow-sm"
          >
            <Map className="h-4 w-4" />
            Bản đồ thực địa
          </Button>

          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </Button>

          <Button
            size="sm"
            onClick={openCreate}
            disabled={locations.length === 0}
          >
            <Plus className="h-4 w-4" />
            Thêm bằng tay
          </Button>
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
            Chưa có địa điểm. Hãy đồng bộ hoặc thêm location trước khi tạo khách hàng.
          </p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có khách hàng.</p>
        ) : (
          <>
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
                <TableHead>Tọa độ</TableHead>
                {/* Chỉ hiển thị tiêu đề cột Trạng thái nếu là Admin */}
                {isAdmin && <TableHead>Trạng thái</TableHead>}
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
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
                  <TableCell className="max-w-[140px] truncate text-sm">
                    {locationMap[customer.locationId] ?? customer.locationId}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {customer.lat && customer.lng ? (
                      <span>{customer.lat}, {customer.lng}</span>
                    ) : (
                      <span className="text-muted-foreground/50">---</span>
                    )}
                  </TableCell>
                  {/* Chỉ render ô dữ liệu Trạng thái nếu là Admin */}
                  {isAdmin && (
                    <TableCell>
                      {customer.isApproved ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          Chờ duyệt
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right whitespace-nowrap">
                    {isAdmin && !customer.isApproved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Phê duyệt"
                        onClick={() => void handleApprove(customer.id)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
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
                          title="Xóa"
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
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
          </>
        )}
      </CardContent>

      <CustomerDetailDialog
        customerId={detailCustomerId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canManageAccount={isAdmin}
        onAccountUpdated={() => void load()}
      />

      <FieldScanDialog
        open={mapDialogOpen}
        onOpenChange={setMapDialogOpen}
        onSelectStore={handleSelectFieldData}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id === 0 ? "Thêm khách hàng (Chờ duyệt)" : "Sửa khách hàng"}
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid gap-2">
              <Label>Địa điểm (Khu vực quản lý)</Label>
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
              <Label htmlFor="companyName">Tên công ty / Đại lý</Label>
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
            <div className="grid gap-2 optimiz-grid sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="representativeName">Người đại diện</Label>
                <Input
                  id="representativeName"
                  required
                  placeholder="Nhập tên người đại diện"
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
                  placeholder="Nhập số điện thoại liên hệ"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentBalance">Số dư ban đầu</Label>
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
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="lat">Vĩ độ (Latitude)</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  required
                  value={form.lat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lat: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lng">Kinh độ (Longitude)</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  required
                  value={form.lng}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lng: e.target.value }))
                  }
                />
              </div>
            </div>
            {isAdmin && form.id !== 0 && (
              <div className="flex items-center gap-2 py-2">
                <input
                  id="isApproved"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.isApproved}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isApproved: e.target.checked }))
                  }
                />
                <Label htmlFor="isApproved" className="cursor-pointer select-none">
                  Kích hoạt trạng thái Đã duyệt
                </Label>
              </div>
            )}
            <Button type="submit" disabled={saving || !form.locationId}>
              {saving ? "Đang lưu..." : "Gửi yêu cầu lưu khách hàng"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}