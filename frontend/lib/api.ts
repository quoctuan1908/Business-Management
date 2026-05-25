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
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text.trim()) {
    return undefined as T;
  }

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

export const locationsApi = {
  getAll: () =>
    request<{ locations: Location[] }>("/locations/all").then(
      (d) => d.locations,
    ),
};

export const usersApi = {
  getAll: () =>
    request<{ users: User[] }>("/users/all").then((d) => d.users),
};

export const lookupApi = {
  users: () => usersApi.getAll(),
  customers: () => customersApi.getAll(),
  invoices: () => invoicesApi.getAll(),
  products: () => productsApi.getAll(),
};
