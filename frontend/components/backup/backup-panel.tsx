"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  Upload,
} from "lucide-react";

import { backupApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function BackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleBackup = useCallback(async () => {
    setBackingUp(true);
    setError(null);
    setSuccess(null);
    try {
      await backupApi.download();
      setSuccess("Đã tải xuống file sao lưu thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể sao lưu dữ liệu");
    } finally {
      setBackingUp(false);
    }
  }, []);

  const pickFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      setError("Vui lòng chọn file JSON backup (.json)");
      return;
    }
    setSelectedFile(file);
    setError(null);
    setSuccess(null);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      pickFile(event.dataTransfer.files?.[0] ?? null);
    },
    [pickFile],
  );

  const handleRestore = useCallback(async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn file backup trước khi phục hồi");
      return;
    }

    setRestoring(true);
    setError(null);
    setSuccess(null);
    setConfirmOpen(false);

    try {
      const text = await selectedFile.text();
      const backup = JSON.parse(text);
      const result = await backupApi.restore(backup);
      setSuccess(result.message);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể phục hồi dữ liệu",
      );
    } finally {
      setRestoring(false);
    }
  }, [selectedFile]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {(error || success) && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
            error
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700",
          )}
        >
          {error ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{error ?? success}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Sao lưu dữ liệu</CardTitle>
          </div>
          <CardDescription>
            Xuất toàn bộ dữ liệu hệ thống (Users, Customers, Activities,
            Payments, Imports...) ra file JSON để lưu trữ an toàn.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <FileJson className="h-8 w-8 shrink-0" />
            <p>
              File tải xuống có dạng{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                backup_seller_system_YYYY_MM_DD.json
              </code>
            </p>
          </div>
          <Button onClick={handleBackup} disabled={backingUp}>
            <Download className="h-4 w-4" />
            {backingUp ? "Đang sao lưu..." : "Sao lưu dữ liệu ngay"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <CardTitle>Phục hồi hệ thống</CardTitle>
          </div>
          <CardDescription>
            Nạp lại dữ liệu từ file backup khi gặp sự cố. Toàn bộ dữ liệu hiện
            tại sẽ bị thay thế trong một giao dịch database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Kéo-thả file backup vào đây</p>
              <p className="mt-1 text-sm text-muted-foreground">
                hoặc bấm để chọn file JSON từ máy tính
              </p>
            </div>
            {selectedFile && (
              <p className="rounded-md bg-muted px-3 py-1 text-sm font-medium">
                {selectedFile.name}
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            aria-label="Chọn file backup JSON"
            title="Chọn file backup JSON"
            className="hidden"
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Phục hồi sẽ xóa toàn bộ dữ liệu hiện tại trước khi nạp lại từ
              file backup.
            </p>
            <Button
              variant="destructive"
              disabled={!selectedFile || restoring}
              onClick={() => setConfirmOpen(true)}
            >
              {restoring ? "Đang phục hồi..." : "Bắt đầu phục hồi"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phục hồi dữ liệu</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu hiện tại sẽ bị
              xóa và thay bằng nội dung file{" "}
              <strong>{selectedFile?.name ?? "backup"}</strong>. Bạn có chắc
              chắn muốn tiếp tục?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleRestore}>
              Xác nhận phục hồi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
