import bcrypt from 'bcrypt';
import { IUser } from '@src/models/User.model';
import prisma from './prisma';

const SALT_ROUNDS = 12;

/******************************************************************************
                                   Functions
******************************************************************************/

async function getOne(username: string): Promise<IUser | null> {
  return await prisma.user.findFirst({
    where: { 
      username,
      deleted_at: null,
    },
  });
}

async function persists(user_id: number): Promise<boolean> {
  const count = await prisma.user.count({
    where: { 
      id: user_id,
      deleted_at: null, 
    },
  });
  return count > 0;
}

async function getAll(): Promise<IUser[]> {
  return await prisma.user.findMany({
    where: {
      deleted_at: null,
    },
  });
}

async function search(query: string): Promise<IUser[]> {
  return await prisma.user.findMany({
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
}

async function add(user: IUser): Promise<void> {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  await prisma.user.create({
    data: {
      username: user.username,
      password: hashedPassword,
      role: user.role,
      full_name: user.full_name,
      department: user.department,
      phone_number: user.phone_number,
      email: user.email,
    },
  });
}

async function update(user: IUser): Promise<void> {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      username: user.username,
      password: hashedPassword,
      role: user.role,
      full_name: user.full_name,
      department: user.department,
      phone_number: user.phone_number,
      email: user.email,
      updated_at: new Date(),
    },
  });
}

async function delete_(user_id: number): Promise<void> {
  await prisma.user.update({
    where: { id: user_id },
    data: {
      deleted_at: new Date(),
    },
  });
}

// **** Unit-Tests Only **** //

async function deleteAllUsers(): Promise<void> {
  await prisma.user.deleteMany();
}

async function insertMultiple(users: IUser[]): Promise<void> {
  const encryptedUsers = await Promise.all(
    users.map(async (user) => ({
      username: user.username,
      password: await bcrypt.hash(user.password, SALT_ROUNDS),
      role: user.role,
      full_name: user.full_name,
      department: user.department,
      phone_number: user.phone_number,
      email: user.email,
    })),
  );
  await prisma.user.createMany({
    data: encryptedUsers,
  });
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