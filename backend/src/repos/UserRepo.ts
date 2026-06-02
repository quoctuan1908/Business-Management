import bcrypt from 'bcrypt';
import userModel, { IUser, IUserPublic } from '@src/models/User.model';
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
      username,
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

async function add(user: IUser): Promise<IUserPublic> {
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
                                   Statistic
******************************************************************************/

async function getEmployeeOverviewStats(userId: number) {
  const totalActivities = await prisma.activity.count({
    where: { user_id: userId },
  });

  const invoiceStats = await prisma.invoice.aggregate({
    where: {
      activity: { user_id: userId }
    },
    _sum: {
      total_amount: true
    },
    _count: {
      invoice_id: true
    }
  });

  const paidStats = await prisma.invoice.aggregate({
    where: {
      activity: { user_id: userId },
      status: 'paid'
    },
    _sum: {
      total_amount: true
    }
  });

  const grossRevenue = Number(invoiceStats._sum.total_amount) || 0;
  const collectedRevenue = Number(paidStats._sum.total_amount) || 0;
  const pendingRevenue = grossRevenue - collectedRevenue;
  const completedCount = invoiceStats._count.invoice_id || 0;

  return {
    totalActivities,
    conversionRate: totalActivities > 0 ? Number(((completedCount / totalActivities) * 100).toFixed(2)) : 0,
    grossRevenue,
    collectedRevenue,
    pendingRevenue,
    averageOrderValue: completedCount > 0 ? Number((grossRevenue / completedCount).toFixed(2)) : 0,
  };
}

async function getEmployeeLocationStats(userId: number) {
  const locations = await prisma.location.findMany({
    where: {
      customers: {
        some: {
          activities: { some: { user_id: userId } }
        }
      }
    },
    include: {
      customers: {
        where: {
          activities: { some: { user_id: userId } }
        },
        include: {
          activities: {
            where: { user_id: userId },
            include: { invoice: true }
          }
        }
      }
    }
  });

  return locations.map(loc => {
    let revenue = 0;
    let debt = 0;
    
    loc.customers.forEach(cust => {
      debt += Number(cust.current_balance) || 0;
      cust.activities.forEach(act => {
        if (act.invoice) {
          revenue += Number(act.invoice.total_amount) || 0;
        }
      });
    });

    return {
      province: loc.province,
      activeCustomersCount: loc.customers.length,
      revenueGenerated: revenue,
      outstandingDebt: debt
    };
  });
}

async function getEmployeeTopProducts(userId: number) {
  const groupedProducts = await prisma.activityDetail.groupBy({
    by: ['product_id'],
    where: {
      activity: { user_id: userId }
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 5 
  });

  const productIds = groupedProducts.map(p => p.product_id);
  const productsInfo = await prisma.product.findMany({
    where: { product_id: { in: productIds } }
  });

  return groupedProducts.map(gp => {
    const info = productsInfo.find(p => p.product_id === gp.product_id);
    const totalQty = gp._sum.quantity || 0;
    const unitPrice = info ? Number(info.unit_price) : 0;

    return {
      productName: info?.product_name || `Unknown (ID: ${gp.product_id})`,
      totalQty,
      totalSales: totalQty * unitPrice
    };
  });
}

/******************************************************************************
                                 Export default
******************************************************************************/

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
  getEmployeeOverviewStats,
  getEmployeeLocationStats,
  getEmployeeTopProducts,
} as const;
