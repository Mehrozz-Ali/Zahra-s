"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { IconAction } from "@/components/ui/IconAction";
import { BannerForm } from "@/components/admin/banners/BannerForm";
import { getErrorMessage } from "@/lib/errors";
import { useDeleteBannerMutation, useGetAdminBannersQuery, useReorderBannersMutation, useUpdateBannerMutation } from "@/services/bannerApi";
import type { Banner } from "@/types";

const MAX_BANNERS = 8; // keep in sync with the server

export function BannerManager() {
  const { data, isLoading, error, refetch } = useGetAdminBannersQuery(undefined, { refetchOnMountOrArgChange: true });
  const [update] = useUpdateBannerMutation();
  const [reorder] = useReorderBannersMutation();
  const [remove] = useDeleteBannerMutation();
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (action: () => Promise<string>) => {
    setMessage(null);
    try { setMessage({ ok: true, text: await action() }); } catch (e) { setMessage({ ok: false, text: getErrorMessage(e) }); }
  };

  const toggle = (b: Banner) => run(async () => (await update({ id: b._id, changes: { isActive: !b.isActive } }).unwrap(), b.isActive ? "The banner is now hidden." : "The banner is now on the homepage."));
  const move = (index: number, by: -1 | 1) => run(async () => {
    const ids = (data ?? []).map((b) => b._id);
    const target = index + by;
    if (target < 0 || target >= ids.length) return "";
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await reorder(ids).unwrap();
    return "The order was updated.";
  });
  const del = (b: Banner) => window.confirm(`Delete "${b.title || "this banner"}"? This cannot be undone.`) && run(async () => (await remove(b._id).unwrap(), "The banner was deleted."));

  const count = data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Homepage banners</h1>
          <p className="max-w-2xl text-sm text-stone">The big pictures at the top of your homepage. With one banner it stays still; with more it slides automatically. If you have none, the homepage shows a featured article instead.</p>
        </div>
        {!editing && <button type="button" disabled={count >= MAX_BANNERS} onClick={() => { setMessage(null); setEditing("new"); }} className="bg-ink px-6 py-3 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark disabled:opacity-50">New banner</button>}
      </div>

      {editing && <BannerForm banner={editing === "new" ? undefined : editing} onDone={(text) => { setEditing(null); if (text) setMessage({ ok: true, text }); }} />}
      {message?.text && <p role={message.ok ? "status" : "alert"} className={clsx("p-3 text-sm", message.ok ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800")}>{message.text}</p>}

      {isLoading ? <div role="status" aria-label="Loading banners" className="h-48 animate-pulse bg-sand/60 motion-reduce:animate-none" /> : error || !data ? (
        <p role="alert" className="bg-red-50 p-4 text-red-800">{getErrorMessage(error, "Banners could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : data.length === 0 ? (
        <p className="border border-sand bg-white p-10 text-center text-stone">No banners yet. Add one to show your own picture at the top of the homepage.</p>
      ) : (
        <ol className="space-y-3">
          {data.map((b, i) => {
            const live = b.isActive && !!b.image;
            return (
              <li key={b._id} className="flex flex-col gap-4 border border-sand bg-white p-4 sm:flex-row sm:items-center">
                <span className="relative block aspect-[4/5] w-24 shrink-0 overflow-hidden bg-sand">
                  {b.image && <Image src={b.image.url} alt="" fill sizes="96px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{i + 1}. {b.title || <span className="text-stone">(no title)</span>}</p>
                  <p className="truncate text-sm text-stone">{b.buttonLink ? `Links to ${b.buttonLink}` : "No link"}</p>
                  <span className={clsx("inline-block px-2 py-0.5 text-xs font-medium", live ? "bg-green-50 text-green-900" : "bg-stone/10 text-stone")}>
                    {!b.image ? "No picture, not shown" : b.isActive ? "On homepage" : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <IconAction icon="up" label={`Move banner ${i + 1} earlier`} onClick={() => move(i, -1)} disabled={i === 0} />
                  <IconAction icon="down" label={`Move banner ${i + 1} later`} onClick={() => move(i, 1)} disabled={i === count - 1} />
                  <IconAction icon="edit" label={`Edit banner ${i + 1}`} onClick={() => { setMessage(null); setEditing(b); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                  <IconAction icon={b.isActive ? "hide" : "view"} label={b.isActive ? `Hide banner ${i + 1}` : `Show banner ${i + 1}`} onClick={() => toggle(b)} />
                  <IconAction icon="delete" tone="danger" label={`Delete banner ${i + 1}`} onClick={() => del(b)} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
