import { FunctionDeclaration, FunctionDeclarationSchema, SchemaType } from '@google/generative-ai';

/**
 * Helper cho các hàm dùng "seller scope" (userId dạng STRING, đi qua parseSellerScope).
 * Khai báo rõ return type FunctionDeclarationSchema để TS giữ đúng kiểu literal
 * của SchemaType.STRING/OBJECT thay vì suy rộng thành enum SchemaType chung chung.
 */
function sellerScopeParams(required: string[] = ['userId']): FunctionDeclarationSchema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      userId: { type: SchemaType.STRING, description: 'ID nhân viên seller (dạng chuỗi)' },
      month: { type: SchemaType.STRING, description: "Tháng cần xem, bỏ trống nghĩa là 'all'" },
      year: { type: SchemaType.STRING, description: "Năm cần xem, bỏ trống nghĩa là 'all'" },
      province: { type: SchemaType.STRING, description: 'Lọc theo tỉnh (tùy chọn)' },
      ward: { type: SchemaType.STRING, description: 'Lọc theo xã/phường (tùy chọn)' },
      date: { type: SchemaType.STRING, description: 'Lọc theo ngày cụ thể (tùy chọn)' },
    },
    required,
  };
}

/**
 * Helper cho các hàm dùng userId dạng NUMBER (không qua seller scope).
 * extraProps để thêm các field riêng như month/year/date tùy từng hàm.
 */
function numericStatsParams(
  extraProps: Record<string, { type: SchemaType; description?: string }> = {},
  required: string[] = ['userId'],
): FunctionDeclarationSchema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      userId: { type: SchemaType.NUMBER },
      ...extraProps,
    },
    required,
  };
}

export const toolSchemas: FunctionDeclaration[] = [
  {
    name: 'getUserProfile',
    description: 'Lấy hồ sơ user đang đăng nhập',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getAllUsers',
    description: 'Lấy danh sách toàn bộ user (admin)',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getAllUnactivatedUsers',
    description: 'Lấy danh sách user chưa kích hoạt (admin)',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'searchUsers',
    description: 'Tìm kiếm user theo từ khóa (admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { query: { type: SchemaType.STRING, description: 'Từ khóa tìm kiếm' } },
      required: ['query'],
    },
  },
  {
    name: 'getOverviewStats',
    description: 'Lấy báo cáo tổng quan KPI của một nhân viên (userId dạng số)',
    parameters: numericStatsParams(),
  },
  {
    name: 'getMonthlyStats',
    description: 'Lấy số liệu năng suất theo tháng của nhân viên (userId dạng số)',
    parameters: numericStatsParams({
      month: { type: SchemaType.NUMBER, description: 'Tùy chọn' },
      year: { type: SchemaType.NUMBER, description: 'Tùy chọn' },
    }),
  },
  {
    name: 'getTopProducts',
    description: 'Lấy top sản phẩm bán chạy của nhân viên (userId dạng số)',
    parameters: numericStatsParams(),
  },
  {
    name: 'getLocationStats',
    description: 'Thống kê doanh thu theo địa bàn (userId dạng chuỗi)',
    parameters: sellerScopeParams(),
  },
  {
    name: 'getStatusBreakdown',
    description: 'Phân bổ đơn hàng theo trạng thái (userId dạng chuỗi)',
    parameters: sellerScopeParams(),
  },
  {
    name: 'getRecentSalesTimeline',
    description: 'Dòng thời gian giao dịch gần đây (userId dạng chuỗi)',
    parameters: sellerScopeParams(),
  },
  {
    name: 'getSellerOverviewStats',
    description: 'Tổng quan hợp đồng & công nợ của seller (userId dạng chuỗi)',
    parameters: sellerScopeParams(),
  },
  {
    name: 'getSellerMonthlyStats',
    description: 'Thống kê theo tháng của seller (userId dạng số)',
    parameters: numericStatsParams({
      month: { type: SchemaType.NUMBER, description: 'Tùy chọn' },
      year: { type: SchemaType.NUMBER, description: 'Tùy chọn' },
    }),
  },
  {
    name: 'getEmployeeTopDebtors',
    description: 'Top khách hàng nợ nhiều nhất của nhân viên (userId dạng chuỗi)',
    parameters: sellerScopeParams(['userId']),
  },
  {
    name: 'getShipperOverviewStats',
    description: 'Tổng quan chuyến giao hàng & COD của shipper (userId dạng số)',
    parameters: numericStatsParams({
      month: { type: SchemaType.STRING, description: 'Tùy chọn' },
      year: { type: SchemaType.STRING, description: 'Tùy chọn' },
      date: { type: SchemaType.STRING, description: 'Tùy chọn' },
    }),
  },
  {
    name: 'getShipperMonthlyStats',
    description: 'Thống kê theo tháng của shipper (userId dạng số)',
    parameters: numericStatsParams({
      month: { type: SchemaType.NUMBER, description: 'Tùy chọn' },
      year: { type: SchemaType.NUMBER, description: 'Tùy chọn' },
      date: { type: SchemaType.STRING, description: 'Tùy chọn' },
    }),
  },
  {
    name: 'getMapStatus',
    description: 'Trạng thái bám chốt địa bàn theo ngày',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { date: { type: SchemaType.STRING, description: 'Định dạng YYYY-MM-DD' } },
      required: ['date'],
    },
  },
];