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

  // =====================Salary=========================
  {
    name: 'getAllSalaries',
    description: 'Lấy toàn bộ bảng lương của tất cả nhân viên, gồm cả thông tin tài khoản ngân hàng (chỉ admin)',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getSalariesByUserId',
    description: 'Lấy lịch sử lương của một nhân viên theo userId (admin xem được của ai cũng được, nhân viên chỉ xem được của chính mình)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'getSalaryOne',
    description: 'Lấy chi tiết một bản ghi lương theo id bản ghi (admin xem được của ai cũng được, nhân viên chỉ xem được bản ghi của chính mình)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID bản ghi lương' },
      },
      required: ['id'],
    },
  },
  {
    name: 'addSalary',
    description: 'Tạo mới một bản ghi lương cho nhân viên (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên' },
        month: { type: SchemaType.NUMBER, description: 'Tháng áp dụng' },
        year: { type: SchemaType.NUMBER, description: 'Năm áp dụng' },
        baseSalary: { type: SchemaType.NUMBER, description: 'Lương cơ bản' },
        commission: { type: SchemaType.NUMBER, description: 'Hoa hồng' },
        bonus: { type: SchemaType.NUMBER, description: 'Thưởng' },
        isPaid: { type: SchemaType.BOOLEAN, description: 'Đã thanh toán hay chưa (tùy chọn, mặc định false)' },
      },
      required: ['userId', 'month', 'year', 'baseSalary', 'commission', 'bonus'],
    },
  },
  {
    name: 'updateSalary',
    description: 'Cập nhật một bản ghi lương đã tồn tại (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID bản ghi lương cần cập nhật' },
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên' },
        month: { type: SchemaType.NUMBER, description: 'Tháng áp dụng' },
        year: { type: SchemaType.NUMBER, description: 'Năm áp dụng' },
        baseSalary: { type: SchemaType.NUMBER, description: 'Lương cơ bản' },
        commission: { type: SchemaType.NUMBER, description: 'Hoa hồng' },
        bonus: { type: SchemaType.NUMBER, description: 'Thưởng' },
        isPaid: { type: SchemaType.BOOLEAN, description: 'Đã thanh toán hay chưa (tùy chọn)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteSalary',
    description: 'Xóa một bản ghi lương theo id (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID bản ghi lương cần xóa' },
      },
      required: ['id'],
    },
  },
  {
    name: 'calculatePayroll',
    description: 'Tự động tính lương hàng loạt cho một tháng/năm, có thể tùy chỉnh tỉ lệ hoa hồng (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: { type: SchemaType.NUMBER, description: 'Tháng cần tính lương' },
        year: { type: SchemaType.NUMBER, description: 'Năm cần tính lương' },
        commissionRate: { type: SchemaType.NUMBER, description: 'Tỉ lệ hoa hồng tùy chỉnh (tùy chọn)' },
      },
      required: ['month', 'year'],
    },
  },
  // =================== Supplier ======================
  {
    name: 'getAllSuppliers',
    description: 'Lấy danh sách toàn bộ nhà cung cấp',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getSupplierOne',
    description: 'Lấy chi tiết một nhà cung cấp theo id',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID nhà cung cấp' },
      },
      required: ['id'],
    },
  },
  {
    name: 'addSupplier',
    description: 'Thêm mới một nhà cung cấp (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        supplierName: { type: SchemaType.STRING, description: 'Tên nhà cung cấp' },
        businessType: { type: SchemaType.STRING, description: 'Loại hình kinh doanh' },
        address: { type: SchemaType.STRING, description: 'Địa chỉ' },
        phoneNumber: { type: SchemaType.STRING, description: 'Số điện thoại' },
        email: { type: SchemaType.STRING, description: 'Email' },
      },
      required: ['supplierName', 'businessType', 'address', 'phoneNumber', 'email'],
    },
  },
  {
    name: 'updateSupplier',
    description: 'Cập nhật thông tin một nhà cung cấp đã tồn tại (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID nhà cung cấp cần cập nhật' },
        supplierName: { type: SchemaType.STRING, description: 'Tên nhà cung cấp' },
        businessType: { type: SchemaType.STRING, description: 'Loại hình kinh doanh' },
        address: { type: SchemaType.STRING, description: 'Địa chỉ' },
        phoneNumber: { type: SchemaType.STRING, description: 'Số điện thoại' },
        email: { type: SchemaType.STRING, description: 'Email' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteSupplier',
    description: 'Xóa một nhà cung cấp theo id (chỉ admin, sẽ báo lỗi nếu nhà cung cấp đã có phiếu nhập hàng)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID nhà cung cấp cần xóa' },
      },
      required: ['id'],
    },
  },

  // =================== Product ======================  
  {
    name: 'getAllProducts',
    description: 'Lấy danh sách toàn bộ sản phẩm',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getProductOne',
    description: 'Lấy chi tiết một sản phẩm theo id',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID sản phẩm' },
      },
      required: ['id'],
    },
  },
  {
    name: 'addProduct',
    description: 'Thêm mới một sản phẩm (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productName: { type: SchemaType.STRING, description: 'Tên sản phẩm' },
        unitPrice: { type: SchemaType.NUMBER, description: 'Đơn giá' },
        stockQuantity: { type: SchemaType.NUMBER, description: 'Số lượng tồn kho' },
      },
      required: ['productName', 'unitPrice', 'stockQuantity'],
    },
  },
  {
    name: 'updateProduct',
    description: 'Cập nhật thông tin một sản phẩm đã tồn tại (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID sản phẩm cần cập nhật' },
        productName: { type: SchemaType.STRING, description: 'Tên sản phẩm' },
        unitPrice: { type: SchemaType.NUMBER, description: 'Đơn giá' },
        stockQuantity: { type: SchemaType.NUMBER, description: 'Số lượng tồn kho' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteProduct',
    description: 'Xóa một sản phẩm theo id (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID sản phẩm cần xóa' },
      },
      required: ['id'],
    },
  },  
  // =================== Location ======================  
  {
    name: 'getAllLocations',
    description: 'Lấy danh sách toàn bộ địa bàn (tỉnh/xã) trong hệ thống',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getLocationOne',
    description: 'Lấy chi tiết một địa bàn theo id',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID địa bàn' },
      },
      required: ['id'],
    },
  },
  {
    name: 'addLocation',
    description: 'Thêm mới một địa bàn (chỉ admin, chỉ chấp nhận tỉnh Cần Thơ)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        province: { type: SchemaType.STRING, description: 'Tên tỉnh (bắt buộc là Cần Thơ)' },
        ward: { type: SchemaType.STRING, description: 'Tên xã/phường' },
        wardCode: { type: SchemaType.NUMBER, description: 'Mã xã/phường (duy nhất)' },
      },
      required: ['province', 'ward', 'wardCode'],
    },
  },
  {
    name: 'updateLocation',
    description: 'Cập nhật thông tin một địa bàn đã tồn tại (chỉ admin, chỉ chấp nhận tỉnh Cần Thơ)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID địa bàn cần cập nhật' },
        province: { type: SchemaType.STRING, description: 'Tên tỉnh (bắt buộc là Cần Thơ)' },
        ward: { type: SchemaType.STRING, description: 'Tên xã/phường' },
        wardCode: { type: SchemaType.NUMBER, description: 'Mã xã/phường (duy nhất)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteLocation',
    description: 'Xóa một địa bàn theo id (chỉ admin, sẽ báo lỗi nếu địa bàn đã có khách hàng hoặc đã được phân công cho nhân viên)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID địa bàn cần xóa' },
      },
      required: ['id'],
    },
  },
  {
    name: 'syncCanThoLocations',
    description: 'Đồng bộ danh sách địa bàn tỉnh Cần Thơ từ API bên ngoài (chỉ admin)',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  // =================== Invoice ======================  
  {
    name: 'getAllInvoices',
    description: 'Lấy danh sách toàn bộ hóa đơn',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'addInvoice',
    description: 'Tạo mới một hóa đơn',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        totalAmount: { type: SchemaType.NUMBER, description: 'Tổng tiền hóa đơn' },
        date: { type: SchemaType.STRING, description: 'Ngày lập hóa đơn (YYYY-MM-DD)' },
      },
      required: ['totalAmount', 'date'],
    },
  },
  {
    name: 'updateInvoice',
    description: 'Cập nhật một hóa đơn đã tồn tại (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID hóa đơn cần cập nhật' },
        totalAmount: { type: SchemaType.NUMBER, description: 'Tổng tiền hóa đơn' },
        date: { type: SchemaType.STRING, description: 'Ngày lập hóa đơn (YYYY-MM-DD)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteInvoice',
    description: 'Xóa một hóa đơn theo id (chỉ admin, sẽ báo lỗi nếu hóa đơn đã gắn với một hoạt động/đơn hàng)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID hóa đơn cần xóa' },
      },
      required: ['id'],
    },
  },  
  // =================== Import ======================  
  {
    name: 'getAllImports',
    description: 'Lấy danh sách toàn bộ phiếu nhập hàng',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getImportOne',
    description: 'Lấy chi tiết một phiếu nhập hàng theo id',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID phiếu nhập' },
      },
      required: ['id'],
    },
  },
  {
    name: 'addImport',
    description: 'Tạo mới một phiếu nhập hàng (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        supplierId: { type: SchemaType.NUMBER, description: 'ID nhà cung cấp' },
        importDate: { type: SchemaType.STRING, description: 'Ngày nhập hàng (YYYY-MM-DD)' },
        content: { type: SchemaType.STRING, description: 'Nội dung/ghi chú phiếu nhập' },
      },
      required: ['supplierId', 'importDate', 'content'],
    },
  },
  {
    name: 'updateImport',
    description: 'Cập nhật một phiếu nhập hàng đã tồn tại (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID phiếu nhập cần cập nhật' },
        supplierId: { type: SchemaType.NUMBER, description: 'ID nhà cung cấp' },
        importDate: { type: SchemaType.STRING, description: 'Ngày nhập hàng (YYYY-MM-DD)' },
        content: { type: SchemaType.STRING, description: 'Nội dung/ghi chú phiếu nhập' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteImport',
    description: 'Xóa một phiếu nhập hàng theo id (chỉ admin, sẽ báo lỗi nếu phiếu đã có chi tiết nhập hàng)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID phiếu nhập cần xóa' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteImportWithStockRollback',
    description: 'Xóa một phiếu nhập hàng và tự động hoàn trừ tồn kho tương ứng (chỉ admin, thao tác nguy hiểm không thể hoàn tác, dùng khi cần force delete phiếu đã có chi tiết)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID phiếu nhập cần xóa kèm hoàn tồn kho' },
      },
      required: ['id'],
    },
  },
  // =================== ImportDetail ======================  
  {
    name: 'getImportDetailsByImport',
    description: 'Lấy danh sách chi tiết (các dòng sản phẩm) của một phiếu nhập hàng',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        importId: { type: SchemaType.NUMBER, description: 'ID phiếu nhập' },
      },
      required: ['importId'],
    },
  },
  {
    name: 'addImportDetail',
    description: 'Thêm một dòng chi tiết sản phẩm vào phiếu nhập hàng, tự động cộng vào tồn kho (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        importId: { type: SchemaType.NUMBER, description: 'ID phiếu nhập' },
        productId: { type: SchemaType.NUMBER, description: 'ID sản phẩm' },
        quantity: { type: SchemaType.NUMBER, description: 'Số lượng nhập (phải > 0)' },
        importPrice: { type: SchemaType.NUMBER, description: 'Giá nhập (phải > 0)' },
      },
      required: ['importId', 'productId', 'quantity', 'importPrice'],
    },
  },
  {
    name: 'updateImportDetail',
    description: 'Cập nhật số lượng/giá nhập của một dòng chi tiết đã tồn tại, tự động điều chỉnh tồn kho theo chênh lệch (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        importId: { type: SchemaType.NUMBER, description: 'ID phiếu nhập' },
        productId: { type: SchemaType.NUMBER, description: 'ID sản phẩm' },
        quantity: { type: SchemaType.NUMBER, description: 'Số lượng nhập mới (phải > 0)' },
        importPrice: { type: SchemaType.NUMBER, description: 'Giá nhập mới (phải > 0)' },
      },
      required: ['importId', 'productId', 'quantity', 'importPrice'],
    },
  },
  {
    name: 'deleteImportDetail',
    description: 'Xóa một dòng chi tiết khỏi phiếu nhập hàng, tự động trừ lại tồn kho tương ứng (chỉ admin, sẽ báo lỗi nếu tồn kho hiện tại không đủ để trừ)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        importId: { type: SchemaType.NUMBER, description: 'ID phiếu nhập' },
        productId: { type: SchemaType.NUMBER, description: 'ID sản phẩm' },
      },
      required: ['importId', 'productId'],
    },
  },  
  // =================== Customer ======================  
  {
    name: 'getAllCustomers',
    description: 'Lấy danh sách khách hàng trong phạm vi được phép xem (admin: tất cả, nhân viên: chỉ khách trong địa bàn phụ trách)',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getPendingApprovalCustomers',
    description: 'Lấy danh sách khách hàng đang chờ duyệt (chỉ admin)',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getCustomerOne',
    description: 'Lấy chi tiết một khách hàng theo id, trong phạm vi được phép xem',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID khách hàng' },
      },
      required: ['id'],
    },
  },
  {
    name: 'getCustomerAccount',
    description: 'Lấy công nợ, số dư và lịch sử đơn hàng của một khách hàng',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        customerId: { type: SchemaType.NUMBER, description: 'ID khách hàng' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'addCustomer',
    description: 'Thêm mới một khách hàng vào một địa bàn (phải trong phạm vi được phép quản lý)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        locationId: { type: SchemaType.NUMBER, description: 'ID địa bàn' },
        companyName: { type: SchemaType.STRING, description: 'Tên công ty' },
        businessType: { type: SchemaType.STRING, description: 'Loại hình kinh doanh' },
        representativeName: { type: SchemaType.STRING, description: 'Tên người đại diện' },
        position: { type: SchemaType.STRING, description: 'Chức vụ người đại diện' },
        phoneNumber: { type: SchemaType.STRING, description: 'Số điện thoại' },
        lat: { type: SchemaType.NUMBER, description: 'Vĩ độ (tùy chọn)' },
        lng: { type: SchemaType.NUMBER, description: 'Kinh độ (tùy chọn)' },
      },
      required: ['locationId', 'companyName', 'businessType', 'representativeName', 'position', 'phoneNumber'],
    },
  },
  {
    name: 'updateCustomer',
    description: 'Cập nhật thông tin khách hàng đã tồn tại, trong phạm vi được phép quản lý',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID khách hàng cần cập nhật' },
        locationId: { type: SchemaType.NUMBER, description: 'ID địa bàn' },
        companyName: { type: SchemaType.STRING, description: 'Tên công ty' },
        businessType: { type: SchemaType.STRING, description: 'Loại hình kinh doanh' },
        representativeName: { type: SchemaType.STRING, description: 'Tên người đại diện' },
        position: { type: SchemaType.STRING, description: 'Chức vụ người đại diện' },
        phoneNumber: { type: SchemaType.STRING, description: 'Số điện thoại' },
        lat: { type: SchemaType.NUMBER, description: 'Vĩ độ (tùy chọn)' },
        lng: { type: SchemaType.NUMBER, description: 'Kinh độ (tùy chọn)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'approveCustomer',
    description: 'Duyệt một khách hàng đang chờ phê duyệt (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID khách hàng cần duyệt' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteCustomer',
    description: 'Xóa một khách hàng theo id (sẽ báo lỗi nếu khách hàng đã có hoạt động/đơn hàng)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID khách hàng cần xóa' },
      },
      required: ['id'],
    },
  },
  {
    name: 'receiveCustomerPayment',
    description: 'Ghi nhận một khoản thanh toán từ khách hàng, tự động phân bổ vào các đơn hàng còn nợ (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        customerId: { type: SchemaType.NUMBER, description: 'ID khách hàng' },
        amount: { type: SchemaType.NUMBER, description: 'Số tiền thanh toán (phải > 0)' },
        method: { type: SchemaType.STRING, description: 'Phương thức thanh toán' },
      },
      required: ['customerId', 'amount', 'method'],
    },
  },
  // =================== BankAccount ======================  
  {
    name: 'getAllBankAccounts',
    description: 'Lấy danh sách toàn bộ tài khoản ngân hàng của mọi nhân viên (chỉ admin)',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getBankAccountByUserId',
    description: 'Lấy thông tin tài khoản ngân hàng của một nhân viên theo userId (admin xem được của ai cũng được, nhân viên chỉ xem được của chính mình)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'addBankAccount',
    description: 'Thêm mới tài khoản ngân hàng cho một nhân viên (admin thêm cho ai cũng được, nhân viên chỉ thêm được cho chính mình)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên' },
        bankName: { type: SchemaType.STRING, description: 'Tên ngân hàng' },
        accountNumber: { type: SchemaType.STRING, description: 'Số tài khoản' },
      },
      required: ['userId', 'bankName', 'accountNumber'],
    },
  },
  {
    name: 'upsertBankAccount',
    description: 'Cập nhật hoặc tạo mới (nếu chưa có) tài khoản ngân hàng của một nhân viên (admin làm cho ai cũng được, nhân viên chỉ làm được cho chính mình)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên' },
        bankName: { type: SchemaType.STRING, description: 'Tên ngân hàng (tùy chọn)' },
        accountNumber: { type: SchemaType.STRING, description: 'Số tài khoản (tùy chọn)' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'deleteBankAccount',
    description: 'Xóa tài khoản ngân hàng của một nhân viên theo userId (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên cần xóa tài khoản ngân hàng' },
      },
      required: ['userId'],
    },
  },
  // =================== Activity ======================  
  {
    name: 'getAllActivities',
    description: 'Lấy danh sách hoạt động/đơn hàng trong phạm vi được phép xem (admin: tất cả, nhân viên: chỉ đơn của chính mình), kèm thông tin thanh toán',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'getActivityOne',
    description: 'Lấy chi tiết một hoạt động/đơn hàng theo id, trong phạm vi được phép xem',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID hoạt động/đơn hàng' },
      },
      required: ['id'],
    },
  },
  {
    name: 'addActivity',
    description: 'Tạo mới một đơn hàng ở trạng thái nháp (draft). Nhân viên chỉ tạo được đơn đứng tên chính mình và cho khách hàng trong địa bàn phụ trách',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên phụ trách đơn hàng' },
        customerId: { type: SchemaType.NUMBER, description: 'ID khách hàng' },
        activityDate: { type: SchemaType.STRING, description: 'Ngày lập đơn (YYYY-MM-DD)' },
        content: { type: SchemaType.STRING, description: 'Nội dung đơn hàng' },
      },
      required: ['userId', 'customerId', 'activityDate', 'content'],
    },
  },
  {
    name: 'updateActivity',
    description: 'Cập nhật một đơn hàng đang ở trạng thái nháp (draft). Chỉ sửa được đơn thuộc phạm vi được phép',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID hoạt động/đơn hàng cần cập nhật' },
        userId: { type: SchemaType.NUMBER, description: 'ID nhân viên phụ trách đơn hàng' },
        customerId: { type: SchemaType.NUMBER, description: 'ID khách hàng' },
        activityDate: { type: SchemaType.STRING, description: 'Ngày lập đơn (YYYY-MM-DD)' },
        content: { type: SchemaType.STRING, description: 'Nội dung đơn hàng' },
      },
      required: ['id'],
    },
  },
  {
    name: 'confirmActivityOrder',
    description: 'Xác nhận một đơn hàng nháp: tạo hóa đơn, kiểm tra tồn kho và chuyển đơn sang trạng thái đã xác nhận (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activityId: { type: SchemaType.NUMBER, description: 'ID đơn hàng cần xác nhận' },
      },
      required: ['activityId'],
    },
  },
  {
    name: 'advanceActivityStatus',
    description: 'Chuyển đơn hàng sang trạng thái kế tiếp trong quy trình. Khi chuyển từ "đang xử lý" sang "hoàn tất" sẽ tự động trừ tồn kho và tất toán các khoản thanh toán đang chờ (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activityId: { type: SchemaType.NUMBER, description: 'ID đơn hàng' },
        applyCustomerBalance: { type: SchemaType.BOOLEAN, description: 'Có dùng số dư có sẵn của khách hàng để tất toán hay không (tùy chọn)' },
      },
      required: ['activityId'],
    },
  },
  {
    name: 'deleteActivity',
    description: 'Xóa một đơn hàng, đồng thời xóa hóa đơn liên kết nếu có (chỉ admin)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.NUMBER, description: 'ID đơn hàng cần xóa' },
      },
      required: ['id'],
    },
  },
  // =================== ActivityDetail ======================  
  {
    name: 'getActivityDetailsByActivity',
    description: 'Lấy danh sách chi tiết (các dòng sản phẩm) của một đơn hàng, trong phạm vi được phép xem',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activityId: { type: SchemaType.NUMBER, description: 'ID đơn hàng' },
      },
      required: ['activityId'],
    },
  },
  {
    name: 'addActivityDetail',
    description: 'Thêm một dòng sản phẩm vào đơn hàng đang ở trạng thái có thể chỉnh sửa (nháp), tự động cập nhật lại tổng tiền hóa đơn nếu có',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activityId: { type: SchemaType.NUMBER, description: 'ID đơn hàng' },
        productId: { type: SchemaType.NUMBER, description: 'ID sản phẩm' },
        quantity: { type: SchemaType.NUMBER, description: 'Số lượng (phải > 0)' },
        salePrice: { type: SchemaType.NUMBER, description: 'Đơn giá bán' },
      },
      required: ['activityId', 'productId', 'quantity', 'salePrice'],
    },
  },
  {
    name: 'updateActivityDetail',
    description: 'Cập nhật số lượng/đơn giá của một dòng sản phẩm trong đơn hàng đang ở trạng thái có thể chỉnh sửa, tự động cập nhật lại tổng tiền hóa đơn nếu có',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activityId: { type: SchemaType.NUMBER, description: 'ID đơn hàng' },
        productId: { type: SchemaType.NUMBER, description: 'ID sản phẩm' },
        quantity: { type: SchemaType.NUMBER, description: 'Số lượng mới (phải > 0)' },
        salePrice: { type: SchemaType.NUMBER, description: 'Đơn giá bán mới' },
      },
      required: ['activityId', 'productId', 'quantity', 'salePrice'],
    },
  },
  {
    name: 'deleteActivityDetail',
    description: 'Xóa một dòng sản phẩm khỏi đơn hàng đang ở trạng thái có thể chỉnh sửa, tự động cập nhật lại tổng tiền hóa đơn nếu có',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activityId: { type: SchemaType.NUMBER, description: 'ID đơn hàng' },
        productId: { type: SchemaType.NUMBER, description: 'ID sản phẩm' },
      },
      required: ['activityId', 'productId'],
    },
  },
];