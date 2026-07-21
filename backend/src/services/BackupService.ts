import type { Prisma } from '@prisma/client';

import { RouteError } from '@src/common/utils/route-errors';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import prisma from '@src/repos/common/prisma';

export const BACKUP_VERSION = '1.0';
export const BACKUP_SYSTEM = 'seller_system';

export type BackupTableData = {
  users: Prisma.UserCreateManyInput[];
  locations: Prisma.LocationCreateManyInput[];
  orderStatuses: Prisma.OrderStatusCreateManyInput[];
  products: Prisma.ProductCreateManyInput[];
  suppliers: Prisma.SupplierCreateManyInput[];
  invoices: Prisma.InvoiceCreateManyInput[];
  refreshTokens: Prisma.RefreshTokenCreateManyInput[];
  bankAccounts: Prisma.BankAccountCreateManyInput[];
  salaries: Prisma.SalaryCreateManyInput[];
  employeeLocations: Prisma.EmployeeLocationCreateManyInput[];
  customers: Prisma.CustomerCreateManyInput[];
  imports: Prisma.ImportCreateManyInput[];
  activities: Prisma.ActivityCreateManyInput[];
  payments: Prisma.PaymentCreateManyInput[];
  activityDetails: Prisma.ActivityDetailCreateManyInput[];
  importDetails: Prisma.ImportDetailCreateManyInput[];
};

export type BackupPayload = {
  version: string;
  exportedAt: string;
  system: string;
  data: BackupTableData;
};

const SEQUENCE_RESETS: { table: string; column: string }[] = [
  { table: 'users', column: 'user_id' },
  { table: 'refresh_tokens', column: 'token_id' },
  { table: 'bank_accounts', column: 'bank_account_id' },
  { table: 'salaries', column: 'salary_id' },
  { table: 'products', column: 'product_id' },
  { table: 'locations', column: 'location_id' },
  { table: 'customers', column: 'customer_id' },
  { table: 'invoices', column: 'invoice_id' },
  { table: 'activities', column: 'activity_id' },
  { table: 'payments', column: 'payment_id' },
  { table: 'suppliers', column: 'supplier_id' },
  { table: 'imports', column: 'import_id' },
];

function formatBackupFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `backup_seller_system_${y}_${m}_${d}.json`;
}

function emptyTableData(): BackupTableData {
  return {
    users: [],
    locations: [],
    orderStatuses: [],
    products: [],
    suppliers: [],
    invoices: [],
    refreshTokens: [],
    bankAccounts: [],
    salaries: [],
    employeeLocations: [],
    customers: [],
    imports: [],
    activities: [],
    payments: [],
    activityDetails: [],
    importDetails: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertBackupPayload(payload: unknown): asserts payload is BackupPayload {
  if (!isRecord(payload)) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'File backup không hợp lệ');
  }

  if (payload.version !== BACKUP_VERSION) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      `Phiên bản backup không được hỗ trợ: ${String(payload.version)}`,
    );
  }

  if (payload.system !== BACKUP_SYSTEM) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      'File backup không thuộc hệ thống Seller System',
    );
  }

  if (!isRecord(payload.data)) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Dữ liệu backup thiếu trường data');
  }

  const requiredKeys = Object.keys(emptyTableData());
  for (const key of requiredKeys) {
    if (!Array.isArray(payload.data[key])) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        `Dữ liệu backup thiếu hoặc sai định dạng bảng: ${key}`,
      );
    }
  }
}

async function resetSequences(tx: Prisma.TransactionClient): Promise<void> {
  for (const { table, column } of SEQUENCE_RESETS) {
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', '${column}'), COALESCE((SELECT MAX(${column}) FROM ${table}), 1))`,
    );
  }
}

