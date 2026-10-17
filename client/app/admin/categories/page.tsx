import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/categories/CategoryManager";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return <CategoryManager />;
}
