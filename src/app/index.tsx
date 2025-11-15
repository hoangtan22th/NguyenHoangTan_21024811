// File: app/index.tsx (Bổ sung Câu 9: Import API)
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
  // 1. Import ActivityIndicator (Câu 9)
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useState, useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { Expense } from "@/types/expense"; // Đảm bảo đúng đường dẫn
import { useFocusEffect } from "expo-router";
import {
  getAllExpenses,
  createExpense,
  togglePaidState,
  updateExpense,
  deleteExpense,
} from "@/db/db"; // Sửa lại đường dẫn nếu cần

const MOCK_API_URL =
  "https://68d7af372144ea3f6da61c02.mockapi.io/NguyenHoangTan21024811/Expense"; 

// Kiểu dữ liệu trả về từ API (Câu 9)
type ApiExpense = {
  id: string;
  title: string;
  amount: number;
  category: string;
};

// Hàm helper để format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Component ExpenseItem (Không thay đổi)
type ExpenseItemProps = {
  item: Expense;
  onToggle: (item: Expense) => void;
  onLongPress: (item: Expense) => void;
  onDelete: (id: number) => void;
};
const ExpenseItem = React.memo(
  ({ item, onToggle, onLongPress, onDelete }: ExpenseItemProps) => (
    <View style={styles.itemOuterContainer}>
      <TouchableOpacity
        onPress={() => onToggle(item)}
        onLongPress={() => onLongPress(item)}
        style={styles.itemContainer}
      >
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
      <View style={styles.deleteButtonContainer}>
        <Button title="Xóa" color="red" onPress={() => onDelete(item.id)} />
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
  const [searchQuery, setSearchQuery] = useState("");

  // --- 2. Thêm State Loading (Câu 9) ---
  const [isLoading, setIsLoading] = useState(false);
  // ------------------------------------

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

  // Dùng useMemo để lọc danh sách
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) =>
      expense.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  // (Các hàm xử lý Modal, Save, Toggle, Delete không thay đổi)
  // ...
  const closeAndResetModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setTitle("");
    setAmount("");
    setCategory("");
  };
  const handleOpenAddModal = () => {
    closeAndResetModal();
    setModalVisible(true);
  };
  const handleOpenEditModal = (item: Expense) => {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category || "");
    setModalVisible(true);
  };
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
  const handleTogglePaid = async (item: Expense) => {
    try {
      await togglePaidState(db, item.id, item.paid);
      await loadData();
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
    }
  };
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
              await loadData();
            } catch (e) {
              console.error(e);
              Alert.alert("Lỗi", "Không thể xóa chi tiêu.");
            }
          },
        },
      ]
    );
  };
  // ...

  // --- 3. Hàm Import API (Câu 9) ---
  const handleImport = async () => {
    setIsLoading(true); // Bắt đầu loading
    try {
      // 1. Gọi API
      const response = await fetch(MOCK_API_URL);
      if (!response.ok) {
        throw new Error("Lỗi mạng hoặc API");
      }
      const apiData: ApiExpense[] = await response.json();

      // 2. Lấy dữ liệu local để kiểm tra trùng
      const localData = await getAllExpenses(db);
      // Tạo một Set để kiểm tra (key = "title_amount") cho nhanh
      const localSet = new Set(
        localData.map((item) => `${item.title.toLowerCase()}_${item.amount}`)
      );

      let importedCount = 0;
      // 3. Loop qua dữ liệu API và Merge
      for (const apiItem of apiData) {
        const itemTitle = apiItem.title;
        // Đề bài nói map `price/amount` -> `amount`
        const itemAmount = apiItem.amount;
        const itemCategory = apiItem.category;

        const checkKey = `${itemTitle.toLowerCase()}_${itemAmount}`;

        // 4. Nếu title + amount chưa có, thì thêm vào
        if (!localSet.has(checkKey)) {
          await createExpense(db, {
            title: itemTitle,
            amount: itemAmount,
            category: itemCategory,
          });
          importedCount++;
        }
      }

      Alert.alert(
        "Thành công",
        `Đã import ${importedCount} khoản chi tiêu mới.`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể import từ API. Hãy kiểm tra link API.");
    } finally {
      // 5. Dừng loading và tải lại dữ liệu
      setIsLoading(false);
      await loadData();
    }
  };
  // -----------------------------------

  // Render khi rỗng
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Chưa có khoản chi tiêu nào.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Ô tìm kiếm (Câu 8) */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tiêu đề..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* --- 4. Nút Import và Loading (Câu 9) --- */}
      <View style={styles.importContainer}>
        <Button
          title="Import từ API"
          onPress={handleImport}
          disabled={isLoading} // Vô hiệu hóa khi đang load
        />
        {/* Hiện vòng xoay khi đang load */}
        {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
      </View>
      {/* -------------------------------------- */}

      {/* FlatList (Cập nhật data={filteredExpenses}) */}
      <FlatList
        data={filteredExpenses}
        renderItem={({ item }) => (
          <ExpenseItem
            item={item}
            onToggle={handleTogglePaid}
            onLongPress={handleOpenEditModal}
            onDelete={handleDeleteWithConfirm}
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
        <View style={styles.modalContainer}>{/* ... */}</View>
      </Modal>
    </View>
  );
}

// 5. Thêm Style cho Import (Câu 9)
const styles = StyleSheet.create({
  // ... (Tất cả style cũ giữ nguyên)
  container: {
    flex: 1,
    backgroundColor: "#f5f5ff",
  },
  searchContainer: {
    padding: 10,
    backgroundColor: "white",
  },
  searchInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  // --- Style cho Import (Câu 9) ---
  importContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    gap: 10, // Khoảng cách giữa nút và vòng xoay
  },
  // -------------------------------
  itemOuterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  itemContainer: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    elevation: 1,
  },
  deleteButtonContainer: {
    marginLeft: 10,
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
