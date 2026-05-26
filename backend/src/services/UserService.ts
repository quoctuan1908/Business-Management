import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { Errors } from '@src/models/common/types';
import User,{ IUser, IUserPublic } from '@src/models/User.model';
import UserRepo from '@src/repos/UserRepo';


/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get all users.
 */
function getAll(): Promise<IUserPublic[]> {
  return UserRepo.getAll();
}

/**
 * Search users by query string.
 */
function search(query: string): Promise<IUserPublic[]> {
  return UserRepo.search(query);
}

/**
 * Add one user.
 */
function addOne(user: IUser): Promise<IUserPublic> {
  return UserRepo.add(user);
}

/**
 * Update one user.
 */
async function updateOne(user: IUser): Promise<IUserPublic> {
  const persists = await UserRepo.persists(user.id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  const updated = await UserRepo.update(user);
  return updated;
}

async function deleteOne(id: number): Promise<void> {
  const exists = await UserRepo.persists(id);
  if (!exists) {
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