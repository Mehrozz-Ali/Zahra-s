"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/account/Avatar";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/hooks/useAuth";
import { useRemoveAvatarMutation, useUploadAvatarMutation } from "@/services/userApi";

export function AvatarUpload() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [upload, { isLoading: uploading }] = useUploadAvatarMutation();
  const [remove, { isLoading: removing }] = useRemoveAvatarMutation();
  if (!user) return null;

  const onFile = async (file: File | undefined) => {
    setError("");
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setError("Choose a JPG, PNG or WebP image");
    if (file.size > MAX_IMAGE_BYTES) return setError("Image must be 5 MB or smaller");
    try {
      await upload(file).unwrap();
    } catch (e) {
      setError(getErrorMessage(e));
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section aria-labelledby="photo-heading" className="flex items-center gap-6">
      <Avatar user={user} />
      <div className="space-y-2">
        <h2 id="photo-heading" className="font-display text-2xl">Profile photo</h2>
        <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" id="avatar-input" onChange={(e) => onFile(e.target.files?.[0])} />
        <div className="flex gap-3 text-sm">
          <label htmlFor="avatar-input" className="cursor-pointer border border-ink px-4 py-2 hover:bg-ink hover:text-ivory has-[:focus-visible]:outline">
            {uploading ? "Uploading..." : user.avatar ? "Change photo" : "Upload photo"}
          </label>
          {user.avatar && (
            <button type="button" disabled={removing} onClick={() => remove().unwrap().catch((e) => setError(getErrorMessage(e)))} className="px-2 text-red-800 underline underline-offset-4">
              Remove
            </button>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </section>
  );
}
