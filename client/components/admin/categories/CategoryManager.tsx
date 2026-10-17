"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import { getErrorMessage } from "@/lib/errors";
import { useDeleteCategoryMutation, useGetAdminCategoriesQuery, useUpdateCategoryMutation } from "@/services/categoryApi";
import type { Category } from "@/types";
import { IconAction } from "@/components/ui/IconAction";

export function CategoryManager() {
  const { data, isLoading, error, refetch } = useGetAdminCategoriesQuery(undefined, { refetchOnMountOrArgChange: true });
  const [update] = useUpdateCategoryMutation();
  const [remove] = useDeleteCategoryMutation();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (action: () => Promise<string>) => {
    setMessage(null);
    try { setMessage({ ok: true, text: await action() }); } catch (e) { setMessage({ ok: false, text: getErrorMessage(e) }); }
  };

  const toggle = (c: Category) => run(async () => (await update({ id: c._id, changes: { isActive: !c.isActive } }).unwrap(), c.isActive ? `"${c.name}" is now hidden from the store.` : `"${c.name}" is now visible in the store.`));
  const restore = (c: Category) => run(async () => (await update({ id: c._id, changes: { isArchived: false } }).unwrap(), `"${c.name}" was restored. It is hidden until you make it visible.`));
  const del = (c: Category) => window.confirm(c.productCount > 0 ? `"${c.name}" has ${c.productCount} article(s), so it will be archived (hidden) instead of deleted. Continue?` : `Delete "${c.name}"? This cannot be undone.`) &&
    run(async () => (await remove(c._id).unwrap()).message);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-5xl">Categories</h1><p className="text-sm text-stone">Articles are placed in a category, and the store builds its menus and collections from this list.</p></div>
        {!editing && <button type="button" onClick={() => { setMessage(null); setEditing("new"); }} className="bg-ink px-6 py-3 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">New category</button>}
      </div>

      {editing && <CategoryForm category={editing === "new" ? undefined : editing} onDone={(text) => { setEditing(null); if (text) setMessage({ ok: true, text }); }} />}
      {message && <p role={message.ok ? "status" : "alert"} className={clsx("p-3 text-sm", message.ok ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800")}>{message.text}</p>}

      {isLoading ? <div role="status" aria-label="Loading categories" className="h-48 animate-pulse bg-sand/60 motion-reduce:animate-none" /> : error || !data ? (
        <p role="alert" className="bg-red-50 p-4 text-red-800">{getErrorMessage(error, "Categories could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : data.length === 0 ? (
        <p className="border border-sand bg-white p-10 text-center text-stone">No categories yet. Create one before adding articles.</p>
      ) : (
        <div className="relative overflow-x-auto border border-sand bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-sand text-stone">{["Image", "Name", "Articles", "Order", "Status", "Actions"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id} className={clsx("border-b border-sand/60 align-middle last:border-0", c.isArchived && "text-stone")}>
                  <td className="px-4 py-3"><span className="relative block h-14 w-11 overflow-hidden bg-sand">{c.image && <Image src={c.image.url} alt="" fill sizes="44px" className="object-cover" />}</span></td>
                  <th scope="row" className="px-4 py-3 font-medium">{c.name}<span className="block text-xs font-normal text-stone">/category/{c.slug}</span></th>
                  <td className="px-4 py-3 tabular-nums">{c.productCount}</td>
                  <td className="px-4 py-3 tabular-nums">{c.sortOrder}</td>
                  <td className="px-4 py-3"><span className={clsx("inline-block px-2 py-0.5 text-xs font-medium", c.isArchived ? "bg-red-50 text-red-900" : c.isActive ? "bg-green-50 text-green-900" : "bg-stone/10 text-stone")}>{c.isArchived ? "Archived" : c.isActive ? "Visible" : "Hidden"}</span></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      <IconAction icon="edit" label={`Edit ${c.name}`} onClick={() => { setMessage(null); setEditing(c); }} />
                      {c.isArchived ? <IconAction icon="restore" label={`Restore ${c.name}`} onClick={() => restore(c)} />
                        : <IconAction icon={c.isActive ? "hide" : "view"} label={c.isActive ? `Hide ${c.name} from the store` : `Show ${c.name} in the store`} onClick={() => toggle(c)} />}
                      <IconAction icon={!c.isArchived && c.productCount > 0 ? "archive" : "delete"} tone="danger" label={`${!c.isArchived && c.productCount > 0 ? "Archive" : "Delete"} ${c.name}`} onClick={() => del(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
