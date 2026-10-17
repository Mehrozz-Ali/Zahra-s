import Image from "next/image";
import type { User } from "@/types";

export function Avatar({ user, size = 96 }: { user: Pick<User, "name" | "avatar">; size?: number }) {
  if (user.avatar?.url) {
    return <Image src={user.avatar.url} alt={`${user.name}'s profile photo`} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span aria-hidden className="inline-flex items-center justify-center rounded-full bg-sand font-display text-3xl" style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}
