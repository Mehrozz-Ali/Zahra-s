import type { Metadata } from "next";
import { AddressBook } from "@/components/account/AddressBook";

export const metadata: Metadata = { title: "Addresses" };

export default function AddressesPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Addresses</h1>
      <AddressBook />
    </div>
  );
}
