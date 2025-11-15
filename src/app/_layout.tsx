import { SQLiteProvider } from "expo-sqlite";
import "../global.css";
import { Slot, Stack } from "expo-router";
import { initTable } from "@/db/db";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="expenses.db" onInit={initTable}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Expense Notes" }} />
      </Stack>
    </SQLiteProvider>
  );
}