"use client";

import { useState } from "react";
import { AddressForm } from "@/components/account/AddressForm";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { useDeleteAddressMutation, useUpdateAddressMutation } from "@/services/userApi";
import type { Address } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

export function AddressBook() {
  const { user } = useAuth();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [error, setError] = useState("");
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  if (!user) return null;

  const run = async (action: Promise<unknown>) => {
    setError("");
    try { await action; } catch (e) { setError(getErrorMessage(e)); }
  };

  if (editing) return <AddressForm initial={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />;

  return (
    <div className="space-y-6">
      {user.addresses.length === 0 ? (
        <div className="border border-dashed border-sand p-10 text-center">
          <p className="font-display text-2xl">No saved addresses yet</p>
          <p className="mb-6 mt-1 text-stone">Add one to check out faster.</p>
          <Button onClick={() => setEditing("new")} className="sm:w-auto">Add address</Button>
        </div>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {user.addresses.map((a) => (
              <li key={a._id} className="space-y-3 border border-sand bg-white p-5">
                {a.isDefault && <span className="inline-block bg-sand px-2 py-0.5 text-xs uppercase tracking-wider">Default</span>}
                <address className="not-italic leading-relaxed">
                  <strong>{a.fullName}</strong><br />
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                  {a.city}, {a.province}{a.postalCode ? ` ${a.postalCode}` : ""}<br />
                  {a.phone}
                </address>
                <div className="flex flex-wrap gap-4 text-sm">
                  <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1.5 underline underline-offset-4"><Pencil className="h-4 w-4" aria-hidden />Edit</button>
                  {!a.isDefault && a._id && (
                    <button type="button" onClick={() => run(updateAddress({ id: a._id!, changes: { isDefault: true } }).unwrap())} className="underline underline-offset-4">Make default</button>
                  )}
                  {a._id && (
                    <button type="button" onClick={() => window.confirm("Delete this address?") && run(deleteAddress(a._id!).unwrap())} className="inline-flex items-center gap-1.5 text-red-800 underline underline-offset-4"><Trash2 className="h-4 w-4" aria-hidden />Delete</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Button onClick={() => setEditing("new")} variant="outline" className="sm:w-auto">Add another address</Button>
        </>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
