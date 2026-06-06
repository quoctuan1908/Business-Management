import bcrypt from 'bcrypt';
import userModel, { IUser, IUserCreate, IUserPublic } from '@src/models/User.model';
import prisma from './prisma';

const SALT_ROUNDS = 12;

/******************************************************************************
                                   Helpers
 ******************************************************************************/

/**
 * Map Prisma row (snake_case) to Model (camelCase)
 */
function mapRowToUser(row: any): IUser {
  return {
    id: row.user_id,
    username: row.username,
    password: row.password,
    role: row.role,
    fullName: row.full_name,
    department: row.department,
    phoneNumber: row.phone_number,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

/******************************************************************************
                                   Functions
******************************************************************************/

async function getOne(username: string): Promise<IUser | null> {
  const row = await prisma.user.findFirst({
    where: { 
      username: username,
      deleted_at: null,
    },
  });
  return row ? mapRowToUser(row) : null;
}

async function persists(id: number): Promise<boolean> {
  const count = await prisma.user.count({
    where: { 
      user_id: id, 
      deleted_at: null, 
    },
  });
  return count > 0;
}

async function getAll(): Promise<IUserPublic[]> {
  const rows = await prisma.user.findMany({
    where: { deleted_at: null },
  });
  return rows.map(row => userModel.toPublic(mapRowToUser(row)));
}

async function search(query: string): Promise<IUser[]> {
  const rows = await prisma.user.findMany({
    where: {
      deleted_at: null,
      OR: [
        { full_name: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone_number: { contains: query, mode: 'insensitive' } },
      ],
    },
  });
  return rows.map(row => mapRowToUser(row));
}

async function add(user: IUserCreate): Promise<IUserPublic> {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  const row = await prisma.user.create({
    data: {
      username: user.username,
      password: hashedPassword,
      role: user.role,
      full_name: user.fullName,
      department: user.department,
      phone_number: user.phoneNumber,
      email: user.email,    
    },
  });
  return userModel.toPublic(mapRowToUser(row));
}

async function update(user: Partial<IUser>): Promise<IUserPublic> {
  const existingUser = await prisma.user.findUnique({
    where: { user_id: user.id },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  let hashedPassword = existingUser.password;
  
  if (user.password && user.password.trim() !== "" && user.password !== existingUser.password) {
    hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  }

  const row = await prisma.user.update({
    where: { user_id: user.id },
    data: {
      username: user.username ?? existingUser.username,
      password: hashedPassword, 
      role: user.role ?? existingUser.role,
      full_name: user.fullName ?? existingUser.full_name,
      department: user.department ?? existingUser.department,
      phone_number: user.phoneNumber ?? existingUser.phone_number,
      email: user.email ?? existingUser.email,
      updated_at: new Date(),
    },
  });

  return userModel.toPublic(mapRowToUser(row));
}

async function delete_(id: number): Promise<void> {
  await prisma.user.update({
    where: { user_id: id },
    data: { deleted_at: new Date() },
  });
}

// **** Unit-Tests Only **** //

async function deleteAllUsers(): Promise<void> {
  await prisma.user.deleteMany();
}

async function insertMultiple(users: IUser[]): Promise<void> {
  const data = await Promise.all(
    users.map(async (u) => ({
      username: u.username,
      password: await bcrypt.hash(u.password, SALT_ROUNDS),
      role: u.role,
      full_name: u.fullName,
      department: u.department,
      phone_number: u.phoneNumber,
      email: u.email,
    })),
  );
  await prisma.user.createMany({ data });
}

async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}

/******************************************************************************
                                   Statistics
******************************************************************************/

export type SellerScope = { mode: 'all' } | { mode: 'seller'; sellerId: number };

function userIdFilter(scope: SellerScope): { user_id?: number } {
  if (scope.mode === 'all') return {};
  return { user_id: scope.sellerId };
}

function activityScopeWhere(
  scope: SellerScope,
  dateFilter?: { gte: Date; lt: Date },
  locationFilter?: Record<string, string>,
) {
  return {
    ...userIdFilter(scope),
    ...(dateFilter ? { activity_date: dateFilter } : {}),
    ...(locationFilter && Object.keys(locationFilter).length > 0
      ? { customer: { location: locationFilter } }
      : {}),
  };
}

/**
 * Overall employee productivity statistics (Shared/General)
 */
export async function getEmployeeOverviewStats(userId: number) {
  const [totalActivities, validOrdersCount, invoiceAggregate, paymentAggregate] = await Promise.all([
    prisma.activity.count({ where: { user_id: userId } }),
    prisma.activity.count({ where: { user_id: userId, NOT: { status: 'draft' } } }),
    prisma.invoice.aggregate({
      where: { activity: { user_id: userId } },
      _sum: { total_amount: true },
      _count: { invoice_id: true }
    }),
    prisma.payment.aggregate({
      where: { activity: { user_id: userId } },
      _sum: { paid_amount: true }
    })
  ]);

  if (totalActivities === 0) {
    return { totalActivities: 0, conversionRate: 0, grossRevenue: 0, collectedRevenue: 0, pendingRevenue: 0, averageOrderValue: 0 };
  }

  const grossRevenue = Number(invoiceAggregate._sum.total_amount) || 0;
  const collectedRevenue = Number(paymentAggregate._sum.paid_amount) || 0;
  const completedCount = invoiceAggregate._count.invoice_id || 0;

  return {
    totalActivities,
    conversionRate: Number(((validOrdersCount / totalActivities) * 100).toFixed(2)),
    grossRevenue,
    collectedRevenue,
    pendingRevenue: Math.max(0, grossRevenue - collectedRevenue),
    averageOrderValue: completedCount > 0 ? Number((grossRevenue / completedCount).toFixed(2)) : 0,
  };
}

/**
 * Detailed monthly productivity and individual targets for a specific employee
 */
export async function getEmployeeMonthlyStats(userId: number, inputMonth?: number, inputYear?: number) {
  const now = new Date();
  const month = inputMonth ?? (now.getMonth() + 1);
  const year = inputYear ?? now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const [tasksReceived, tasksProcessed, monthlyInvoices, monthlyPayments] = await Promise.all([
    prisma.activity.count({
      where: { user_id: userId, activity_date: { gte: startOfMonth, lt: startOfNextMonth } }
    }),
    prisma.activity.count({
      where: { user_id: userId, NOT: { status: 'draft' }, activity_date: { gte: startOfMonth, lt: startOfNextMonth } }
    }),
    prisma.invoice.aggregate({
      where: { activity: { user_id: userId }, date: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { total_amount: true }
    }),
    prisma.payment.aggregate({
      where: { activity: { user_id: userId }, payment_date: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { paid_amount: true }
    })
  ]);

  const grossRevenue = Number(monthlyInvoices._sum.total_amount) || 0;
  const collectedRevenue = Number(monthlyPayments._sum.paid_amount) || 0;

  return {
    period: `${month.toString().padStart(2, '0')}/${year}`,
    tasksReceived, 
    tasksProcessed, 
    monthlyGrossRevenue: grossRevenue, 
    monthlyCollectedRevenue: collectedRevenue, 
    monthlyDebtCreated: Math.max(0, grossRevenue - collectedRevenue) 
  };
}
function getDateFilter(month: string, year: string) {
  if (!year || year === "all") return undefined;
  
  const y = parseInt(year);
  if (month && month !== "all") {
    const m = parseInt(month);
    return {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  } else {
    return {
      gte: new Date(y, 0, 1),
      lt: new Date(y + 1, 0, 1),
    };
  }
}

export async function getEmployeeLocationStats(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  const dateFilter = getDateFilter(month, year);
  const userFilter = userIdFilter(scope);
  
  const locations = await prisma.location.findMany({
    where: {
      ...(province && province !== "all" ? { province } : {}),
      ...(ward && ward !== "all" ? { ward } : {}),
      customers: {
        some: {
          activities: {
            some: {
              ...userFilter,
              ...(dateFilter ? { activity_date: dateFilter } : {}),
            },
          },
        },
      },
    },
    select: {
      province: true,
      ward: true,
      customers: {
        where: {
          activities: {
            some: {
              ...userFilter,
            },
          },
        },
        select: {
          customer_id: true,
          current_balance: true,
          activities: {
            where: {
              ...userFilter,
              ...(dateFilter ? { activity_date: dateFilter } : {}),
            },
            select: {
              invoice: { select: { total_amount: true } }
            }
          }
        }
      }
    }
  });

  return {
    locations: locations.map(loc => {
      let revenueGenerated = 0;
      let outstandingDebt = 0;

      loc.customers.forEach(cust => {
        outstandingDebt += Number(cust.current_balance) || 0;
        cust.activities.forEach(act => {
          if (act.invoice) {
            revenueGenerated += Number(act.invoice.total_amount) || 0;
          }
        });
      });

      return {
        province: loc.province,
        ward: loc.ward,
        activeCustomersCount: loc.customers.length,
        revenueGenerated,
        outstandingDebt
      };
    })
  };
}

export async function getSellerOverviewStats(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  const dateFilter = getDateFilter(month, year);

  const locationFilter: Record<string, string> = {};
  if (province && province !== "all") locationFilter.province = province;
  if (ward && ward !== "all") locationFilter.ward = ward;

  const baseActivityWhere = activityScopeWhere(scope, dateFilter, locationFilter);

  const [totalActivities, validOrdersCount, invoiceAggregate] = await Promise.all([
    prisma.activity.count({ where: baseActivityWhere }),
    prisma.activity.count({ where: { ...baseActivityWhere, NOT: { status: 'draft' } } }),
    prisma.invoice.aggregate({
      where: { activity: baseActivityWhere },
      _sum: { total_amount: true },
      _count: { invoice_id: true }
    })
  ]);

  const grossRevenue = Number(invoiceAggregate._sum.total_amount) || 0; 

  const sellerActivities = await prisma.activity.findMany({
    where: baseActivityWhere,
    select: { activity_id: true }
  });

  const activityIds = sellerActivities.map(act => act.activity_id);

  const paymentAggregate = activityIds.length > 0
    ? await prisma.payment.aggregate({
        where: { activity_id: { in: activityIds } },
        _sum: { paid_amount: true }
      })
    : { _sum: { paid_amount: null } };

  const collectedRevenue = Number(paymentAggregate._sum.paid_amount) || 0; 

  return {
    totalActivities, 
    conversionRate: totalActivities > 0 ? Number(((validOrdersCount / totalActivities) * 100).toFixed(2)) : 0, 
    grossRevenue, 
    collectedRevenue,
    pendingRevenue: Math.max(0, grossRevenue - collectedRevenue), 
    averageOrderValue: invoiceAggregate._count.invoice_id > 0 ? Number((grossRevenue / invoiceAggregate._count.invoice_id).toFixed(0)) : 0
  };
}

export async function getEmployeeStatusBreakdown(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  const dateFilter = getDateFilter(month, year);
  
  const locationFilter: Record<string, string> = {};
  if (province && province !== "all") locationFilter.province = province;
  if (ward && ward !== "all") locationFilter.ward = ward;

  const statusCounts = await prisma.activity.groupBy({
    by: ['status'],
    where: activityScopeWhere(scope, dateFilter, locationFilter),
    _count: { activity_id: true }
  });

  return {
    breakdown: statusCounts.map(item => ({
      statusName: item.status, 
      count: item._count.activity_id
    }))
  };
}


export async function getEmployeeRecentSalesTimeline(scope: SellerScope, month: string, year: string, province?: string, ward?: string) {
  const dateFilter = getDateFilter(month, year);

  const locationFilter: Record<string, string> = {};
  if (province && province !== "all") locationFilter.province = province;
  if (ward && ward !== "all") locationFilter.ward = ward;

  const recentActivities = await prisma.activity.findMany({
    where: { 
      ...activityScopeWhere(scope, dateFilter, locationFilter),
      invoice_id: { not: null },
    },
    orderBy: { activity_date: 'desc' },
    take: 10,
    select: {
      activity_date: true,
      content: true,
      invoice: { select: { total_amount: true } },
      customer: { select: { company_name: true } },
      details: {
        take: 1,
        select: { product: { select: { product_name: true } } }
      }
    }
  });

  return {
    timeline: recentActivities.map(act => ({
      createdAt: act.activity_date, 
      customerName: act.customer.company_name,
      productName: act.details[0]?.product?.product_name || act.content,
      amount: Number(act.invoice?.total_amount) || 0 
    }))
  };
}


export async function getEmployeeTopDebtors(scope: SellerScope, province?: string, ward?: string) {
  const locationFilter: Record<string, string> = {};
  if (province && province !== "all") locationFilter.province = province;
  if (ward && ward !== "all") locationFilter.ward = ward;

  const userFilter = userIdFilter(scope);

  const customers = await prisma.customer.findMany({
    where: { 
      activities: { some: userFilter },
      current_balance: { gt: 0 },
      ...(Object.keys(locationFilter).length > 0 ? { location: locationFilter } : {})
    },
    select: {
      customer_id: true,
      company_name: true,
      phone_number: true,
      current_balance: true
    },
    orderBy: { current_balance: 'desc' },
    take: 5
  });

  return {
    debtors: customers.map(cust => ({
      customerId: cust.customer_id,
      customerName: cust.company_name,
      phoneNumber: cust.phone_number,
      outstandingDebt: Number(cust.current_balance) || 0
    }))
  };
}

export async function getSellerMonthlyStats(sellerId: number, inputMonth?: number, inputYear?: number) {
  const now = new Date();
  const month = inputMonth ?? (now.getMonth() + 1);
  const year = inputYear ?? now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const activities = await prisma.activity.findMany({
    where: {
      user_id: sellerId,
      activity_date: { gte: startOfMonth, lt: startOfNextMonth }
    },
    select: {
      activity_id: true,
      status: true,
      invoice: { select: { total_amount: true } },
      payments: { select: { paid_amount: true } }
    }
  });

  let successfulDeliveries = 0;
  let collectedCod = 0;

  activities.forEach(act => {
    if (act.status === 'completed') successfulDeliveries++;
    act.payments.forEach(p => {
      collectedCod += Number(p.paid_amount) || 0;
    });
  });

  return [{
    month: month,
    period: `${month.toString().padStart(2, '0')}/${year}`,
    successfulDeliveries,
    collectedCod
  }];
}

export async function getEmployeeTopProducts(userId: number) {
  const groupedProducts = await prisma.activityDetail.groupBy({
    by: ['product_id'],
    where: { activity: { user_id: userId } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5 
  });

  if (groupedProducts.length === 0) return { products: [] };

  const productsInfo = await prisma.product.findMany({
    where: { product_id: { in: groupedProducts.map(p => p.product_id) } },
    select: { product_id: true, product_name: true }
  });

  const detailsInfo = await prisma.activityDetail.findMany({
    where: {
      product_id: { in: groupedProducts.map(p => p.product_id) },
      activity: { user_id: userId }
    },
    select: { product_id: true, sale_price: true, quantity: true }
  });

  const products = groupedProducts.map(gp => {
    const info = productsInfo.find(p => p.product_id === gp.product_id);
    const totalQty = gp._sum.quantity || 0;
    
    const totalSales = detailsInfo
      .filter(d => d.product_id === gp.product_id)
      .reduce((sum, d) => sum + (Number(d.sale_price) * (d.quantity || 0)), 0);

    return {
      productName: info?.product_name || `Unknown`,
      totalQty,
      totalSales
    };
  });

  return { products };
}

export async function getShipperOverviewStats(shipperId: number) {
  const [totalDeliveryTrips, completedDeliveries, moneyCollectedAggregate] = await Promise.all([
    prisma.activity.count({
      where: { user_id: shipperId, content: { contains: 'Delivery' } } 
    }),
    prisma.activity.count({
      where: { user_id: shipperId, status: 'completed' }
    }),
    prisma.payment.aggregate({
      where: { activity: { user_id: shipperId } },
      _sum: { paid_amount: true }
    })
  ]);

  return {
    totalDeliveryTrips,
    completedDeliveries,
    deliverySuccessRate: totalDeliveryTrips > 0 ? Number(((completedDeliveries / totalDeliveryTrips) * 100).toFixed(2)) : 0,
    totalMoneyCollected: Number(moneyCollectedAggregate._sum.paid_amount) || 0 
  };
}

export async function getShipperMonthlyStats(shipperId: number, inputMonth?: number, inputYear?: number) {
  const now = new Date();
  const month = inputMonth ?? (now.getMonth() + 1);
  const year = inputYear ?? now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const [monthlyTrips, monthlySuccess, monthlyPayments] = await Promise.all([
    prisma.activity.count({
      where: { user_id: shipperId, content: { contains: 'Delivery' }, activity_date: { gte: startOfMonth, lt: startOfNextMonth } }
    }),
    prisma.activity.count({
      where: { user_id: shipperId, status: 'completed', activity_date: { gte: startOfMonth, lt: startOfNextMonth } }
    }),
    prisma.payment.aggregate({
      where: { activity: { user_id: shipperId }, payment_date: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { paid_amount: true }
    })
  ]);

  return {
    period: `${month.toString().padStart(2, '0')}/${year}`,
    monthlyTrips,
    monthlySuccess,
    monthlyMoneyCollected: Number(monthlyPayments._sum.paid_amount) || 0
  };
}
/* ==========================================================================
   PART 5: EXPORT REPOSITORY OBJECT
   ========================================================================== */

export default {
  getOne,
  persists,
  getAll,
  search,
  add,
  update,
  delete: delete_,
  deleteAllUsers,
  insertMultiple,
  comparePassword,

  // General Statistics
  getEmployeeOverviewStats,
  getEmployeeMonthlyStats,
  getEmployeeLocationStats,
  getEmployeeTopProducts,
  getEmployeeStatusBreakdown,
  getEmployeeRecentSalesTimeline,

  // Seller Statistics
  getSellerOverviewStats,
  getSellerMonthlyStats,
  getEmployeeTopDebtors,

  // Shipper Statistics
  getShipperOverviewStats,
  getShipperMonthlyStats,
} as const;