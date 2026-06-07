"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Or 'react-router-dom' depending on your framework
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Explicitly define states for the UI state machine
type VerificationState = "LOADING" | "SUCCESS" | "ERROR";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract token parameter from the route URL configuration (?token=abc...)
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationState>("LOADING");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function triggerVerification() {
      // Guard Clause: If link contains no token parameter metadata, instantly fail early
      if (!token) {
        setStatus("ERROR");
        setErrorMessage("Mã xác thực không hợp lệ hoặc đã bị chỉnh sửa.");
        return;
      }

      try {
        // Dispatch the code string token over to the Backend API route architecture
        // This triggers the Redis extraction and official Database creation
        await authApi.verifyEmail(token);
        
        // If the request is successful, advance the UI status layout
        setStatus("SUCCESS");
      } catch (err: any) {
        // Parse actual custom thrown RouteError messages payload from the backend layer
        setStatus("ERROR");
        setErrorMessage(
          err?.response?.data?.message || 
          err?.message || 
          "Đường dẫn đã hết hạn hoặc tài khoản này đã được xác thực trước đó."
        );
      }
    }

    triggerVerification();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none p-6 text-center transition-all duration-300">
        
        {/* 1. LOADING STATE - Waiting for API backend and Redis layer processing */}
        {status === "LOADING" && (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            </div>
            <CardHeader className="p-0">
              <CardTitle className="text-xl font-bold text-slate-800">Đang xác thực tài khoản</CardTitle>
              <CardDescription className="text-sm mt-1">
                Vui lòng đợi trong giây lát khi chúng tôi xử lý dữ liệu kích hoạt hệ thống...
              </CardDescription>
            </CardHeader>
          </div>
        )}

        {/* 2. SUCCESS STATE - Token extracted cleanly from Redis and inserted into Database */}
        {status === "SUCCESS" && (
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-100 p-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <CardHeader className="p-0">
              <CardTitle className="text-2xl font-bold text-emerald-800">Kích hoạt thành công!</CardTitle>
              <CardDescription className="text-base mt-2 text-slate-600">
                Tài khoản của bạn đã được ghi nhận chính thức. Bây giờ bạn có thể đăng nhập vào hệ thống làm việc.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2"
              >
                Đi tới Đăng nhập <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        )}

        {/* 3. ERROR STATE - Token expired in Redis (over 1 hour) or completely missing */}
        {status === "ERROR" && (
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-rose-100 p-3">
                <XCircle className="h-10 w-10 text-rose-600" />
              </div>
            </div>
            <CardHeader className="p-0">
              <CardTitle className="text-2xl font-bold text-rose-800">Xác thực thất bại</CardTitle>
              {/* Dynamic backend error injection rendering slot */}
              <CardDescription className="text-sm mt-3 bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg font-medium">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-2">
              <Button 
                onClick={() => router.push("/signup")} 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-xl"
              >
                Quay lại trang Đăng ký
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push("/support")}
                className="w-full text-slate-500 hover:text-slate-700 text-xs font-normal"
              >
                Liên hệ đội ngũ hỗ trợ kỹ thuật
              </Button>
            </CardContent>
          </div>
        )}

      </Card>
    </div>
  );
}