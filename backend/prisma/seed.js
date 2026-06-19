require("dotenv").config({ path: "./config/.env.development" });
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const SEED_PASSWORD = "123456";
const hashPassword = () => bcrypt.hash(SEED_PASSWORD, 12);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing for seed script");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PROVINCES_API_V2_BASE = "https://provinces.open-api.vn/api/v2";
const CAN_THO_PROVINCE_CODE = 92;
const CAN_THO_PROVINCE_NAME = "Thành phố Cần Thơ";
const WARD_DIVISION_TYPES = ["phường", "xã"];

async function syncCanThoLocations() {
  const response = await fetch(
    `${PROVINCES_API_V2_BASE}/p/${CAN_THO_PROVINCE_CODE}?depth=2`,
  );
  if (!response.ok) {
    throw new Error(`Provinces API failed: ${response.status}`);
  }
  const province = await response.json();
  const wards = province.wards.filter((w) =>
    WARD_DIVISION_TYPES.includes(w.division_type),
  );

  for (const ward of wards) {
    await prisma.location.upsert({
      where: { ward_code: ward.code },
      create: {
        province: CAN_THO_PROVINCE_NAME,
        ward: ward.name,
        ward_code: ward.code,
      },
      update: {
        province: CAN_THO_PROVINCE_NAME,
        ward: ward.name,
      },
    });
  }

  return wards.length;
}

const ORDER_STATUSES = [
  { status_code: "draft", status_name: "Nháp", sort_order: 1, is_terminal: false },
  {
    status_code: "confirmed",
    status_name: "Đã xác nhận",
    sort_order: 2,
    is_terminal: false,
  },
  {
    status_code: "processing",
    status_name: "Đang xử lý",
    sort_order: 3,
    is_terminal: false,
  },
  {
    status_code: "completed",
    status_name: "Hoàn thành",
    sort_order: 4,
    is_terminal: true,
  },
];

async function seedOrderStatuses() {
  for (const row of ORDER_STATUSES) {
    await prisma.orderStatus.upsert({
      where: { status_code: row.status_code },
      create: row,
      update: {
        status_name: row.status_name,
        sort_order: row.sort_order,
        is_terminal: row.is_terminal,
      },
    });
  }
}

/** Bảng lương theo tháng cho admin và nhân viên (3 tháng gần nhất). */
async function seedSalaries(users) {
  const year = 2026;
  const months = [3, 4, 5];

  const templates = {
    admin: [
      { base: 25000000, commission: 0, bonus: 2000000 },
      { base: 25000000, commission: 0, bonus: 2500000 },
      { base: 25000000, commission: 0, bonus: 3000000 },
    ],
    nhanvien01: [
      { base: 12000000, commission: 1800000, bonus: 500000 },
      { base: 12000000, commission: 2200000, bonus: 700000 },
      { base: 12000000, commission: 3100000, bonus: 1000000 },
    ],
    nhanvien02: [
      { base: 11500000, commission: 1500000, bonus: 400000 },
      { base: 11500000, commission: 1900000, bonus: 600000 },
      { base: 11500000, commission: 2400000, bonus: 800000 },
    ],
  };

  const byUsername = Object.fromEntries(users.map((u) => [u.username, u]));

  for (let i = 0; i < months.length; i++) {
    const month = months[i];
    for (const [username, rows] of Object.entries(templates)) {
      const user = byUsername[username];
      if (!user) continue;
      const row = rows[i];
      await prisma.salary.create({
        data: {
          user_id: user.user_id,
          month,
          year,
          base_salary: row.base.toFixed(2),
          commission: row.commission.toFixed(2),
          bonus: row.bonus.toFixed(2),
        },
      });
    }
  }
}

function loadProductsFromJson() {
  const filePath = path.join(__dirname, "..", "products.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("products.json must be a non-empty array");
  }

  return items.map((item) => ({
    product_name: item.product_name,
    unit_price: Number(item.unit_price).toFixed(2),
    stock_quantity: Number(item.stock_quantity),
  }));
}

