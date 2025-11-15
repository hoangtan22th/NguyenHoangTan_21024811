// File: app/index.tsx
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  // Thêm các import cho Câu 4
  Modal,
  TextInput,
  Button,
  Pressable,
  Alert,
} from "react-native";
import React, { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { Expense } from "@/types/expense"; 
import { useFocusEffect } from "expo-router";
import { createExpense, getAllExpenses } from "@/db/db";
// Hàm helper để format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Component con để render 1 item
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

  // --- State cho Modal và Form (Câu 4) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  // ----------------------------------------

  // Hàm để load dữ liệu từ DB
  const loadData = useCallback(async () => {
    console.log("Loading data for home screen...");
    const data = await getAllExpenses(db);
    setExpenses(data);
  }, [db]);

  // Dùng useFocusEffect để load lại data mỗi khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // --- Hàm xử lý lưu (Câu 4) ---
  const handleSave = async () => {
    // Validate: title không rỗng
    if (!title.trim()) {
      Alert.alert("Lỗi", "Tiêu đề (title) là bắt buộc.");
      return;
    }

    // Validate: amount là số hợp lệ và > 0
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Lỗi", "Số tiền (amount) phải là một số lớn hơn 0.");
      return;
    }

    try {
      // Lưu vào DB
      await createExpense(db, { title, amount: parsedAmount, category });

      // Cập nhật lại danh sách
      await loadData();

      // Đóng modal và reset form
      setModalVisible(false);
      setTitle("");
      setAmount("");
      setCategory("");
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể lưu chi tiêu.");
    }
  };
  // ---------------------------------

  // Component hiển thị khi danh sách rỗng
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

      {/* --- Nút "+" để mở Modal (Câu 4) --- */}
      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* --- Modal thêm mới (Câu 4) --- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm Chi Tiêu Mới</Text>
            <TextInput
              style={styles.input}
              placeholder="Tiêu đề (bắt buộc)"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Số tiền (bắt buộc)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Danh mục (tùy chọn)"
              value={category}
              onChangeText={setCategory}
            />
            <View style={styles.buttonGroup}>
              <Button
                title="Hủy"
                onPress={() => setModalVisible(false)}
                color="red"
              />
              <Button title="Lưu" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
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
  // --- Styles cho Modal và FAB (Câu 4) ---
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    color: "white",
    lineHeight: 30, // Căn giữa dấu +
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  // --------------------------------------
});