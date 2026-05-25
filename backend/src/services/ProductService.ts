import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { IProduct } from '@src/models/Product.model';
import ProductRepo from '@src/repos/ProductRepo';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  PRODUCT_NOT_FOUND: 'Product not found',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

async function getAll() {
  return ProductRepo.getAll();
}

async function getOne(id: number) {
  const product = await ProductRepo.getOne(id);
  if (!product) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.PRODUCT_NOT_FOUND);
  }
  return product;
}

async function addOne(product: IProduct) {
  return ProductRepo.add(product);
}

async function updateOne(product: IProduct) {
  const exists = await ProductRepo.persists(product.id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.PRODUCT_NOT_FOUND);
  }
  return ProductRepo.update(product);
}

async function deleteOne(id: number): Promise<void> {
  const exists = await ProductRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.PRODUCT_NOT_FOUND);
  }
  return ProductRepo.delete(id);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  Errors,
  getAll,
  getOne,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;
