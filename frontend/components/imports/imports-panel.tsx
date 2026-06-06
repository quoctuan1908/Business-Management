"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Plus, RefreshCw, Trash2 } from "lucide-react";

import { ImportDetailDialog } from "@/components/imports/import-detail-dialog";
import { importsApi, lookupApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ImportView, Supplier } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Nhập kho</CardTitle>
        <div className="flex gap-2">
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
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : imports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có phiếu nhập.</p>
        ) : (
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
              {imports.map((record) => (
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
