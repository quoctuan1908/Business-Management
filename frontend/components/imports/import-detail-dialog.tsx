"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { importDetailsApi, importsApi, lookupApi } from "@/lib/api";
import type { Import, ImportDetail, ImportWrite, Product, Supplier } from "@/lib/types";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ImportDetailDialogProps = {
  importId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
  suppliers: Supplier[];
  /** Mở dialog tạo mới — nhập header và chi tiết trong cùng một màn hình */
  createMode?: boolean;
  onCreated?: (id: number) => void;
  canManage?: boolean;
};

const emptyLineForm = {
  productId: "",
  quantity: "1",
  importPrice: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function buildDraftImport(): Import {
  const now = new Date().toISOString();
  return {
    id: 0,
    supplierId: 0,
    importDate: now,
    content: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function ImportDetailDialog({
  importId,
  open,
  onOpenChange,
  onChanged,
  suppliers,
  createMode = false,
  onCreated,
  canManage = false,
}: ImportDetailDialogProps) {
  const [resolvedImportId, setResolvedImportId] = useState<number | null>(null);
  const effectiveImportId = importId ?? resolvedImportId;
  const [importRecord, setImportRecord] = useState<Import | null>(null);
  const [details, setDetails] = useState<ImportDetail[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lineForm, setLineForm] = useState(emptyLineForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [headerForm, setHeaderForm] = useState({
    supplierId: "",
    content: "",
  });

  const load = useCallback(
    async (overrideId?: number) => {
      const id = overrideId ?? effectiveImportId;
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [record, detailList, productList] = await Promise.all([
          importsApi.getOne(id),
          importDetailsApi.getByImport(id),
          lookupApi.products(),
        ]);
        setImportRecord(record);
        setDetails(detailList);
        setProducts(productList);
        setHeaderForm({
          supplierId: String(record.supplierId),
          content: record.content,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    [effectiveImportId],
  );

  const initCreateMode = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const productList = await lookupApi.products();
      setImportRecord(buildDraftImport());
      setDetails([]);
      setProducts(productList);
      setHeaderForm({
        supplierId: "",
        content: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setResolvedImportId(null);
      return;
    }
    setLineForm(emptyLineForm);
    setEditingProductId(null);

    if (createMode && !importId) {
      void initCreateMode();
      return;
    }
    if (effectiveImportId) {
      void load();
    }
  }, [open, importId, createMode, effectiveImportId, load, initCreateMode]);

  function validateHeaderForCreate() {
    if (!headerForm.supplierId) {
      throw new Error("Vui lòng chọn nhà cung cấp");
    }
    if (!headerForm.content.trim()) {
      throw new Error("Vui lòng nhập nội dung");
    }
  }

  async function ensureImportCreated(): Promise<Import> {
    if (importRecord && importRecord.id > 0) {
      return importRecord;
    }
    validateHeaderForCreate();
    const payload: ImportWrite = {
      supplierId: Number(headerForm.supplierId),
      content: headerForm.content.trim(),
    };
    const created = await importsApi.add(payload);
    setImportRecord(created);
    setResolvedImportId(created.id);
    onCreated?.(created.id);
    onChanged();
    return created;
  }

  async function saveHeader() {
    if (!importRecord) return;
    setSaving(true);
    setError(null);
    try {
      if (importRecord.id === 0) {
        await ensureImportCreated();
        return;
      }
      const updated = await importsApi.update(importRecord.id, {
        supplierId: Number(headerForm.supplierId),
        content: headerForm.content,
      });
      setImportRecord(updated);
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
      importPrice: product ? String(product.unitPrice) : f.importPrice,
    }));
  }

  async function saveLine(e: React.FormEvent) {
    e.preventDefault();
    if (!importRecord) return;
    setSaving(true);
    setError(null);
    try {
      const record = await ensureImportCreated();
      const payload = {
        importId: record.id,
        productId: Number(lineForm.productId),
        quantity: Number(lineForm.quantity),
        importPrice: Number(lineForm.importPrice),
      };
      if (editingProductId !== null) {
        await importDetailsApi.update(payload);
      } else {
        await importDetailsApi.add(payload);
      }
      setLineForm(emptyLineForm);
      setEditingProductId(null);
      await load(record.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu dòng hàng thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLine(productId: number) {
    if (
      !importRecord ||
      importRecord.id === 0 ||
      !confirm("Xóa sản phẩm khỏi phiếu nhập? Tồn kho sẽ giảm tương ứng.")
    ) {
      return;
    }
    setError(null);
    try {
      await importDetailsApi.delete(importRecord.id, productId);
      await load(importRecord.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    }
  }

  const orderTotal = details.reduce((sum, d) => sum + d.lineTotal, 0);
  const supplierName =
    suppliers.find((s) => s.id === importRecord?.supplierId)?.supplierName ??
    "—";

  const usedProductIds = new Set(details.map((d) => d.productId));
  const availableProducts = products.filter(
    (p) => editingProductId === p.id || !usedProductIds.has(p.id),
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        value: String(s.id),
        label: s.supplierName,
        keywords: `${s.businessType} ${s.address} ${s.phoneNumber} ${s.email}`,
      })),
    [suppliers],
  );

  const productOptions = useMemo(
    () =>
      availableProducts.map((p) => ({
        value: String(p.id),
        label: `${p.productName} (TK: ${p.stockQuantity})`,
        keywords: `${p.unitPrice} ${p.stockQuantity}`,
      })),
    [availableProducts],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {createMode && importRecord?.id === 0
              ? "Tạo phiếu nhập mới"
              : `Chi tiết phiếu nhập #${effectiveImportId ?? importId}`}
          </DialogTitle>
        </DialogHeader>

        {loading || !importRecord ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : (
          <div className="space-y-6">
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <section className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Thông tin phiếu</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nhà cung cấp</p>
                  {canManage ? (
                    <SearchableSelect
                      options={supplierOptions}
                      value={headerForm.supplierId}
                      onValueChange={(v) =>
                        setHeaderForm((f) => ({ ...f, supplierId: v }))
                      }
                      placeholder="Chọn nhà cung cấp"
                      searchPlaceholder="Tìm theo tên, SĐT, email, địa chỉ..."
                    />
                  ) : (
                    <p className="text-sm font-medium">{supplierName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p className="text-sm">
                    {importRecord.id > 0
                      ? formatDate(importRecord.importDate)
                      : "—"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Nội dung</p>
                  {canManage ? (
                    <Input
                      value={headerForm.content}
                      onChange={(e) =>
                        setHeaderForm((f) => ({ ...f, content: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{importRecord.content}</p>
                  )}
                </div>
              </div>
              {canManage && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => void saveHeader()}
                  >
                    {importRecord.id === 0
                      ? "Lưu phiếu nhập"
                      : "Lưu thông tin phiếu"}
                  </Button>
                  {importRecord.id === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Chọn nhà cung cấp và nội dung trước khi thêm sản phẩm, hoặc
                      nhấn &quot;Lưu phiếu nhập&quot; để tạo phiếu.
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Chi tiết nhập hàng</h3>

              {canManage && (
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
                      <SearchableSelect
                        options={productOptions}
                        value={lineForm.productId}
                        onValueChange={onProductChange}
                        disabled={editingProductId !== null}
                        placeholder="Chọn sản phẩm"
                        searchPlaceholder="Tìm theo tên sản phẩm..."
                      />
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
                      <Label>Giá nhập</Label>
                      <Input
                        type="number"
                        min={0}
                        required
                        value={lineForm.importPrice}
                        onChange={(e) =>
                          setLineForm((f) => ({
                            ...f,
                            importPrice: e.target.value,
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
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Giá nhập</TableHead>
                    <TableHead>SL</TableHead>
                    <TableHead>Thành tiền</TableHead>
                    {canManage && (
                      <TableHead className="text-right">Thao tác</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canManage ? 6 : 5}
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
                        <TableCell>{formatMoney(d.importPrice)}</TableCell>
                        <TableCell>{d.quantity}</TableCell>
                        <TableCell>{formatMoney(d.lineTotal)}</TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProductId(d.productId);
                                setLineForm({
                                  productId: String(d.productId),
                                  quantity: String(d.quantity),
                                  importPrice: String(d.importPrice),
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
                Tổng giá trị nhập: {formatMoney(orderTotal)} đ
              </p>
              {canManage && (
                <p className="text-xs text-muted-foreground">
                  Thêm hoặc sửa dòng sẽ cập nhật tồn kho sản phẩm tự động.
                </p>
              )}
            </section>

            {effectiveImportId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void load()}
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
