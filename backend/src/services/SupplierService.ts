import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { ISupplier } from '@src/models/Supplier.model';
import SupplierRepo from '@src/repos/SupplierRepo';

const Errors = {
  SUPPLIER_NOT_FOUND: 'Supplier not found',
  SUPPLIER_HAS_IMPORTS: 'Cannot delete supplier that has imports',
} as const;

async function getAll() {
  return SupplierRepo.getAll();
}

async function getOne(id: number) {
  const supplier = await SupplierRepo.getOne(id);
  if (!supplier) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.SUPPLIER_NOT_FOUND);
  }
  return supplier;
}

async function addOne(supplier: ISupplier) {
  return SupplierRepo.add(supplier);
}

async function updateOne(supplier: ISupplier) {
  const exists = await SupplierRepo.persists(supplier.id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.SUPPLIER_NOT_FOUND);
  }
  return SupplierRepo.update(supplier);
}

async function deleteOne(id: number): Promise<void> {
  const exists = await SupplierRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.SUPPLIER_NOT_FOUND);
  }
  const importCount = await SupplierRepo.countImports(id);
  if (importCount > 0) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      Errors.SUPPLIER_HAS_IMPORTS,
    );
  }
  return SupplierRepo.delete(id);
}

export default {
  Errors,
  getAll,
  getOne,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;
