import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { Errors } from '@src/models/common/types';
import { IUser } from '@src/models/User.model';
import UserRepo from '@src/repos/UserRepo';


/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get all users.
 */
function getAll(): Promise<IUser[]> {
  return UserRepo.getAll();
}

/**
 * Search users by query string.
 */
function search(query: string): Promise<IUser[]> {
  return UserRepo.search(query);
}

/**
 * Add one user.
 */
function addOne(user: IUser): Promise<void> {
  return UserRepo.add(user);
}

/**
 * Update one user.
 */
async function updateOne(user: IUser): Promise<void> {
  const persists = await UserRepo.persists(user.id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.update(user);
}

/**
 * Delete a user by their id.
 */
async function deleteOne(id: number): Promise<void> {
  const persists = await UserRepo.persists(id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.delete(id);
}

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  getAll,
  search,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;