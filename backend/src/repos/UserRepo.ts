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
    id: row.id,
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

async function getOne(username: string): Promise<IUserPublic | null> {
  const row = await prisma.user.findFirst({
    where: { 
      username,
      deleted_at: null,
    },
  });
  return row ? userModel.toPublic(mapRowToUser(row)) : null;
}

async function persists(id: number): Promise<boolean> {
  const count = await prisma.user.count({
    where: { 
      id: id, 
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

async function search(query: string): Promise<IUserPublic[]> {
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
  return rows.map(row => userModel.toPublic(mapRowToUser(row)));
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

async function update(user: IUser): Promise<IUserPublic> {
  const existingUser = await prisma.user.findUnique({
    where: { user_id: user.id },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  let hashedPassword = existingUser.password;
  if (user.password && user.password !== existingUser.password) {
    hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  }

  const row = await prisma.user.update({
    where: { user_id: user.id },
    data: {
      username: user.username,
      password: hashedPassword, 
      role: user.role,
      full_name: user.fullName,
      department: user.department,
      phone_number: user.phoneNumber,
      email: user.email,
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
} as const;