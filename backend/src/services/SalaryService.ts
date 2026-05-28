import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import SalaryModel, { ISalary, ISalaryWithUser } from '@src/models/Salary.model';
import SalaryRepo from '@src/repos/SalaryRepo';
import UserRepo from '@src/repos/UserRepo';

/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get all salary records with User information (Admin focus).
 */
/**
 * Get all salaries and attach the corresponding user object.
 */
async function getAll(): Promise<ISalaryWithUser[]> {
  const [salaries, users] = await Promise.all([
    SalaryRepo.getAll(),
    UserRepo.getAll(),
  ]);

  return salaries.map(salary => {
    const user = users.find(u => u.id === salary.userId);
    return {
      ...salary,
      user: user ? {
        username: user.username,
        fullName: user.fullName,
        department: user.department,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      } : null,
    };
  });
}

function getByUserId(userId: number): Promise<ISalary[]> {
  return SalaryRepo.getByUserId(userId);
}

async function getOne(id: number): Promise<ISalary> {
  const salary = await SalaryRepo.getOne(id);
  if (!salary) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, 'Salary record not found');
  }
  return salary;
}

function addOne(salary: ISalary): Promise<ISalary> {
  return SalaryRepo.add(salary);
}

async function updateOne(salary: ISalary): Promise<ISalary> {
  const persists = await SalaryRepo.persists(salary.id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, 'Salary record not found');
  }
  return SalaryRepo.update(salary);
}

async function deleteOne(id: number): Promise<void> {
  const exists = await SalaryRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, 'Salary record not found');
  }
  return SalaryRepo.delete(id);
}

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  getAll,
  getByUserId,
  getOne,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;