/** Xáo trộn mảng theo seed cố định để seed chạy lại cho cùng kết quả. */
function shuffleDeterministic(items, seed = 20260517) {
  const arr = [...items];
  let state = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BUSINESS_TYPES = [
  "Thuong mai",
  "Phan phoi",
  "Xay dung",
  "Dich vu",
  "Nha hang",
  "Bia ruou",
];

const REPRESENTATIVE_NAMES = [
  "Nguyen Van C",
  "Tran Thi D",
  "Le Van E",
  "Pham Thi F",
  "Hoang Van G",
  "Vo Thi H",
  "Dang Van I",
  "Bui Thi K",
  "Do Van L",
  "Ngo Thi M",
  "Ly Van N",
  "Mai Thi O",
  "Truong Van P",
  "Huynh Thi Q",
  "Lam Van R",
  "Phan Thi S",
  "Cao Van T",
  "Duong Thi U",
  "Ton Van V",
  "Luong Thi X",
];

/** Tọa độ gần đúng quanh khu vực Cần Thơ (mỗi KH một điểm hơi lệch). */
function canThoCoords(index) {
  const lat = 10.01 + (index % 5) * 0.012 + (index % 3) * 0.003;
  const lng = 105.72 + Math.floor(index / 5) * 0.018 + (index % 4) * 0.004;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

function customerPhone(index) {
  return `09${String(index + 1).padStart(8, "0")}`;
}

/**
 * 20 khách hàng — mỗi KH một phường/xã khác nhau.
 * nhanvien01: 10 vùng đầu | nhanvien02: 10 vùng sau (không trùng nhau).
 */
async function seedCustomersAndEmployeeZones(sellerUser01, sellerUser02) {
  const allLocations = await prisma.location.findMany({
    where: { province: CAN_THO_PROVINCE_NAME },
    orderBy: { ward_code: "asc" },
  });

  if (allLocations.length < 20) {
    throw new Error(
      `Can Tho needs at least 20 wards for seed, got ${allLocations.length}`,
    );
  }

  const pickedLocations = shuffleDeterministic(allLocations).slice(0, 20);
  const zonesFor01 = pickedLocations.slice(0, 10);
  const zonesFor02 = pickedLocations.slice(10, 20);

  const customers = [];
  for (let i = 0; i < pickedLocations.length; i++) {
    const loc = pickedLocations[i];
    const coords = canThoCoords(i);
    const customer = await prisma.customer.create({
      data: {
        location_id: loc.location_id,
        company_name: `KH ${String(i + 1).padStart(2, "0")} - ${loc.ward}`,
        business_type: BUSINESS_TYPES[i % BUSINESS_TYPES.length],
        representative_name: REPRESENTATIVE_NAMES[i],
        position: i % 2 === 0 ? "Giam doc" : "Truong phong kinh doanh",
        phone_number: customerPhone(i),
        current_balance: `${((i + 1) * 750000).toFixed(2)}`,
        lat: coords.lat,
        lng: coords.lng,
        is_approved: true,
        approved_at: new Date(),
      },
    });
    customers.push(customer);
  }

  for (const loc of zonesFor01) {
    await prisma.employeeLocation.create({
      data: {
        user_id: sellerUser01.user_id,
        location_id: loc.location_id,
      },
    });
  }

  for (const loc of zonesFor02) {
    await prisma.employeeLocation.create({
      data: {
        user_id: sellerUser02.user_id,
        location_id: loc.location_id,
      },
    });
  }

  return {
    customers,
    zonesFor01: zonesFor01.map((l) => l.ward),
    zonesFor02: zonesFor02.map((l) => l.ward),
  };
}

async function main() {
  await seedOrderStatuses();

  await prisma.payment.deleteMany();
  await prisma.activityDetail.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.importDetail.deleteMany();
  await prisma.import.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.employeeLocation.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  const defaultPassword = await hashPassword();

  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      password: defaultPassword,
      role: "admin",
      full_name: "Quan tri vien",
      department: "IT",
      phone_number: "0900000000",
      email: "admin@company.com",
      is_activated: true
    },
  });
  const sellerUser01 = await prisma.user.create({
    data: {
      username: "nhanvien01",
      password: defaultPassword,
      role: "employee",
      full_name: "Nguyen Van A",
      department: "Sales",
      phone_number: "0912345678",
      email: "seller01@company.com",
      is_activated: true
    },
  });
  const sellerUser02 = await prisma.user.create({
    data: {
      username: "nhanvien02",
      password: defaultPassword,
      role: "employee",
      full_name: "Tran Thi B",
      department: "Marketing",
      phone_number: "0987654321",
      email: "seller02@company.com",
      is_activated: true
    },
  });

  const locationCount = await syncCanThoLocations();

  const { customers, zonesFor01, zonesFor02 } =
    await seedCustomersAndEmployeeZones(sellerUser01, sellerUser02);

  const staffUsers = [sellerUser01, sellerUser02];
  const allUsers = [adminUser, sellerUser01, sellerUser02];
  await seedSalaries(allUsers);

  const productRows = loadProductsFromJson();
  await prisma.product.createMany({ data: productRows });

  const products = await prisma.product.findMany({ orderBy: { product_id: "asc" } });

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        supplier_name: "Cong ty Phan Mem ABC",
        business_type: "Phan phoi phan mem",
        address: "123 Nguyen Van Cu, Q1, TP.HCM",
        phone_number: "0281234567",
        email: "contact@abc-soft.vn",
      },
    }),
    prisma.supplier.create({
      data: {
        supplier_name: "Nha cung cap TechVN",
        business_type: "Nhap khau thiet bi",
        address: "45 Le Loi, Hai Chau, Da Nang",
        phone_number: "0236378901",
        email: "sales@techvn.vn",
      },
    }),
    prisma.supplier.create({
      data: {
        supplier_name: "Dai ly SaaS Mekong",
        business_type: "Dich vu cloud",
        address: "88 Tran Hung Dao, Ninh Kieu, Can Tho",
        phone_number: "0292387654",
        email: "hello@mekongsaas.vn",
      },
    }),
  ]);

  const import1 = await prisma.import.create({
    data: {
      supplier_id: suppliers[0].supplier_id,
      import_date: new Date("2026-04-05T08:00:00Z"),
      content: "Nhap dot 1 quy 2",
    },
  });
  const import2 = await prisma.import.create({
    data: {
      supplier_id: suppliers[1].supplier_id,
      import_date: new Date("2026-04-20T14:30:00Z"),
      content: "Bo sung ton kho thang 4",
    },
  });

  if (products.length >= 3) {
    const importPrice = (unitPrice) =>
      Math.round(Number(unitPrice) * 0.85).toFixed(2);

    await prisma.importDetail.createMany({
      data: [
        {
          import_id: import1.import_id,
          product_id: products[0].product_id,
          quantity: 30,
          import_price: importPrice(products[0].unit_price),
        },
        {
          import_id: import1.import_id,
          product_id: products[2].product_id,
          quantity: 50,
          import_price: importPrice(products[2].unit_price),
        },
        {
          import_id: import2.import_id,
          product_id: products[1].product_id,
          quantity: 15,
          import_price: importPrice(products[1].unit_price),
        },
      ],
    });

    await prisma.product.update({
      where: { product_id: products[0].product_id },
      data: { stock_quantity: { increment: 30 } },
    });
    await prisma.product.update({
      where: { product_id: products[2].product_id },
      data: { stock_quantity: { increment: 50 } },
    });
    await prisma.product.update({
      where: { product_id: products[1].product_id },
      data: { stock_quantity: { increment: 15 } },
    });
  }

  let activities = [];
  if (staffUsers.length >= 2 && customers.length >= 11) {
    const draft1 = await prisma.activity.create({
      data: {
        user_id: staffUsers[0].user_id,
        customer_id: customers[0].customer_id,
        status: "draft",
        payment_status: "unpaid",
        activity_date: new Date("2026-05-11T09:30:00Z"),
        content: "Don hang dang soan thao (vung NV01)",
      },
    });
    const act2 = await prisma.activity.create({
      data: {
        user_id: staffUsers[0].user_id,
        customer_id: customers[1].customer_id,
        status: "confirmed",
        payment_status: "unpaid",
        activity_date: new Date("2026-05-02T08:00:00Z"),
        content: "Ghe tham va chot don hang (vung NV01)",
      },
    });
    const act3 = await prisma.activity.create({
      data: {
        user_id: staffUsers[1].user_id,
        customer_id: customers[10].customer_id,
        status: "processing",
        payment_status: "partial",
        activity_date: new Date("2026-05-16T15:00:00Z"),
        content: "Giao hang va thu tien (vung NV02)",
      },
    });
    activities = [draft1, act2, act3];
  }

  if (activities.length >= 3 && products.length >= 3) {
    const salePrice = (unitPrice, markup = 1) =>
      Math.round(Number(unitPrice) * markup).toFixed(2);

    await prisma.activityDetail.createMany({
      data: [
        {
          activity_id: activities[1].activity_id,
          product_id: products[0].product_id,
          quantity: 2,
          sale_price: salePrice(products[0].unit_price),
        },
        {
          activity_id: activities[1].activity_id,
          product_id: products[2].product_id,
          quantity: 1,
          sale_price: salePrice(products[2].unit_price),
        },
        {
          activity_id: activities[2].activity_id,
          product_id: products[0].product_id,
          quantity: 3,
          sale_price: salePrice(products[0].unit_price, 0.98),
        },
      ],
    });

    const total2 =
      Number(salePrice(products[0].unit_price)) * 2 +
      Number(salePrice(products[2].unit_price));
    const inv2 = await prisma.invoice.create({
      data: {
        total_amount: total2.toFixed(2),
        date: new Date("2026-05-02T08:00:00Z"),
      },
    });
    await prisma.activity.update({
      where: { activity_id: activities[1].activity_id },
      data: { invoice_id: inv2.invoice_id, payment_status: "unpaid" },
    });

    const total3 = Number(salePrice(products[0].unit_price, 0.98)) * 3;
    const inv3 = await prisma.invoice.create({
      data: {
        total_amount: total3.toFixed(2),
        date: new Date("2026-05-16T15:00:00Z"),
      },
    });
    await prisma.activity.update({
      where: { activity_id: activities[2].activity_id },
      data: { invoice_id: inv3.invoice_id, payment_status: "partial" },
    });

    const partialPaid = Math.floor(total3 / 2);
    await prisma.payment.create({
      data: {
        activity_id: activities[2].activity_id,
        paid_amount: partialPaid.toFixed(2),
        payment_date: new Date("2026-05-17T10:00:00Z"),
        method: "Chuyen khoan",
      },
    });
  }

  const invoiceCount = await prisma.invoice.count();
  const activityCount = await prisma.activity.count();
  const activityDetailCount = await prisma.activityDetail.count();
  const paymentCount = await prisma.payment.count();
  const salaryCount = await prisma.salary.count();
  const supplierCount = await prisma.supplier.count();
  const importCount = await prisma.import.count();
  const importDetailCount = await prisma.importDetail.count();

  console.log("Seed completed:", {
    adminUserId: adminUser.user_id,
    staffUserIds: staffUsers.map((u) => u.user_id),
    canThoLocationCount: locationCount,
    customerCount: customers.length,
    nhanvien01Zones: zonesFor01,
    nhanvien02Zones: zonesFor02,
    productCount: products.length,
    supplierCount,
    importCount,
    importDetailCount,
    invoiceCount,
    activityCount,
    activityDetailCount,
    paymentCount,
    salaryCount,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
