// File: db.ts
import { SQLiteDatabase } from "expo-sqlite";

/**
 * Hàm này được gọi bởi SQLiteProvider onInit
 * Nó sẽ tạo bảng và seed dữ liệu mẫu (nếu cần).
 */
export const initTable = async (db: SQLiteDatabase) => {
  console.log("Initializing database table...");

  // Câu 2: Tạo bảng expenses nếu chưa tồn tại [cite: 29]
  // Dựa theo cấu trúc đề bài [cite: 13, 15, 16, 17, 18, 19, 20]
  const query = `
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      paid INTEGER DEFAULT 1,
      created_at INTEGER
    )
  `;

  await db.execAsync(query);
  console.log("Table 'expenses' created successfully.");

  // Câu 2: (Tùy chọn) Seed 2-3 khoản chi tiêu mẫu [cite: 30]
  // Chúng ta kiểm tra xem bảng có rỗng không trước khi thêm
  const countResult = await db.getFirstAsync<{ "COUNT(*)": number }>(
    "SELECT COUNT(*) FROM expenses"
  );

  if (countResult && countResult["COUNT(*)"] === 0) {
    console.log("Seeding sample data...");
    // Lưu ý: created_at [cite: 20] là INTEGER, ta dùng Unix timestamp (số giây)
    const now = Math.floor(Date.now() / 1000);

    await db.runAsync(
      "INSERT INTO expenses (title, amount, category, paid, created_at) VALUES (?, ?, ?, ?, ?)",
      ["Cà phê", 30000, "Đồ uống", 1, now]
    );
    await db.runAsync(
      "INSERT INTO expenses (title, amount, category, paid, created_at) VALUES (?, ?, ?, ?, ?)",
      ["Ăn trưa", 50000, "Ăn uống", 1, now]
    );
    console.log("Sample data seeded.");
  } else {
    console.log("Database already contains data, skipping seed.");
  }
};