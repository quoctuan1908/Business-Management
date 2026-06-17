import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getVietnamTime() {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hash: Record<string, string> = {};
  parts.forEach((p) => {
    hash[p.type] = p.value;
  });

  // Trả về chuỗi ngày giờ đầy đủ và chuỗi ngày riêng biệt
  const fullDateTime = `${hash.year}-${hash.month}-${hash.day} ${hash.hour}:${hash.minute}:${hash.second}`;
  const dateOnly = `${hash.year}-${hash.month}-${hash.day}`;

  return { fullDateTime, dateOnly };
}

function writeLog(level: "INFO" | "WARN" | "ERROR", actor: string, message: string) {
  const { fullDateTime, dateOnly } = getVietnamTime();

  const fileName = `logs-${dateOnly}.txt`;
  const filePath = path.join(LOG_DIR, fileName);

  const logLine = `[${fullDateTime}] [${level}] [${actor}] ${message}\n`;

  fs.appendFile(filePath, logLine, "utf8", (err) => {
    if (err) {
      console.error("❌ Không thể ghi file log hành động:", err);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(logLine.trim());
  }
}

export const logger = {
  /**
   * Ghi nhận các hoạt động bình thường thành công (Đăng nhập, đăng ký tuyến...)
   * @param actor Mã nhân viên hoặc tên hệ thống (Ví dụ: 'NV-001', 'SYSTEM')
   * @param message Nội dung chi tiết
   */
  info: (actor: string, message: string) => writeLog("INFO", actor, message),

  /**
   * Ghi nhận các cảnh báo hoặc hành động bị từ chối (Trùng địa bàn, sai mật khẩu...)
   */
  warn: (actor: string, message: string) => writeLog("WARN", actor, message),

  /**
   * Ghi nhận lỗi hệ thống nghiêm trọng (Sập API bên thứ 3, lỗi query DB...)
   */
  error: (actor: string, message: string) => writeLog("ERROR", actor, message),
};