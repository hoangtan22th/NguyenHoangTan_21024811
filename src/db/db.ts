// File: db.ts
import { Expense } from "@/types/expense";
import { SQLiteDatabase } from "expo-sqlite";

/**
 * Hàm này được gọi bởi SQLiteProvider onInit
 * Nó sẽ tạo bảng và seed dữ liệu mẫu (nếu cần).
 */
// Kiểu dữ liệu cho việc tạo mới
type CreateExpenseInput = Pick<Expense, "title" | "amount" | "category">;
// Kiểu dữ liệu cho việc cập nhật (Câu 6)
type UpdateExpenseInput = Pick<Expense, "id" | "title" | "amount" | "category">;
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

export const getAllExpenses = async (
  db: SQLiteDatabase
): Promise<Expense[]> => {
  console.log("Fetching all expenses...");
  // Sắp xếp theo ngày tạo mới nhất
  return await db.getAllAsync<Expense>(
    "SELECT * FROM expenses ORDER BY created_at DESC"
  );
};

export const createExpense = async (
  db: SQLiteDatabase,
  data: CreateExpenseInput
) => {
  console.log("Creating new expense:", data.title);
  const now = Math.floor(Date.now() / 1000); // Unix timestamp

  await db.runAsync(
    "INSERT INTO expenses (title, amount, category, paid, created_at) VALUES (?, ?, ?, ?, ?)",
    [data.title, data.amount, data.category || null, 1, now]
  );
};

/**
 * Hàm cập nhật trạng thái paid (Câu 5) 
 */
export const togglePaidState = async (
  db: SQLiteDatabase,
  id: number,
  currentPaid: 0 | 1
) => {
  // Đảo ngược trạng thái: 1 -> 0, 0 -> 1 
  const newPaidState = currentPaid === 1 ? 0 : 1;
  console.log(`Toggling paid state for id ${id} to ${newPaidState}`);
  await db.runAsync("UPDATE expenses SET paid = ? WHERE id = ?", [
    newPaidState,
    id,
  ]);
};

/**
 * Hàm cập nhật chi tiêu (Câu 6)
 */
export const updateExpense = async (
  db: SQLiteDatabase,
  data: UpdateExpenseInput
) => {
  console.log(`Updating expense id ${data.id}`);
  await db.runAsync(
    "UPDATE expenses SET title = ?, amount = ?, category = ? WHERE id = ?",
    [data.title, data.amount, data.category || null, data.id]
  );
};
/**
 * Hàm xóa chi tiêu (Câu 7)
 */
export const deleteExpense = async (db: SQLiteDatabase, id: number) => {
  console.log(`Deleting expense id ${id}`);
  await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
};