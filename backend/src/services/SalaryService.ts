import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { ISalary } from '@src/models/Salary.model';
import SalaryRepo from '@src/repos/SalaryRepo';

/******************************************************************************
                                   Functions
******************************************************************************/

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
  getByUserId,
  getOne,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;