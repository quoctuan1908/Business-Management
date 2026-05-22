import bcrypt from 'bcrypt';
import { IUser } from '@src/models/User.model';
import prisma from './prisma';

const SALT_ROUNDS = 12;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get one user by username.
 */
async function getOne(username: string): Promise<IUser | null> {
  return await prisma.user.findUnique({
    where: { username },
  });
}

/**
 * See if a user with the given id exists.
 */
async function persists(user_id: number): Promise<boolean> {
  const count = await prisma.user.count({
    where: { id: user_id },
  });
  return count > 0;
}

/**
 * Get all users.
 */
async function getAll(): Promise<IUser[]> {
  return await prisma.user.findMany();
}

/**
 * Add one user with password hashing.
 */
async function add(user: IUser): Promise<void> {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  await prisma.user.create({
    data: {
      username: user.username,
      password: hashedPassword,
      role: user.role,
    },
  });
}

/**
 * Update a user and re-hash password.
 */
async function update(user: IUser): Promise<void> {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      username: user.username,
      password: hashedPassword,
      role: user.role,
    },
  });
}

/**
 * Delete one user.
 */
async function delete_(user_id: number): Promise<void> {
  await prisma.user.delete({
    where: { id: user_id },
  });
}

// **** Unit-Tests Only **** //

/**
 * Delete every user record.
 */
async function deleteAllUsers(): Promise<void> {
  await prisma.user.deleteMany();
}

/**
 * Insert multiple users with hashed passwords.
 */
async function insertMultiple(users: IUser[]): Promise<void> {
  const encryptedUsers = await Promise.all(
    users.map(async (user) => ({
      username: user.username,
      password: await bcrypt.hash(user.password, SALT_ROUNDS),
      role: user.role,
    })),
  );
  await prisma.user.createMany({
    data: encryptedUsers,
  });
}

/**
 * Compare a plain text password with a hashed password.
 */
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
  add,
  update,
  delete: delete_,
  deleteAllUsers,
  insertMultiple,
  comparePassword
} as const;