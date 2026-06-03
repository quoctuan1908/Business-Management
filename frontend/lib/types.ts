export interface OrderStatus {

  statusCode: string;

  statusName: string;

  sortOrder: number;

  isTerminal: boolean;

}



export interface Invoice {

  id: number;

  totalAmount: number;

  date: string;

  createdAt: string;

  updatedAt: string;

}



export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface Payment {
  id: number;
  activityId: number;
  paidAmount: number;
  paymentDate: string;
  method: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  activityId: number;
  invoiceTotal: number;
  paidTotal: number;
  remaining: number;
  customerBalance: number;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  canRecordPayment: boolean;
  paymentsDeferred?: boolean;
  payments: Payment[];
}

export interface Activity {

  id: number;

  userId: number;

  customerId: number;

  invoiceId: number | null;

  status: string;

  paymentStatus: PaymentStatus;

  activityDate: string;

  content: string;

  createdAt: string;

  updatedAt: string;

}



export interface ActivityWrite {

  userId: number;

  customerId: number;

  activityDate: string;

  content: string;

}



export interface ActivityDetail {

  activityId: number;

  productId: number;

  quantity: number;

  salePrice: number;

  productName: string;

  unitPrice: number;

  lineTotal: number;

}



export interface Product {

  id: number;

  productName: string;

  unitPrice: number;

  stockQuantity: number;

}

export interface User {
  id: number;
  username: string;
  password?: string;
  role: string;
  fullName: string; 
  department: string;
  phoneNumber: string;
  email: string;
  createdAt: string; 
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserCreate {
  username: string;
  password?: string;
  role: string;
  fullName: string; 
  department: string;
  phoneNumber: string;
  email: string;
}

export type UserPublic = Omit<User, "password">;

export interface Salary {
  id: number;
  userId: number;
  month: number;
  year: number;
  baseSalary: number;
  commission: number;
  bonus: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SalaryWithUser extends Salary {
  user: {
    username: string;
    fullName: string;
    role: string;
    email?: string;
    phoneNumber?: string;
    department?: string;
  } | null;
}

export interface Location {

  id: number;

  province: string;

  ward: string;

  wardCode: number;

}



export interface Customer {

  id: number;

  locationId: number;

  companyName: string;

  businessType: string;

  representativeName: string;

  position: string;

  phoneNumber: string;

  currentBalance: number;

}

export interface CustomerOrderRow {
  activityId: number;
  activityDate: string;
  createdAt: string;
  status: string;
  paymentStatus: PaymentStatus;
  paymentStatusLabel: string;
  invoiceTotal: number;
  paidTotal: number;
  remaining: number;
}

export interface CustomerAccount {
  customer: Customer;
  currentBalance: number;
  totalDebt: number;
  orders: CustomerOrderRow[];
}

export interface CustomerPaymentAllocation {
  activityId: number;
  paidAmount: number;
}

export interface CustomerReceivePaymentResult {
  allocations: CustomerPaymentAllocation[];
  excessToBalance: number;
  account: CustomerAccount;
}


