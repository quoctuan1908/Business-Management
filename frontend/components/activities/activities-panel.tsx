"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import { Eye, FileDown, Plus, Printer, RefreshCw, Trash2, X } from "lucide-react";

import { ActivityDetailDialog } from "@/components/activities/activity-detail-dialog";

import { activitiesApi, activityDetailsApi, lookupApi, orderStatusesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  buildSalesInvoicePrintData,
  printSalesInvoice,
} from "@/lib/print-sales-invoice";

import type { Activity, Customer, OrderStatus, User } from "@/lib/types";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

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



function activityDateKey(value: string) {

  const d = new Date(value);

  const month = String(d.getMonth() + 1).padStart(2, "0");

  const day = String(d.getDate()).padStart(2, "0");

  return `${d.getFullYear()}-${month}-${day}`;

}



function matchesDateFilter(
  activityDate: string,
  from: string,
  to: string,
) {

  if (!from && !to) return true;

  const key = activityDateKey(activityDate);

  if (from && key < from) return false;

  if (to && key > to) return false;

  return true;

}



export function ActivitiesPanel() {
  const { user, isAdmin } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);

  const [filterStatus, setFilterStatus] = useState("all");

  const [filterFrom, setFilterFrom] = useState("");

  const [filterTo, setFilterTo] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [createMode, setCreateMode] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [exportFrom, setExportFrom] = useState(defaultFromDate);

  const [exportTo, setExportTo] = useState(defaultToDate);

  const [exporting, setExporting] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const statusMatch =
          filterStatus === "all" || activity.status === filterStatus;
        const dateMatch = matchesDateFilter(
          activity.activityDate,
          filterFrom,
          filterTo,
        );
        return statusMatch && dateMatch;
      }),
    [activities, filterStatus, filterFrom, filterTo],
  );

  const filterKey = `${filterStatus}|${filterFrom}|${filterTo}`;

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.fullName])),
    [users],
  );

  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.companyName])),
    [customers],
  );

  const customerById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c])),
    [customers],
  );

  const {
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedActivities,
  } = usePagination(filteredActivities, undefined, filterKey);



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

      setOrderStatuses(statuses);

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



  function clearFilters() {

    setFilterStatus("all");

    setFilterFrom("");

    setFilterTo("");

  }



  const hasActiveFilters =
    filterStatus !== "all" || filterFrom !== "" || filterTo !== "";



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



  async function handlePrint(activity: Activity) {
    if (!activity.invoiceId) return;

    setPrintingId(activity.id);
    setError(null);

    try {
      const [act, detailList] = await Promise.all([
        activitiesApi.getOne(activity.id),
        activityDetailsApi.getByActivity(activity.id),
      ]);

      const sellerName =
        userMap[act.userId] ??
        (user?.userId === act.userId ? user.username : `#${act.userId}`);

      printSalesInvoice(
        buildSalesInvoicePrintData({
          activity: act,
          details: detailList,
          customer: customerById[act.customerId],
          sellerName,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "In hóa đơn thất bại");
    } finally {
      setPrintingId(null);
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
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {!loading && (
              <>
                {filteredActivities.length}
                {hasActiveFilters ? " kết quả" : " mục"}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
              Tải lại
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 px-3 py-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger id="filter-status" className="h-8 w-[150px] bg-background text-xs">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {orderStatuses.map((status) => (
                <SelectItem key={status.statusCode} value={status.statusCode}>
                  {status.statusName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            id="filter-from"
            type="date"
            title="Lọc từ ngày"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="h-8 w-[140px] bg-background text-xs"
          />
          <Input
            id="filter-to"
            type="date"
            title="Lọc đến ngày"
            value={filterTo}
            min={filterFrom || undefined}
            onChange={(e) => setFilterTo(e.target.value)}
            className="h-8 w-[140px] bg-background text-xs"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

          <Input
            id="export-from"
            type="date"
            title="Xuất từ ngày"
            value={exportFrom}
            onChange={(e) => setExportFrom(e.target.value)}
            className="h-8 w-[140px] bg-background text-xs"
          />
          <Input
            id="export-to"
            type="date"
            title="Xuất đến ngày"
            value={exportTo}
            min={exportFrom}
            onChange={(e) => setExportTo(e.target.value)}
            className="h-8 w-[140px] bg-background text-xs"
          />
          <Button
            variant="secondary"
            size="sm"
            className="h-8"
            disabled={exporting}
            onClick={() => void handleExport()}
          >
            <FileDown className="h-4 w-4" />
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {error && (
          <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
        ) : filteredActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Không có kết quả phù hợp.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="w-[90px]">Hóa đơn</TableHead>
                  <TableHead className="w-[120px]">Trạng thái</TableHead>
                  <TableHead className="w-[150px]">Ngày tạo</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="w-[120px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-muted-foreground">
                      {activity.id}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {customerMap[activity.customerId] ?? `#${activity.customerId}`}
                    </TableCell>
                    <TableCell>
                      {activity.invoiceId ? `#${activity.invoiceId}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {statusMap[activity.status] ?? activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(activity.activityDate)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm">
                      {activity.content}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Mở chi tiết"
                          onClick={() => openDetail(activity)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {activity.invoiceId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="In hóa đơn A5"
                            disabled={printingId === activity.id}
                            onClick={() => void handlePrint(activity)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {isAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xóa"
                            onClick={() => void handleDelete(activity.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
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

