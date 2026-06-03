"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  DollarSign,
  FileText,
  LogIn,
  LogOut,
  Package,
  Users,
  UserCog,
  LayoutDashboard
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { User } from "@/lib/types";

export type AppSection = "user-dashboard" | "products" | "customers" | "activities" | "invoices" | "salaries" | "users";

type NavItem = {
  id: AppSection;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const moduleNavItems: NavItem[] = [
  {
    id: "user-dashboard",
    label: "Thống kê cá nhân",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: "products",
    label: "Sản phẩm",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "customers",
    label: "Khách hàng",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "activities",
    label: "Hoạt động",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    id: "invoices",
    label: "Hóa đơn",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "users",
    label: "Nhân sự",
    icon: <UserCog className="h-4 w-4" />,
    adminOnly: true, // Restricted to admins
  },
  {
    id: "salaries",
    label: "Tiền lương",
    icon: <DollarSign className="h-4 w-4" />,
    adminOnly: true, // Restricted to admins
  }
];

type AppShellProps = {
  children: React.ReactNode;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
};

export function AppShell({
  children,
  activeSection,
  onSectionChange,
}: AppShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const data = await authApi.check();
        console.log(data);
        setUser(data.user);
        
        // Khởi tạo một biến local để tránh gọi trực tiếp activeSection từ bên ngoài vào
        if (data.user && data.user.role !== "admin") {
          onSectionChange("user-dashboard");
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sửa từ [onSectionChange] thành []

  const handleLoginClick = () => {
    router.push("/auth");
  };

  const handleLogoutClick = async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (isLoading) {
    return null;
  }

  // Filter sidebar menu items based on the logged-in user's role
  const allowedNavItems = moduleNavItems.filter(item => {
    //if (item.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="flex w-56 flex-col border-r bg-card">
        <div className="border-b px-4 py-5 flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Business Management
            </p>
            <h1 className="mt-1 text-lg font-semibold">Staff Portal</h1>
          </div>

          {!user ? (
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors w-fit"
              onClick={handleLoginClick}
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </button>
          ) : (
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors w-fit"
              onClick={handleLogoutClick}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất ({user.username})
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <div className="px-3 pb-1 text-xs font-medium uppercase text-muted-foreground">
            Module
          </div>
          {allowedNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

export const sectionMeta: Record<
  AppSection,
  { title: string; description: string }
> = {
  "user-dashboard": {
    title: "Bảng thống kê cá nhân",
    description: "Theo dõi hiệu suất doanh thu, hoạt động kinh doanh và số liệu thị trường thời gian thực.",
  },
  products: {
    title: "Sản phẩm",
    description: "Quản lý danh mục sản phẩm và tồn kho",
  },
  customers: {
    title: "Khách hàng",
    description: "Quản lý thông tin khách hàng và số dư",
  },
  activities: {
    title: "Hoạt động",
    description: "Tạo đơn hàng, chi tiết và trạng thái xử lý",
  },
  invoices: {
    title: "Hóa đơn",
    description: "Quản lý hóa đơn và trạng thái thanh toán",
  },
  users: {
    title: "Nhân sự",
    description: "Quản lý danh sách nhân viên, phòng ban và tài khoản",
  },
  salaries: {
    title: "Tiền lương",
    description: "Quản lý bảng lương, thưởng và thu nhập nhân viên",
  },
};