require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

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

async function main() {
  await prisma.activityDetail.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      password: "123456",
      role: "admin",
      fullname: "Quan tri vien",
      department: "IT",
      phone_number: "0900000000",
      email: "admin@company.com",
    },
  });
  const staffUser01 = await prisma.user.create({
    data: {
      username: "nhanvien01",
      password: "123456",
      role: "employee",
      fullname: "Nguyen Van A",
      department: "Sales",
      phone_number: "0912345678",
      email: "a.sales@company.com",
    },
  });
  const staffUser02 = await prisma.user.create({
    data: {
      username: "nhanvien02",
      password: "123456",
      role: "employee",
      fullname: "Tran Thi B",
      department: "Marketing",
      phone_number: "0987654321",
      email: "b.mkt@company.com",
    },
  });

  const locationCount = await syncCanThoLocations();
  const locNinhKieu = await prisma.location.findFirst({
    where: { ward: "Phường Ninh Kiều" },
  });
  const locCaiRang = await prisma.location.findFirst({
    where: { ward: "Phường Cái Răng" },
  });
  const locBinhThuy = await prisma.location.findFirst({
    where: { ward: "Phường Bình Thủy" },
  });

  const customers = [];
  if (locNinhKieu) {
    customers.push(
      await prisma.customer.create({
        data: {
          location_id: locNinhKieu.location_id,
          company_name: "Cong ty TNHH Mau",
          business_type: "Thuong mai",
          representative_name: "Nguyen Van C",
          position: "Giam doc",
          phone_number: "0901112233",
          current_balance: "15000000.00",
        },
      }),
    );
  }
  if (locCaiRang) {
    customers.push(
      await prisma.customer.create({
        data: {
          location_id: locCaiRang.location_id,
          company_name: "Dai ly Phan Phoi ABC",
          business_type: "Phan phoi",
          representative_name: "Tran Thi D",
          position: "Truong phong kinh doanh",
          phone_number: "0912223344",
          current_balance: "8500000.00",
        },
      }),
    );
  }
  if (locBinhThuy) {
    customers.push(
      await prisma.customer.create({
        data: {
          location_id: locBinhThuy.location_id,
          company_name: "Xay dung XYZ",
          business_type: "Xay dung",
          representative_name: "Le Van E",
          position: "Chu tich",
          phone_number: "0923334455",
          current_balance: "22000000.00",
        },
      }),
    );
  }

  const staffUsers = [staffUser01, staffUser02];

  await prisma.product.createMany({
    data: [
      {
        product_name: "CRM Basic Package",
        unit_price: "2990000.00",
        stock_quantity: 50,
      },
      {
        product_name: "Sales Dashboard Pro",
        unit_price: "5990000.00",
        stock_quantity: 25,
      },
      {
        product_name: "Email Automation Tool",
        unit_price: "1990000.00",
        stock_quantity: 100,
      },
    ],
  });

  const products = await prisma.product.findMany({ orderBy: { product_id: "asc" } });

  let activities = [];
  if (staffUsers.length >= 2 && customers.length >= 3) {
    const draft1 = await prisma.activity.create({
      data: {
        user_id: staffUsers[0].user_id,
        customer_id: customers[0].customer_id,
        status: "draft",
        activity_date: new Date("2026-05-11T09:30:00Z"),
        content: "Don hang dang soan thao",
      },
    });
    const act2 = await prisma.activity.create({
      data: {
        user_id: staffUsers[0].user_id,
        customer_id: customers[1].customer_id,
        status: "confirmed",
        activity_date: new Date("2026-05-02T08:00:00Z"),
        content: "Ghe tham va chot don hang",
      },
    });
    const act3 = await prisma.activity.create({
      data: {
        user_id: staffUsers[1].user_id,
        customer_id: customers[2].customer_id,
        status: "processing",
        activity_date: new Date("2026-05-16T15:00:00Z"),
        content: "Giao hang va thu tien",
      },
    });
    activities = [draft1, act2, act3];
  }

  if (activities.length >= 3 && products.length >= 3) {
    await prisma.activityDetail.createMany({
      data: [
        {
          activity_id: activities[1].activity_id,
          product_id: products[0].product_id,
          quantity: 2,
          sale_price: "3100000.00",
        },
        {
          activity_id: activities[1].activity_id,
          product_id: products[2].product_id,
          quantity: 1,
          sale_price: "1890000.00",
        },
        {
          activity_id: activities[2].activity_id,
          product_id: products[0].product_id,
          quantity: 3,
          sale_price: "2950000.00",
        },
      ],
    });

    const total2 = 3100000 * 2 + 1890000;
    const inv2 = await prisma.invoice.create({
      data: {
        total_amount: total2.toFixed(2),
        date: new Date("2026-05-02T08:00:00Z"),
        status: "unpaid",
      },
    });
    await prisma.activity.update({
      where: { activity_id: activities[1].activity_id },
      data: { invoice_id: inv2.invoice_id },
    });

    const total3 = 2950000 * 3;
    const inv3 = await prisma.invoice.create({
      data: {
        total_amount: total3.toFixed(2),
        date: new Date("2026-05-16T15:00:00Z"),
        status: "partial",
      },
    });
    await prisma.activity.update({
      where: { activity_id: activities[2].activity_id },
      data: { invoice_id: inv3.invoice_id },
    });
  }

  const invoiceCount = await prisma.invoice.count();
  const activityCount = await prisma.activity.count();
  const activityDetailCount = await prisma.activityDetail.count();

  console.log("Seed completed:", {
    adminUserId: adminUser.user_id,
    staffUserIds: staffUsers.map((u) => u.user_id),
    canThoLocationCount: locationCount,
    customerCount: customers.length,
    invoiceCount,
    activityCount,
    activityDetailCount,
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
