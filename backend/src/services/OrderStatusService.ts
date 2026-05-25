import OrderStatusRepo from '@src/repos/OrderStatusRepo';

async function getAll() {
  const rows = await OrderStatusRepo.getAll();
  return rows.map((row) => ({
    statusCode: row.status_code,
    statusName: row.status_name,
    sortOrder: row.sort_order,
    isTerminal: row.is_terminal,
  }));
}

export default {
  getAll,
} as const;
