export type Expense = {
  id: number;
  title: string;
  amount: number;
  category?: string; // Tùy chọn [cite: 18, 47]
  paid: 0 | 1; // 0 là false, 1 là true [cite: 19]
  created_at: number; // Unix timestamp [cite: 20]
};