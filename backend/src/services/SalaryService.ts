import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import SalaryModel, { ISalary, ISalaryWithUser } from '@src/models/Salary.model';
import SalaryRepo from '@src/repos/SalaryRepo';
import UserRepo from '@src/repos/UserRepo';
import BankAccountRepo from '@src/repos/BankAccountRepo';

/******************************************************************************
                                   Functions
******************************************************************************/

async function getAll(): Promise<ISalaryWithUser[]> {
  const [salaries, users, bankAccounts] = await Promise.all([
    SalaryRepo.getAll(),
    UserRepo.getAll(),
    BankAccountRepo.getAll(),
  ]);

  const userMap = new Map(users.map(u => [u.id, u]));
  const bankAccountByUserId = new Map(bankAccounts.map(b => [b.userId, b]));

  return salaries.map(salary => {
    const user = userMap.get(salary.userId);
    const bankAccount = user ? bankAccountByUserId.get(user.id) : null;

    return {
      ...salary,
      user: user ? {
        username: user.username,
        fullName: user.fullName,
        department: user.department,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        bankAccount: bankAccount ? {
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
        } : null,
      } : null,
    };
  });
}

async function getPage(page: number, pageSize: number) {
  return SalaryRepo.getPage((page - 1) * pageSize, pageSize);
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

function calculateAutomatedPayroll(
  month: number,
  year: number,
  commissionRate?: number
): Promise<void> {
  // Direct call to Repo logic layer
  return SalaryRepo.calculateAutomatedPayroll(month, year, commissionRate);
}

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  getAll,
  getPage,
  getByUserId,
  getOne,
  addOne,
  updateOne,
  delete: deleteOne,
  calculateAutomatedPayroll
} as const;