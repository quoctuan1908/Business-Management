import bcrypt from 'bcrypt';

import { IUser } from '@src/models/User.model';

import { toUser } from './common/mappers';
import prisma from './common/prisma';

const SALT_ROUNDS = 12;

/******************************************************************************
                                Functions
******************************************************************************/

async function getOne(id: number): Promise<IUser | null> {
  const row = await prisma.user.findUnique({ where: { user_id: id } });
  return row ? toUser(row) : null;
}

async function getOneByUsername(username: string): Promise<IUser | null> {
  const row = await prisma.user.findUnique({ where: { username } });
  return row ? toUser(row) : null;
}

async function persists(id: number): Promise<boolean> {
  const count = await prisma.user.count({ where: { user_id: id } });
  return count > 0;
}

async function getAll(): Promise<IUser[]> {
  const rows = await prisma.user.findMany({ orderBy: { user_id: 'asc' } });
  return rows.map(toUser);
}

async function add(user: IUser): Promise<IUser> {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  const row = await prisma.user.create({
    data: {
      username: user.username,
      password: hashedPassword,
      role: user.role,
      fullname: user.fullname,
      department: user.department,
      phone_number: user.phoneNumber,
      email: user.email,
    },
  });
  return toUser(row);
}

async function update(user: IUser): Promise<IUser> {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  const row = await prisma.user.update({
    where: { user_id: user.id },
    data: {
      username: user.username,
      password: hashedPassword,
      role: user.role,
      fullname: user.fullname,
      department: user.department,
      phone_number: user.phoneNumber,
      email: user.email,
    },
  });
  return toUser(row);
}

async function delete_(id: number): Promise<void> {
  await prisma.user.delete({ where: { user_id: id } });
}

// **** Unit-Tests Only **** //

async function deleteAllUsers(): Promise<void> {
  await prisma.user.deleteMany();
}

async function insertMultiple(users: IUser[]): Promise<IUser[]> {
  const created: IUser[] = [];
  for (const user of users) {
    created.push(await add(user));
  }
  return created;
}

async function comparePassword(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getOne,
  getOneByUsername,
  persists,
  getAll,
  add,
  update,
  delete: delete_,
  deleteAllUsers,
  insertMultiple,
  comparePassword,
} as const;
