import type {
  Activity,
  ActivityDetail,
  ActivityWrite,
  Customer,
  User,
  Invoice,
  Location,
  OrderStatus,
  Product,
  Salary,
  UserPublic,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  let res = await fetch(url, defaultOptions);

  // 1. Kiểm tra nếu lỗi 401 (Unauthorized - Thường là do hết hạn Access Token)
  if (res.status === 401 && !path.includes("/auth/refresh")) {
    
    // Nếu chưa có tiến trình refresh nào đang chạy, thì bắt đầu refresh
    if (!isRefreshing) {
      console.log("Refreshing token...")
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          
          if (!refreshRes.ok) throw new Error("Refresh token expired");
        } catch (error) {
          // Nếu refresh thất bại (hết hạn cả Refresh Token), xóa session và đẩy về login
          window.location.href = "/auth";
          throw error;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }
    await refreshPromise;

    // 2. Thử lại request ban đầu một lần nữa sau khi đã có token mới
    res = await fetch(url, defaultOptions);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch { }
    throw new Error(message);
  }

  if (res.status === 204 || res.status === 205) return undefined as T;

  const text = await res.text();
  if (!text.trim()) return undefined as T;

  return JSON.parse(text) as T;
}

export const orderStatusesApi = {
  getAll: () =>
    request<{ statuses: OrderStatus[] }>("/order-statuses/all").then(
      (d) => d.statuses,
    ),
};

export const activitiesApi = {
  getAll: () =>
    request<{ activities: Activity[] }>("/activities/all").then(
      (d) => d.activities,
    ),
  getOne: (id: number) =>
    request<{ activity: Activity }>(`/activities/${id}`).then((d) => d.activity),
  add: (activity: ActivityWrite) =>
    request<{ activity: Activity }>("/activities/add", {
      method: "POST",
      body: JSON.stringify({ activity }),
    }).then((d) => d.activity),
  update: (activity: ActivityWrite & { id: number }) =>
    request<{ activity: Activity }>("/activities/update", {
      method: "PUT",
      body: JSON.stringify({ activity }),
    }).then((d) => d.activity),
  confirm: (id: number) =>
    request<{ activity: Activity; invoiceId: number }>(
      `/activities/${id}/confirm`,
      { method: "POST" },
    ),
  advanceStatus: (id: number) =>
    request<{
      activity: Activity;
      nextStatus: string;
      nextStatusName: string;
    }>(`/activities/${id}/advance-status`, { method: "POST" }),
  delete: (id: number) =>
    request<void>(`/activities/delete/${id}`, { method: "DELETE" }),
};

export const activityDetailsApi = {
  getByActivity: (activityId: number) =>
    request<{ details: ActivityDetail[] }>(
      `/activities/${activityId}/details`,
    ).then((d) => d.details),
  add: (detail: {
    activityId: number;
    productId: number;
    quantity: number;
    salePrice: number;
  }) =>
    request<{ detail: ActivityDetail }>("/activities/details/add", {
      method: "POST",
      body: JSON.stringify({ detail }),
    }).then((d) => d.detail),
  update: (detail: {
    activityId: number;
    productId: number;
    quantity: number;
    salePrice: number;
  }) =>
    request<{ detail: ActivityDetail }>("/activities/details/update", {
      method: "PUT",
      body: JSON.stringify({ detail }),
    }).then((d) => d.detail),
  delete: (activityId: number, productId: number) =>
    request<void>(
      `/activities/details/delete/${activityId}/${productId}`,
      { method: "DELETE" },
    ),
};

export const invoicesApi = {
  getAll: () =>
    request<{ invoices: Invoice[] }>("/invoices/all").then((d) => d.invoices),
  add: (invoice: Omit<Invoice, "createdAt" | "updatedAt">) =>
    request<{ invoice: Invoice }>("/invoices/add", {
      method: "POST",
      body: JSON.stringify({ invoice }),
    }).then((d) => d.invoice),
  update: (invoice: Omit<Invoice, "createdAt" | "updatedAt">) =>
    request<{ invoice: Invoice }>("/invoices/update", {
      method: "PUT",
      body: JSON.stringify({ invoice }),
    }).then((d) => d.invoice),
  delete: (id: number) =>
    request<void>(`/invoices/delete/${id}`, { method: "DELETE" }),
};

