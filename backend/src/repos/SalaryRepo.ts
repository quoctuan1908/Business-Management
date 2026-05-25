import { ISalary } from '@src/models/Salary.model';
import prisma from './prisma';

/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get one salary record by id.
 */
async function getOne(salaryId: number): Promise<ISalary | null> {
  const row = await prisma.salary.findUnique({
    where: { salary_id: salaryId },
  });
  if (!row) return null;
  return {
    id: row.salary_id,
    userId: row.user_id,
    month: row.month,
    year: row.year,
    baseSalary: Number(row.base_salary),
    commission: Number(row.commission),
    bonus: Number(row.bonus),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * See if a salary record exists.
 */
async function persists(salaryId: number): Promise<boolean> {
  const count = await prisma.salary.count({
    where: { salary_id: salaryId },
  });
  return count > 0;
}

/**
 * Get all salary records for a specific user.
 */
async function getByUserId(userId: number): Promise<ISalary[]> {
  const rows = await prisma.salary.findMany({
    where: { user_id: userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  return rows.map(row => ({
    id: row.salary_id,
    userId: row.user_id,
    month: row.month,
    year: row.year,
    baseSalary: Number(row.base_salary),
    commission: Number(row.commission),
    bonus: Number(row.bonus),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Add one salary record.
 */
async function add(salary: ISalary): Promise<ISalary> {
  const row = await prisma.salary.create({
    data: {
      user_id: salary.userId,
      month: salary.month,
      year: salary.year,
      base_salary: salary.baseSalary,
      commission: salary.commission,
      bonus: salary.bonus,
    },
  });
  return {
    id: row.salary_id,
    userId: row.user_id,
    month: row.month,
    year: row.year,
    baseSalary: Number(row.base_salary),
    commission: Number(row.commission),
    bonus: Number(row.bonus),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update a salary record.
 */
async function update(salary: ISalary): Promise<ISalary> {
  const row = await prisma.salary.update({
    where: { salary_id: salary.id },
    data: {
      month: salary.month,
      year: salary.year,
      base_salary: salary.baseSalary,
      commission: salary.commission,
      bonus: salary.bonus,
      updated_at: new Date(),
    },
  });
  return {
    id: row.salary_id,
    userId: row.user_id,
    month: row.month,
    year: row.year,
    baseSalary: Number(row.base_salary),
    commission: Number(row.commission),
    bonus: Number(row.bonus),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Delete a salary record.
 */
async function delete_(salaryId: number): Promise<void> {
  await prisma.salary.delete({
    where: { salary_id: salaryId },
  });
}

// **** Unit-Tests Only **** //

async function deleteAll(): Promise<void> {
  await prisma.salary.deleteMany();
}

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  getOne,
  persists,
  getByUserId,
  add,
  update,
  delete: delete_,
  deleteAll,
} as const;