"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  UserPlus, Search, Building2, Mail, Phone, 
  Trash2, Pencil, RefreshCw, UserCog,
  UserCheck, UserX, ClipboardCheck
} from "lucide-react";

import { usersApi } from "@/lib/api";
import { UserPublic, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/use-pagination";

const emptyUser: Partial<User> = {
  username: "",
  password: "",
  fullName: "",
  role: "employee",
  department: "",
  phoneNumber: "",
  email: "",
  isActivated: false, 
};

export function UsersPanel() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [unactivatedUsers, setUnactivatedUsers] = useState<UserPublic[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [activeData, unactiveData] = await Promise.all([
        usersApi.getAll(),
        usersApi.getAllUnactivated()
      ]);
      
      setUsers(activeData);
      setUnactivatedUsers(unactiveData);
    } catch (error) {
      console.error("Failed to load users data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        Object.values(user).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      ),
    [users, searchQuery],
  );

  const {
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedUsers,
  } = usePagination(filteredUsers, undefined, searchQuery);

  const openCreate = () => {
    setForm(emptyUser);
    setDialogOpen(true);
  };

  const openEdit = (user: UserPublic) => {
    setForm({
      ...user,
      password: "",
      role: user.role === "user" ? "employee" : user.role,
    });
    setDialogOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (form.id) {
        await usersApi.update(form);
      } else {
        await usersApi.add(form);
      }
      setDialogOpen(false);
      await loadUsers(); 
    } catch (error) {
      alert("Lỗi khi lưu thông tin nhân sự");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này? (Xóa mềm)")) return;
    try {
      await usersApi.delete(id);
      await loadUsers();
    } catch (error) {
      alert("Xóa thất bại");
    }
  }

  async function handleToggleActivation(user: UserPublic) {
    const nextStatus = !user.isActivated;
    const actionText = nextStatus ? "Kích hoạt" : "Hủy kích hoạt";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của nhân viên này?`)) return;

    try {
      await usersApi.update({
        ...user,
        password: "",
        isActivated: nextStatus
      });
      
      if (nextStatus) {
        setApprovalDialogOpen(false);
      }
      
      await loadUsers(); 
    } catch (error) {
      console.error(error);
      alert("Thay đổi trạng thái kích hoạt thất bại");
    }
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          Hệ thống Nhân sự
        </CardTitle>
        <div className="flex gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm nhân viên đã duyệt..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button 
            variant="outline" 
            onClick={() => setApprovalDialogOpen(true)}
            className="gap-2 relative border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-800"
          >
            <ClipboardCheck className="h-4 w-4" /> 
            Yêu cầu phê duyệt
            {unactivatedUsers.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground animate-bounce h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                {unactivatedUsers.length}
              </Badge>
            )}
          </Button>

          <Button onClick={openCreate} className="gap-2">
            <UserPlus className="h-4 w-4" /> Thêm nhân viên
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Mã NV</TableHead>
                  <TableHead className="font-bold">Họ và Tên</TableHead>
                  <TableHead className="font-bold">Phòng ban</TableHead>
                  <TableHead className="font-bold">Liên hệ</TableHead>
                  <TableHead className="font-bold">Vai trò</TableHead>
                  <TableHead className="font-bold">Trạng thái</TableHead>
                  <TableHead className="text-right font-bold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? paginatedUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">#{u.id}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{u.fullName}</div>
                      <div className="text-xs text-muted-foreground italic">@{u.username}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 px-2 py-1">
                        <Building2 className="h-3 w-3" /> {u.department || "Chưa gán"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" /> {u.email}</div>
                      <div className="text-sm flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" /> {u.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={u.role === "admin" ? "border-destructive text-destructive" : ""}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                        <UserCheck className="h-3 w-3" /> Đã duyệt
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => void handleToggleActivation(u)}
                          title="Hủy kích hoạt tài khoản"
                        >
                          <UserX className="h-4 w-4 text-amber-600" />
                        </Button>

                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(u.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Không tìm thấy nhân viên nào khả dụng.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </CardContent>

      {/* ==========================================================================
         THÊM: POP-UP (DIALOG) RIÊNG XỬ LÝ TÀI KHOẢN CHỜ PHÊ DUYỆT
         ========================================================================== */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-amber-700">
              <UserX className="h-5 w-5" />
              Danh sách tài khoản chờ duyệt kích hoạt ({unactivatedUsers.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto my-4 border rounded-md">
            <Table>
              <TableHeader className="bg-amber-50/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[80px]">Mã NV</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead className="text-right">Duyệt nhanh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unactivatedUsers.length > 0 ? (
                  unactivatedUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-amber-50/20">
                      <TableCell className="text-muted-foreground">#{u.id}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{u.fullName}</div>
                        <div className="text-xs text-muted-foreground">@{u.username}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{u.department || "Chưa gán"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.phoneNumber}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-8"
                          onClick={() => void handleToggleActivation(u)}
                        >
                          <UserCheck className="h-3 w-3" /> Kích hoạt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Hiện tại không có tài khoản nào chờ phê duyệt. 🎉
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Form: Shared giữa Tạo mới & Cập nhật nhân viên */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{form.id ? "Cập nhật thông tin" : "Tạo tài khoản nhân sự"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="fullName">Họ và tên nhân viên</Label>
                <Input id="fullName" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Nguyễn Văn A" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input id="username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={!!form.id} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{form.id ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}</Label>
                <Input id="password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!form.id} />
              </div>
              <div className="space-y-2">
                <Label>Phòng ban</Label>
                <Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Kỹ thuật, Nhân sự..." />
              </div>
              <div className="space-y-2">
                <Label>Quyền truy cập</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Nhân viên (Employee)</SelectItem>
                    <SelectItem value="admin">Quản trị (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} placeholder="090..." />
              </div>

              <div className="space-y-2 col-span-2 border-t pt-4 mt-2">
                <Label>Trạng thái phê duyệt tài khoản</Label>
                <Select 
                  value={String(form.isActivated)} 
                  onValueChange={v => setForm({...form, isActivated: v === "true"})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Chờ duyệt (Pending Access)</SelectItem>
                    <SelectItem value="true">Cho phép hoạt động (Active Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Xác nhận lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}