"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, DollarSign, User as UserIcon, Mail, Phone, Briefcase } from "lucide-react";

import { salariesApi, usersApi } from "@/lib/api";
import type { Salary, SalaryWithUser, User } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";

const emptyForm = {
  id: 0,
  userId: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  baseSalary: "0",
  commission: "0",
  bonus: "0",
  createdAt: String(new Date()),
  updatedAt: String(new Date())
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function SalariesPanel() {
  const [salaries, setSalaries] = useState<SalaryWithUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States Form 
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // States Pop-up 
  const [selectedUser, setSelectedUser] = useState<SalaryWithUser["user"] | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ salaries: salaryList }, userList] = await Promise.all([
        salariesApi.getAll(),
        usersApi.getAll(),
      ]);
      setSalaries(salaryList);
      setUsers(userList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
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
      userId: users[0] ? String(users[0].id) : "",
    });
    setDialogOpen(true);
  }

  function openEdit(salary: Salary) {
    setForm({
      id: salary.id,
      userId: String(salary.userId),
      month: String(salary.month),
      year: String(salary.year),
      baseSalary: String(salary.baseSalary),
      commission: String(salary.commission),
      bonus: String(salary.bonus),
      createdAt: String(salary.createdAt),
      updatedAt: String(salary.updatedAt)
    });
    setDialogOpen(true);
  }

  function showUserProfile(user: SalaryWithUser["user"]) {
    setSelectedUser(user);
    setUserModalOpen(true);
  }

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
        const now = new Date().toISOString();
        const numericFields = ["id", "userId", "month", "year", "baseSalary", "commission", "bonus"];
        const payload = Object.entries(form).reduce((acc, [key, val]) => {
        const isNumeric = numericFields.includes(key);
        return {
            ...acc,
            [key]: isNumeric ? Number(val || 0) : val
        };
        }, {} as any);

        payload.updatedAt = now;
        if (payload.id === 0) {
        payload.createdAt = now;
        await salariesApi.add(payload);
        } else {
        await salariesApi.update(payload);
        }

        setDialogOpen(false);
        await load();
    } catch (err: any) {
        setError(err.errors?.[0]?.info || err.message || "Save failed");
    } finally {
        setSaving(false);
    }
    }
  async function handleDelete(id: number) {
    if (!confirm("Xóa bản ghi lương này?")) return;
    try {
      await salariesApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <DollarSign className="h-6 w-6 text-green-600" />
          Quản lý lương
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Tải lại
          </Button>
          <Button size="sm" onClick={openCreate} disabled={users.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm lương
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Kỳ lương</TableHead>
                <TableHead>Lương cơ bản</TableHead>
                <TableHead>Hoa hồng</TableHead>
                <TableHead>Thưởng</TableHead>
                <TableHead>Tổng cộng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <button
                      onClick={() => showUserProfile(s.user)}
                      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                    >
                      {s.user?.fullName || s.user?.username || `User #${s.userId}`}
                    </button>
                    <span className="block text-xs text-muted-foreground italic">
                      @{s.user?.username}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{`${s.month}/${s.year}`}</TableCell>
                  <TableCell>{formatCurrency(s.baseSalary)}</TableCell>
                  <TableCell>{formatCurrency(s.commission)}</TableCell>
                  <TableCell>{formatCurrency(s.bonus)}</TableCell>
                  <TableCell className="font-bold text-green-700">
                    {formatCurrency(s.baseSalary + s.commission + s.bonus)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* DIALOG: FORM THÊM/SỬA LƯƠNG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id === 0 ? "Thêm bản ghi lương" : "Cập nhật lương"}
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(e) => void handleSubmit(e)}>
            {/* ... (Giữ nguyên các field cũ trong form) */}
            <div className="grid gap-2">
              <Label>Nhân viên</Label>
              <Select
                value={form.userId}
                onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.fullName || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* ... các field month, year, baseSalary, v.v ... */}
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="month">Tháng</Label>
                 <Input id="month" type="number" min="1" max="12" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="year">Năm</Label>
                 <Input id="year" type="number" min="2000" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
               </div>
            </div>
            <div className="grid gap-2">
               <Label htmlFor="baseSalary">Lương cơ bản</Label>
               <Input id="baseSalary" type="number" value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="commission">Hoa hồng</Label>
                 <Input id="commission" type="number" value={form.commission} onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="bonus">Thưởng</Label>
                 <Input id="bonus" type="number" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))} />
               </div>
            </div>

            <Button type="submit" disabled={saving || !form.userId} className="w-full">
              {saving ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: POP-UP THÔNG TIN CHI TIẾT USER */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Hồ sơ nhân viên
            </DialogTitle>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.fullName || selectedUser.username}</h3>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 border-t pt-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-0.5">
                    <p className="text-xs text-muted-foreground">Phòng ban</p>
                    <p className="text-sm font-medium">{selectedUser.department || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-0.5">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{selectedUser.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-0.5">
                    <p className="text-xs text-muted-foreground">Số điện thoại</p>
                    <p className="text-sm font-medium">{selectedUser.phoneNumber || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">Không tìm thấy thông tin nhân viên.</p>
          )}
          <Button onClick={() => setUserModalOpen(false)} variant="outline" className="w-full">
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}