"use client";



import { useCallback, useEffect, useState } from "react";

import { Eye, FileDown, Plus, RefreshCw, Trash2 } from "lucide-react";

import { ActivityDetailDialog } from "@/components/activities/activity-detail-dialog";

import { activitiesApi, lookupApi, orderStatusesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

import type { Activity, Customer, User } from "@/lib/types";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



function formatDate(value: string) {

  return new Date(value).toLocaleString("vi-VN");

}



function defaultFromDate() {

  const now = new Date();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${now.getFullYear()}-${month}-01`;

}



function defaultToDate() {

  return new Date().toISOString().slice(0, 10);

}



export function ActivitiesPanel() {
  const { user, isAdmin } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [createMode, setCreateMode] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [exportFrom, setExportFrom] = useState(defaultFromDate);

  const [exportTo, setExportTo] = useState(defaultToDate);

  const [exporting, setExporting] = useState(false);



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

    setCreateMode(false);

    setSelectedId(activity.id);

    setDetailOpen(true);

  }



  function openCreate() {

    setSelectedId(null);

    setCreateMode(true);

    setDetailOpen(true);

  }



  async function handleExport() {

    if (!exportFrom || !exportTo) {

      setError("Vui lòng chọn khoảng ngày xuất");

      return;

    }

    if (exportTo < exportFrom) {

      setError("Ngày kết thúc không được trước ngày bắt đầu");

      return;

    }

    setExporting(true);

    setError(null);

    try {

      await activitiesApi.exportExcel(exportFrom, exportTo);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Xuất Excel thất bại");

    } finally {

      setExporting(false);

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

      <CardHeader className="space-y-4">

        <div className="flex flex-row items-center justify-between space-y-0">

          <CardTitle>Hoạt động</CardTitle>

          <div className="flex gap-2">

            <Button variant="outline" size="sm" onClick={() => void load()}>

              <RefreshCw className="h-4 w-4" />

              Tải lại

            </Button>

            <Button size="sm" onClick={openCreate}>

              <Plus className="h-4 w-4" />

              Thêm hoạt động

            </Button>

          </div>

        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3">

          <div className="space-y-1">

            <Label htmlFor="export-from">Từ ngày</Label>

            <Input

              id="export-from"

              type="date"

              value={exportFrom}

              onChange={(e) => setExportFrom(e.target.value)}

              className="w-[160px]"

            />

          </div>

          <div className="space-y-1">

            <Label htmlFor="export-to">Đến ngày</Label>

            <Input

              id="export-to"

              type="date"

              value={exportTo}

              min={exportFrom}

              onChange={(e) => setExportTo(e.target.value)}

              className="w-[160px]"

            />

          </div>

          <Button

            variant="secondary"

            size="sm"

            disabled={exporting}

            onClick={() => void handleExport()}

          >

            <FileDown className="h-4 w-4" />

            {exporting ? "Đang xuất..." : "Xuất Excel"}

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



      <ActivityDetailDialog

        activityId={selectedId}

        createMode={createMode}

        defaultUserId={user?.userId}

        open={detailOpen}

        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setCreateMode(false);
            setSelectedId(null);
          }
        }}

        onCreated={(id) => {
          setSelectedId(id);
          setCreateMode(false);
        }}

        onChanged={() => void load()}

        users={users}

        customers={customers}

        canManageOrder={isAdmin}

      />

    </Card>

  );

}

