"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, RefreshCw, Trash2, X } from "lucide-react";

import { ImportDetailDialog } from "@/components/imports/import-detail-dialog";
import { importsApi, lookupApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ImportView, Supplier } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function importDateKey(value: string) {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function matchesDateFilter(importDate: string, from: string, to: string) {
  if (!from && !to) return true;
  const key = importDateKey(importDate);
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

export function ImportsPanel() {
  const { isAdmin } = useAuth();
  const [imports, setImports] = useState<ImportView[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filteredImports = useMemo(
    () =>
      imports.filter((record) =>
        matchesDateFilter(record.importDate, filterFrom, filterTo),
      ),
    [imports, filterFrom, filterTo],
  );

  const filterKey = `${filterFrom}|${filterTo}`;

  const {
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems: paginatedImports,
  } = usePagination(filteredImports, undefined, filterKey);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [importList, supplierList] = await Promise.all([
        importsApi.getAll(),
        lookupApi.suppliers(),
      ]);
      setImports(importList);
      setSuppliers(supplierList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openDetail(record: ImportView) {
    setCreateMode(false);
    setSelectedId(record.id);
    setDetailOpen(true);
  }

  function openCreate() {
    setSelectedId(null);
    setCreateMode(true);
    setDetailOpen(true);
  }

  function clearFilters() {
    setFilterFrom("");
    setFilterTo("");
  }

  const hasActiveFilters = filterFrom !== "" || filterTo !== "";

  async function handleDelete(id: number) {
    if (
      !confirm(
        "Xóa phiếu nhập này? Tồn kho sẽ được hoàn lại theo các dòng đã nhập.",
      )
    ) {
      return;
    }
    setError(null);
    try {
      await importsApi.delete(id);
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
                {filteredImports.length}
                {hasActiveFilters ? " kết quả" : " phiếu"}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
              Tải lại
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Tạo phiếu nhập
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 px-3 py-2">
          <Input
            id="import-filter-from"
            type="date"
            title="Lọc từ ngày"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="h-8 w-[140px] bg-background text-xs"
          />
          <Input
            id="import-filter-to"
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
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : imports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có phiếu nhập.</p>
        ) : filteredImports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Không có kết quả phù hợp.
          </p>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Ngày nhập</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Số dòng</TableHead>
                <TableHead>Tổng giá trị</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedImports.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.id}</TableCell>
                  <TableCell>
                    {record.supplierName ?? `#${record.supplierId}`}
                  </TableCell>
                  <TableCell>{formatDate(record.importDate)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {record.content}
                  </TableCell>
                  <TableCell>{record.lineCount ?? 0}</TableCell>
                  <TableCell>
                    {formatMoney(record.totalAmount ?? 0)} đ
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Mở chi tiết"
                      onClick={() => openDetail(record)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      <ImportDetailDialog
        importId={selectedId}
        createMode={createMode}
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
        suppliers={suppliers}
        canManage={isAdmin}
      />
    </Card>
  );
}