async function clearAllTables(tx: Prisma.TransactionClient): Promise<void> {
  await tx.payment.deleteMany();
  await tx.activityDetail.deleteMany();
  await tx.activity.deleteMany();
  await tx.invoice.deleteMany();
  await tx.importDetail.deleteMany();
  await tx.import.deleteMany();
  await tx.customer.deleteMany();
  await tx.product.deleteMany();
  await tx.supplier.deleteMany();
  await tx.salary.deleteMany();
  await tx.bankAccount.deleteMany();
  await tx.employeeLocation.deleteMany();
  await tx.refreshToken.deleteMany();
  await tx.user.deleteMany();
  await tx.location.deleteMany();
  await tx.orderStatus.deleteMany();
}

async function insertBackupData(
  tx: Prisma.TransactionClient,
  data: BackupTableData,
): Promise<void> {
  const insert = async <T>(
    rows: T[],
    createMany: (args: { data: T[] }) => Promise<unknown>,
  ) => {
    if (rows.length > 0) {
      await createMany({ data: rows });
    }
  };

  await insert(data.users, (args) => tx.user.createMany(args));
  await insert(data.locations, (args) => tx.location.createMany(args));
  await insert(data.orderStatuses, (args) => tx.orderStatus.createMany(args));
  await insert(data.products, (args) => tx.product.createMany(args));
  await insert(data.suppliers, (args) => tx.supplier.createMany(args));
  await insert(data.invoices, (args) => tx.invoice.createMany(args));
  await insert(data.refreshTokens, (args) => tx.refreshToken.createMany(args));
  await insert(data.bankAccounts, (args) => tx.bankAccount.createMany(args));
  await insert(data.salaries, (args) => tx.salary.createMany(args));
  await insert(data.employeeLocations, (args) =>
    tx.employeeLocation.createMany(args),
  );
  await insert(data.customers, (args) => tx.customer.createMany(args));
  await insert(data.imports, (args) => tx.import.createMany(args));
  await insert(data.activities, (args) => tx.activity.createMany(args));
  await insert(data.payments, (args) => tx.payment.createMany(args));
  await insert(data.activityDetails, (args) => tx.activityDetail.createMany(args));
  await insert(data.importDetails, (args) => tx.importDetail.createMany(args));
}

async function exportBackup(): Promise<{ filename: string; content: string }> {
  const [
    users,
    locations,
    orderStatuses,
    products,
    suppliers,
    invoices,
    refreshTokens,
    bankAccounts,
    salaries,
    employeeLocations,
    customers,
    imports,
    activities,
    payments,
    activityDetails,
    importDetails,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.location.findMany(),
    prisma.orderStatus.findMany(),
    prisma.product.findMany(),
    prisma.supplier.findMany(),
    prisma.invoice.findMany(),
    prisma.refreshToken.findMany(),
    prisma.bankAccount.findMany(),
    prisma.salary.findMany(),
    prisma.employeeLocation.findMany(),
    prisma.customer.findMany(),
    prisma.import.findMany(),
    prisma.activity.findMany(),
    prisma.payment.findMany(),
    prisma.activityDetail.findMany(),
    prisma.importDetail.findMany(),
  ]);

  const exportedAt = new Date().toISOString();
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt,
    system: BACKUP_SYSTEM,
    data: {
      users,
      locations,
      orderStatuses,
      products,
      suppliers,
      invoices,
      refreshTokens,
      bankAccounts,
      salaries,
      employeeLocations,
      customers,
      imports,
      activities,
      payments,
      activityDetails,
      importDetails,
    },
  };

  return {
    filename: formatBackupFilename(new Date(exportedAt)),
    content: JSON.stringify(payload, null, 2),
  };
}

async function restoreBackup(payload: unknown): Promise<{ restoredAt: string }> {
  assertBackupPayload(payload);
  const data = payload.data;

  const restoredAt = new Date().toISOString();

  await prisma.$transaction(
    async (tx) => {
      await clearAllTables(tx);
      await insertBackupData(tx, data);
      await resetSequences(tx);
    },
    { timeout: 120_000 },
  );

  return { restoredAt };
}

export default {
  exportBackup,
  restoreBackup,
  formatBackupFilename,
} as const;
