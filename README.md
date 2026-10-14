# Business Management

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Mô tả
Hệ thống quản lý hoạt động kinh doanh, khách hàng, sản phẩm, nhập kho, thanh toán và nhân sự. Dự án gồm frontend Next.js và backend Express, Prisma, PostgreSQL.

## Công nghệ sử dụng
- **Express:** framework backend gọn nhẹ, linh hoạt và phù hợp để xây dựng REST API theo cấu trúc Route → Service → Repository.
- **JWT:** hỗ trợ xác thực không lưu trạng thái, dễ mở rộng và được lưu trong HTTP-only cookie để hạn chế nguy cơ truy cập token từ JavaScript phía client.
- **Next.js:** xây dựng giao diện React có hiệu năng tốt và tổ chức trang theo App Router.
- **Prisma + PostgreSQL:** cung cấp truy vấn có kiểu dữ liệu an toàn, migration rõ ràng và khả năng quản lý dữ liệu quan hệ ổn định.

## API Endpoints
| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập và cấp token xác thực |
| `GET` | `/api/products/all` | Lấy danh sách sản phẩm |
| `POST` | `/api/products/add` | Thêm sản phẩm mới |

## Yêu cầu
- Node.js >= 22
- npm >= 10
- PostgreSQL

## Cài đặt
```bash
git clone https://github.com/quoctuan1908/Business-Management.git
cd Business-Management

cd backend
npm install

cd ../frontend
npm install
```