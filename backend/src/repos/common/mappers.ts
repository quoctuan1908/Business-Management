import type {
  Activity,
  ActivityDetail,
  Customer,
  Invoice,
  Location,
  OrderStatus,
  Product,
  User,
} from '@prisma/client';

import type { IActivity, IActivityWrite } from '@src/models/Activity.model';
import type { IActivityDetail, IActivityDetailView } from '@src/models/ActivityDetail.model';
import type { ICustomer } from '@src/models/Customer.model';
import type { IInvoice, InvoiceStatus } from '@src/models/Invoice.model';
import type { ILocation } from '@src/models/Location.model';
import type { IProduct } from '@src/models/Product.model';
import type { IUser } from '@src/models/User.model';

/** Domain shape for order_statuses (camelCase). */
export interface IOrderStatus {
  statusCode: string;
  statusName: string;
  sortOrder: number;
  isTerminal: boolean;
}

/******************************************************************************
  Prisma (snake_case DB) → Domain (camelCase, Entity.id for own PK)
******************************************************************************/

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toLocation(row: Location): ILocation {
  return {
    id: row.location_id,
    province: row.province,
    ward: row.ward,
    wardCode: row.ward_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toInvoice(row: Invoice): IInvoice {
  return {
    id: row.invoice_id,
    totalAmount: Number(row.total_amount),
    date: row.date,
    status: row.status as InvoiceStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toOrderStatus(row: OrderStatus): IOrderStatus {
  return {
    statusCode: row.status_code,
    statusName: row.status_name,
    sortOrder: row.sort_order,
    isTerminal: row.is_terminal,
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

/******************************************************************************
  Domain (camelCase) → Prisma write payloads (snake_case)
******************************************************************************/

export function productToPrismaData(product: Pick<IProduct, 'productName' | 'unitPrice' | 'stockQuantity'>) {
  return {
    product_name: product.productName,
    unit_price: product.unitPrice,
    stock_quantity: product.stockQuantity,
  };
}

export function locationToPrismaData(location: Pick<ILocation, 'province' | 'ward' | 'wardCode'>) {
  return {
    province: location.province,
    ward: location.ward,
    ward_code: location.wardCode,
  };
}

export function customerToPrismaData(
  customer: Pick<
    ICustomer,
    | 'locationId'
    | 'companyName'
    | 'businessType'
    | 'representativeName'
    | 'position'
    | 'phoneNumber'
    | 'currentBalance'
  >,
) {
  return {
    location_id: customer.locationId,
    company_name: customer.companyName,
    business_type: customer.businessType,
    representative_name: customer.representativeName,
    position: customer.position,
    phone_number: customer.phoneNumber,
    current_balance: customer.currentBalance,
  };
}

export function invoiceToPrismaData(
  invoice: Pick<IInvoice, 'totalAmount' | 'date' | 'status'>,
) {
  return {
    total_amount: invoice.totalAmount,
    date: invoice.date,
    status: invoice.status,
  };
}

export function activityWriteToPrismaData(input: IActivityWrite) {
  return {
    user_id: input.userId,
    customer_id: input.customerId,
    activity_date: input.activityDate,
    content: input.content,
  };
}

export function activityDetailToPrismaData(detail: IActivityDetail) {
  return {
    activity_id: detail.activityId,
    product_id: detail.productId,
    quantity: detail.quantity,
    sale_price: detail.salePrice,
  };
}
