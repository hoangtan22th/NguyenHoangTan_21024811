// File: app/index.tsx
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItemInfo,
} from "react-native";
import React, { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { Expense } from "@/types/expense"; // Đảm bảo đúng đường dẫn
import { useFocusEffect } from "expo-router";
import { getAllExpenses } from "@/db/db";

// Hàm helper để format tiền tệ [cite: 36]
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Component con để render 1 item [cite: 36]
const ExpenseItem = React.memo(({ item }: { item: Expense }) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemMain}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
    </View>
    <View style={styles.itemDetails}>
      <Text style={styles.itemCategory}>{item.category || "Không có"}</Text>
      <Text style={item.paid ? styles.paid : styles.unpaid}>
        {item.paid ? "Đã trả" : "Chưa trả"}
      </Text>
    </View>
  </View>
));

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Hàm để load dữ liệu từ DB
  const loadData = useCallback(async () => {
    console.log("Loading data for home screen...");
    const data = await getAllExpenses(db);
    setExpenses(data);
  }, [db]);

  // Dùng useFocusEffect để load lại data mỗi khi quay lại màn hình [cite: 38]
  // (Tốt hơn useEffect thông thường)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Component hiển thị khi danh sách rỗng [cite: 39]
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Chưa có khoản chi tiêu nào.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={({ item }) => <ExpenseItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

// Thêm một số style cơ bản
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  itemContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1, // Shadow cho Android
  },
  itemMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  itemCategory: {
    fontSize: 14,
    color: "gray",
  },
  paid: {
    fontSize: 14,
    color: "green",
    fontWeight: "bold",
  },
  unpaid: {
    fontSize: 14,
    color: "orange",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    marginTop: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "gray",
  },
});
