import type { Metadata } from "next";
import { CustomerManager } from "@/components/admin/customers/CustomerManager";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return <CustomerManager />;
}
