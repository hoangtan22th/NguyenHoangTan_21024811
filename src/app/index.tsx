// File: app/index.tsx (ĐÃ SỬA LỖI GIAO DIỆN CÂU 7)
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Button,
  Pressable,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { Expense } from "@/types/expense"; // Đảm bảo đúng đường dẫn
import { useFocusEffect } from "expo-router";
// Thêm import deleteExpense cho Câu 7
import {
  getAllExpenses,
  createExpense,
  togglePaidState,
  updateExpense,
  deleteExpense, // Import hàm mới
} from "@/db/db";

// Hàm helper để format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// --- Cập nhật ExpenseItem (ĐÃ SỬA LỖI GIAO DIỆN) ---
type ExpenseItemProps = {
  item: Expense;
  onToggle: (item: Expense) => void;
  onLongPress: (item: Expense) => void;
  onDelete: (id: number) => void;
};

const ExpenseItem = React.memo(
  ({ item, onToggle, onLongPress, onDelete }: ExpenseItemProps) => (
    <View style={styles.itemOuterContainer}>
      {/* SỬA LỖI: Biến TouchableOpacity thành itemContainer chính
        và gán style={styles.itemContainer} (có flex: 1) cho nó.
      */}
      <TouchableOpacity
        onPress={() => onToggle(item)}
        onLongPress={() => onLongPress(item)}
        style={styles.itemContainer} // <--- SỬA Ở ĐÂY
      >
        {/* Bỏ đi 1 View thừa bọc bên ngoài */}
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
      </TouchableOpacity>
      
      {/* Nút Xóa (Câu 7) */}
      <View style={styles.deleteButtonContainer}>
        <Button
          title="Xóa"
          color="red"
          onPress={() => onDelete(item.id)}
        />
      </View>
    </View>
  )
);
// ------------------------------------

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Hàm load dữ liệu
  const loadData = useCallback(async () => {
    console.log("Loading data for home screen...");
    const data = await getAllExpenses(db);
    setExpenses(data);
  }, [db]);

  // Load data khi focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Hàm đóng/reset Modal
  const closeAndResetModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setTitle("");
    setAmount("");
    setCategory("");
  };

  // Hàm mở Modal Thêm
  const handleOpenAddModal = () => {
    closeAndResetModal();
    setModalVisible(true);
  };

  // Hàm mở Modal Sửa
  const handleOpenEditModal = (item: Expense) => {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category || "");
    setModalVisible(true);
  };

  // Hàm Lưu (Thêm/Sửa)
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Tiêu đề (title) là bắt buộc.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Lỗi", "Số tiền (amount) phải là một số lớn hơn 0.");
      return;
    }

    try {
      const dataToSave = { title, amount: parsedAmount, category };
      if (editingId) {
        await updateExpense(db, { ...dataToSave, id: editingId });
      } else {
        await createExpense(db, dataToSave);
      }
      await loadData();
      closeAndResetModal();
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể lưu chi tiêu.");
    }
  };

  // Hàm Toggle Paid
  const handleTogglePaid = async (item: Expense) => {
    try {
      await togglePaidState(db, item.id, item.paid);
      await loadData();
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
    }
  };

  // --- Hàm xử lý Xóa có xác nhận (Câu 7) ---
  const handleDeleteWithConfirm = (id: number) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa khoản chi tiêu này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(db, id);
              await loadData(); // Tải lại danh sách sau khi xóa
            } catch (e) {
              console.error(e);
              Alert.alert("Lỗi", "Không thể xóa chi tiêu.");
            }
          },
        },
      ]
    );
  };
  // ------------------------------------------

  // Render khi rỗng
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Chưa có khoản chi tiêu nào.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <ExpenseItem
            item={item}
            onToggle={handleTogglePaid}
            onLongPress={handleOpenEditModal}
            onDelete={handleDeleteWithConfirm} // Thêm prop (Câu 7)
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: 10 }}
      />

      {/* Nút "+" */}
      <Pressable style={styles.fab} onPress={handleOpenAddModal}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Modal Thêm/Sửa */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAndResetModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? "Sửa Chi Tiêu" : "Thêm Chi Tiêu Mới"}
            </Text>
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
                onPress={closeAndResetModal}
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

// Giữ nguyên Styles, không cần thay đổi
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  // Container bên ngoài để chứa nút xóa (Câu 7)
  itemOuterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  // Style cho item (Câu 7)
  itemContainer: {
    flex: 1, // Để item co giãn
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    elevation: 1,
  },
  // Style cho nút xóa (Câu 7)
  deleteButtonContainer: {
    marginLeft: 10,
    // Bỏ padding 5 vì Button tự có padding
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
    lineHeight: 30,
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
});