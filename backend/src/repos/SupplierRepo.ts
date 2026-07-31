import { ISupplier, ISupplierUpdate, ISupplierWrite } from '@src/models/Supplier.model';

import { supplierToPrismaData, toSupplier } from './common/mappers';
import prisma from './common/prisma';

async function getOne(id: number): Promise<ISupplier | null> {
  const row = await prisma.supplier.findUnique({ where: { supplier_id: id } });
  return row ? toSupplier(row) : null;
}

async function persists(id: number): Promise<boolean> {
  const count = await prisma.supplier.count({ where: { supplier_id: id } });
  return count > 0;
}

async function getAll(): Promise<ISupplier[]> {
  const rows = await prisma.supplier.findMany({ orderBy: { supplier_id: 'asc' } });
  return rows.map(toSupplier);
}

async function getPage(
  skip: number,
  take: number,
): Promise<{ items: ISupplier[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { supplier_id: 'asc' },
      skip,
      take,
    }),
    prisma.supplier.count(),
  ]);
  return { items: rows.map(toSupplier), total };
}

async function add(supplier: ISupplierWrite): Promise<ISupplier> {
  const row = await prisma.supplier.create({
    data: supplierToPrismaData(supplier),
  });
  return toSupplier(row);
}

async function update(supplier: ISupplierUpdate): Promise<ISupplier> {
  const row = await prisma.supplier.update({
    where: { supplier_id: supplier.id },
    data: supplierToPrismaData(supplier),
  });
  return toSupplier(row);
}

async function delete_(id: number): Promise<void> {
  await prisma.supplier.delete({ where: { supplier_id: id } });
}

async function countImports(supplierId: number): Promise<number> {
  return prisma.import.count({ where: { supplier_id: supplierId } });
}

export default {
  getOne,
  persists,
  getAll,
  getPage,
  add,
  update,
  delete: delete_,
  countImports,
} as const;