export const productsApi = {
  getAll: () =>
    request<{ products: Product[] }>("/products/all").then((d) => d.products),
  getOne: (id: number) =>
    request<{ product: Product }>(`/products/${id}`).then((d) => d.product),
  add: (product: Omit<Product, "id">) =>
    request<{ product: Product }>("/products/add", {
      method: "POST",
      body: JSON.stringify({ product: { ...product, id: 0 } }),
    }).then((d) => d.product),
  update: (product: Product) =>
    request<{ product: Product }>("/products/update", {
      method: "PUT",
      body: JSON.stringify({ product }),
    }).then((d) => d.product),
  delete: (id: number) =>
    request<void>(`/products/delete/${id}`, { method: "DELETE" }),
};

export const customersApi = {
  getAll: () =>
    request<{ customers: Customer[] }>("/customers/all").then(
      (d) => d.customers,
    ),
  getOne: (id: number) =>
    request<{ customer: Customer }>(`/customers/${id}`).then((d) => d.customer),
  add: (customer: Omit<Customer, "id">) =>
    request<{ customer: Customer }>("/customers/add", {
      method: "POST",
      body: JSON.stringify({ customer: { ...customer, id: 0 } }),
    }).then((d) => d.customer),
  update: (customer: Customer) =>
    request<{ customer: Customer }>("/customers/update", {
      method: "PUT",
      body: JSON.stringify({ customer }),
    }).then((d) => d.customer),
  delete: (id: number) =>
    request<void>(`/customers/delete/${id}`, { method: "DELETE" }),
};

export const authApi = {
  register: (data: Pick<User, "username" | "password" | "role">) =>
    request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: Pick<User, "username" | "password">) =>
    request<{ message: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  refresh: () =>
    request<{ message: string }>("/auth/refresh", {
      method: "GET",
    }),
  logout: () =>
    request<void>("/auth/logout", {
      method: "GET",
    }),
  check: () =>
    request<{ user: User; isLoggedIn: boolean }>("/auth/check", {
      method: "GET",
  }),
};

export const salariesApi = {
  getAll: () =>
    request<{ salaries: (Salary & { user: User | null })[] }>("/salaries/all", {
      method: "GET",
    }),  
  getByUserId: (userId: number) =>
    request<{ salaries: Salary[] }>(`/salaries/user/${userId}`, {
      method: "GET",
    }),
  getOne: (id: number) =>
    request<{ salary: Salary }>(`/salaries/${id}`, {
      method: "GET",
    }),
  add: (salary: Omit<Salary, "id" | "createdAt" | "updatedAt">) =>
    request<{ salary: Salary }>("/salaries/add", {
      method: "POST",
      body: JSON.stringify({ salary }),
    }),
  update: (salary: Salary) =>
    request<{ salary: Salary }>("/salaries/update", {
      method: "PUT",
      body: JSON.stringify({ salary }),
    }),
  delete: (id: number) =>
    request<void>(`/salaries/delete/${id}`, {
      method: "DELETE",
    }),
};

export const locationsApi = {
  getAll: () =>
    request<{ locations: Location[] }>("/locations/all").then(
      (d) => d.locations,
    ),
};

export const usersApi = {

  getAll: () =>
    request<{ users: UserPublic[] }>("/users/all").then((d) => d.users),
  search: (query: string) =>
    request<{ users: UserPublic[] }>(`/users/search?query=${encodeURIComponent(query)}`).then((d) => d.users),
  add: (user: Partial<User>) =>
    request<{ user: UserPublic }>("/users/add", {
      method: "POST",
      body: JSON.stringify({ user }),
    }).then((d) => d.user),
  update: (user: Partial<User>) =>
    request<{ user: UserPublic }>("/users/update", {
      method: "PUT",
      body: JSON.stringify({ user }),
    }).then((d) => d.user),
  delete: (id: number) =>
    request<void>(`/users/delete/${id}`, {
      method: "DELETE",
    }),
};
export const lookupApi = {
  users: () => usersApi.getAll(),
  customers: () => customersApi.getAll(),
  invoices: () => invoicesApi.getAll(),
  products: () => productsApi.getAll(),
};
