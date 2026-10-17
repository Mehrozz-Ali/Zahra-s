import type { Metadata } from "next";
import { CustomerDetail } from "@/components/admin/customers/CustomerDetail";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetail id={id} />;
}
