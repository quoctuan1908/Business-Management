"use client";



import { useCallback, useEffect, useState } from "react";

import { Eye, Plus, RefreshCw, Trash2 } from "lucide-react";



import { ActivityDetailDialog } from "@/components/activities/activity-detail-dialog";

import { activitiesApi, lookupApi, orderStatusesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

import type { Activity, ActivityWrite, Customer, User } from "@/lib/types";

import { Badge } from "@/components/ui/badge";

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



const emptyCreateForm = {

  userId: "",

  customerId: "",

  activityDate: new Date().toISOString().slice(0, 16),

  content: "",

};



function formatDate(value: string) {

  return new Date(value).toLocaleString("vi-VN");

}



export function ActivitiesPanel() {
  const { user, isAdmin } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState(emptyCreateForm);



  const load = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const [activityList, customerList, statuses] = await Promise.all([
        activitiesApi.getAll(),
        lookupApi.customers(),
        orderStatusesApi.getAll(),
      ]);

      const userList = isAdmin
        ? await lookupApi.users()
        : [];

      setActivities(activityList);

      setUsers(userList);

      setCustomers(customerList);

      setStatusMap(

        Object.fromEntries(

          statuses.map((s) => [s.statusCode, s.statusName]),

        ),

      );

    } catch (e) {

      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");

    } finally {

      setLoading(false);

    }

  }, [isAdmin]);



  useEffect(() => {

    void load();

  }, [load]);



  function openDetail(activity: Activity) {

    setSelectedId(activity.id);

    setDetailOpen(true);

  }



  async function handleCreate(e: React.FormEvent) {

    e.preventDefault();

    setSaving(true);

    setError(null);

    try {

      const payload: ActivityWrite = {
        userId: isAdmin
          ? Number(createForm.userId)
          : (user?.userId ?? Number(createForm.userId)),

        customerId: Number(createForm.customerId),

        activityDate: new Date(createForm.activityDate).toISOString(),

        content: createForm.content,

      };

      const created = await activitiesApi.add(payload);

      setCreateOpen(false);

      setCreateForm(emptyCreateForm);

      await load();

      setSelectedId(created.id);

      setDetailOpen(true);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Tạo hoạt động thất bại");

    } finally {

      setSaving(false);

    }

  }



  async function handleDelete(id: number) {

    if (!confirm("Xóa hoạt động này?")) return;

    setError(null);

    try {

      await activitiesApi.delete(id);

      await load();

    } catch (err) {

      setError(err instanceof Error ? err.message : "Xóa thất bại");

    }

  }



  return (

    <Card>

      <CardHeader className="flex flex-row items-center justify-between space-y-0">

        <CardTitle>Hoạt động</CardTitle>

        <div className="flex gap-2">

          <Button variant="outline" size="sm" onClick={() => void load()}>

            <RefreshCw className="h-4 w-4" />

            Tải lại

          </Button>

          <Button

            size="sm"

            onClick={() => {
              setCreateForm({
                ...emptyCreateForm,
                userId: user?.userId ? String(user.userId) : "",
              });
              setCreateOpen(true);
            }}

          >

            <Plus className="h-4 w-4" />

            Thêm hoạt động

          </Button>

        </div>

      </CardHeader>

      <CardContent>

        {error && (

          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">

            {error}

          </p>

        )}

        {loading ? (

          <p className="text-sm text-muted-foreground">Đang tải...</p>

        ) : (

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>ID</TableHead>

                <TableHead>Khách hàng</TableHead>

                <TableHead>Hóa đơn</TableHead>

                <TableHead>Trạng thái</TableHead>

                <TableHead>Ngày</TableHead>

                <TableHead>Nội dung</TableHead>

                <TableHead className="text-right">Thao tác</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {activities.map((activity) => (

                <TableRow key={activity.id}>

                  <TableCell>{activity.id}</TableCell>

                  <TableCell>{activity.customerId}</TableCell>

                  <TableCell>

                    {activity.invoiceId ? `#${activity.invoiceId}` : "—"}

                  </TableCell>

                  <TableCell>

                    <Badge variant="outline">

                      {statusMap[activity.status] ?? activity.status}

                    </Badge>

                  </TableCell>

                  <TableCell>{formatDate(activity.activityDate)}</TableCell>

                  <TableCell className="max-w-[200px] truncate">

                    {activity.content}

                  </TableCell>

                  <TableCell className="text-right">

                    <Button

                      variant="ghost"

                      size="sm"

                      title="Mở chi tiết"

                      onClick={() => openDetail(activity)}

                    >

                      <Eye className="h-4 w-4" />

                    </Button>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(activity.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        )}

      </CardContent>



      <Dialog open={createOpen} onOpenChange={setCreateOpen}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Tạo hoạt động mới</DialogTitle>

          </DialogHeader>

          <form className="grid gap-4" onSubmit={(e) => void handleCreate(e)}>

            {isAdmin ? (
              <div className="grid gap-2">
                <Label>Nhân viên</Label>
                <Select
                  value={createForm.userId}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, userId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Đơn được gán cho: <span className="font-medium">{user?.username}</span>
              </p>
            )}

            <div className="grid gap-2">

              <Label>Khách hàng</Label>

              <Select

                value={createForm.customerId}

                onValueChange={(v) =>

                  setCreateForm((f) => ({ ...f, customerId: v }))

                }

              >

                <SelectTrigger>

                  <SelectValue placeholder="Chọn khách hàng" />

                </SelectTrigger>

                <SelectContent>

                  {customers.map((c) => (

                    <SelectItem key={c.id} value={String(c.id)}>

                      {c.companyName}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

            <div className="grid gap-2">

              <Label>Ngày hoạt động</Label>

              <Input

                type="datetime-local"

                required

                value={createForm.activityDate}

                onChange={(e) =>

                  setCreateForm((f) => ({

                    ...f,

                    activityDate: e.target.value,

                  }))

                }

              />

            </div>

            <div className="grid gap-2">

              <Label>Nội dung</Label>

              <Input

                required

                value={createForm.content}

                onChange={(e) =>

                  setCreateForm((f) => ({ ...f, content: e.target.value }))

                }

              />

            </div>

            <Button type="submit" disabled={saving}>

              {saving ? "Đang tạo..." : "Tạo và mở chi tiết"}

            </Button>

          </form>

        </DialogContent>

      </Dialog>



      <ActivityDetailDialog

        activityId={selectedId}

        open={detailOpen}

        onOpenChange={setDetailOpen}

        onChanged={() => void load()}

        users={users}

        customers={customers}

        canManageOrder={isAdmin}

      />

    </Card>

  );

}

