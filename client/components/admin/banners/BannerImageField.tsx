"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { Trash2 } from "lucide-react";

interface BannerImageFieldProps {
  label: string;
  hint: string;
  shape: string; // tailwind aspect class for the preview
  currentUrl?: string;
  file: File | null;
  removed?: boolean;
  onFile: (file: File | null) => void;
  onRemove?: () => void; // only for optional pictures
  error?: string;
}

/** Picks a picture and previews it. Nothing is uploaded until the banner is saved. */
export function BannerImageField({ label, hint, shape, currentUrl, file, removed, onFile, onRemove, error }: BannerImageFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    if (!file) return setPreview(undefined);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview ?? (removed ? undefined : currentUrl);

  const pick = (f: File | undefined) => {
    setLocalError("");
    if (input.current) input.current.value = "";
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) return setLocalError("Only JPG, PNG or WebP images are allowed");
    if (f.size > MAX_IMAGE_BYTES) return setLocalError("The image must be 5 MB or smaller");
    onFile(f);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className={`relative w-full max-w-md overflow-hidden border border-sand bg-sand/60 ${shape}`}>
        {shown ? (
          preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Image src={shown} alt="" fill sizes="448px" className="object-cover" />
          )
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-stone">No picture</span>
        )}
      </div>
      <p className="text-xs text-stone">{hint}</p>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <input ref={input} id={id} type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        <label htmlFor={id} className="inline-block cursor-pointer border border-ink px-4 py-2 hover:bg-ink hover:text-ivory has-[:focus-visible]:outline">{shown ? "Replace picture" : "Choose picture"}</label>
        {file && <button type="button" onClick={() => onFile(null)} className="underline underline-offset-4">Undo</button>}
        {onRemove && shown && !file && <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-red-800 underline underline-offset-4"><Trash2 className="h-4 w-4" aria-hidden />Remove</button>}
      </div>
      {(localError || error) && <p role="alert" className="text-sm text-red-700">{localError || error}</p>}
    </div>
  );
}
