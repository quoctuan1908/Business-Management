export type InvoiceStatus = "paid" | "unpaid" | "partial";



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

  status: InvoiceStatus;

  createdAt: string;

  updatedAt: string;

}



export interface Activity {

  id: number;

  userId: number;

  customerId: number;

  invoiceId: number | null;

  status: string;

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

export type UserPublic = Omit<User, "password">;


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


