import type {
  Activity,
  ActivityDetail,
  Customer,
  Invoice,
  Location,
  Product,
  User,
} from '@prisma/client';

import type { IActivity } from '@src/models/Activity.model';
import type { IActivityDetailView } from '@src/models/ActivityDetail.model';
import type { ICustomer } from '@src/models/Customer.model';
import type { IInvoice, InvoiceStatus } from '@src/models/Invoice.model';
import type { ILocation } from '@src/models/Location.model';
import type { IProduct } from '@src/models/Product.model';
import type { IUser } from '@src/models/User.model';

export function toUser(row: User): IUser {
  return {
    id: row.user_id,
    username: row.username,
    password: row.password,
    role: row.role,
    fullname: row.fullname,
    department: row.department,
    phoneNumber: row.phone_number,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toProduct(row: Product): IProduct {
  return {
    id: row.product_id,
    productName: row.product_name,
    unitPrice: Number(row.unit_price),
    stockQuantity: row.stock_quantity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toLocation(row: Location): ILocation {
  return {
    id: row.location_id,
    province: row.province,
    ward: row.ward,
    wardCode: row.ward_code,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toCustomer(row: Customer): ICustomer {
  return {
    id: row.customer_id,
    locationId: row.location_id,
    companyName: row.company_name,
    businessType: row.business_type,
    representativeName: row.representative_name,
    position: row.position,
    phoneNumber: row.phone_number,
    currentBalance: Number(row.current_balance),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toInvoice(row: Invoice): IInvoice {
  return {
    id: row.invoice_id,
    totalAmount: Number(row.total_amount),
    date: row.date,
    status: row.status as InvoiceStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toActivity(row: Activity): IActivity {
  return {
    id: row.activity_id,
    userId: row.user_id,
    customerId: row.customer_id,
    invoiceId: row.invoice_id,
    status: row.status,
    activityDate: row.activity_date,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type ActivityDetailWithProduct = ActivityDetail & {
  product: Product;
};

export function toActivityDetailView(
  row: ActivityDetailWithProduct,
): IActivityDetailView {
  const salePrice = Number(row.sale_price);
  return {
    activityId: row.activity_id,
    productId: row.product_id,
    quantity: row.quantity,
    salePrice,
    productName: row.product.product_name,
    unitPrice: Number(row.product.unit_price),
    lineTotal: salePrice * row.quantity,
  };
}
