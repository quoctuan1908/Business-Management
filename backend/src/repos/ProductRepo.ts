import { IProduct } from '@src/models/Product.model';

import { toProduct } from './common/mappers';
import prisma from './common/prisma';

/******************************************************************************
                                Functions
******************************************************************************/

async function getOne(id: number): Promise<IProduct | null> {
  const row = await prisma.product.findUnique({ where: { product_id: id } });
  return row ? toProduct(row) : null;
}

async function persists(id: number): Promise<boolean> {
  const count = await prisma.product.count({ where: { product_id: id } });
  return count > 0;
}

async function getAll(): Promise<IProduct[]> {
  const rows = await prisma.product.findMany({ orderBy: { product_id: 'asc' } });
  return rows.map(toProduct);
}

async function add(product: IProduct): Promise<IProduct> {
  const row = await prisma.product.create({
    data: {
      product_name: product.productName,
      unit_price: product.unitPrice,
      stock_quantity: product.stockQuantity,
    },
  });
  return toProduct(row);
}

async function update(product: IProduct): Promise<IProduct> {
  const row = await prisma.product.update({
    where: { product_id: product.id },
    data: {
      product_name: product.productName,
      unit_price: product.unitPrice,
      stock_quantity: product.stockQuantity,
    },
  });
  return toProduct(row);
}

async function delete_(id: number): Promise<void> {
  await prisma.product.delete({ where: { product_id: id } });
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
} as const;
