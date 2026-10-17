"use client";

import Link from "next/link";
import { Avatar } from "@/components/account/Avatar";
import { VerifyEmailBanner } from "@/components/account/VerifyEmailBanner";
import { useAuth } from "@/hooks/useAuth";

export function AccountOverview() {
  const { user } = useAuth();
  if (!user) return null;
  const home = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];

  return (
    <div className="space-y-8">
      <VerifyEmailBanner />
      <div className="flex items-center gap-5">
        <Avatar user={user} size={72} />
        <div>
          <h1 className="font-display text-4xl">Hello, {user.name.split(" ")[0]}</h1>
          <p className="text-stone">{user.email}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="border border-sand bg-white p-6 hover:border-ink">
          <h2 className="font-display text-2xl">Orders</h2>
          <p className="text-sm text-stone">Track your orders and see your order history.</p>
        </Link>
        <Link href="/account/profile" className="border border-sand bg-white p-6 hover:border-ink">
          <h2 className="font-display text-2xl">Profile</h2>
          <p className="text-sm text-stone">{user.phone ? `Mobile: ${user.phone}` : "Add a mobile number so we can reach you about deliveries."}</p>
        </Link>
        <Link href="/account/addresses" className="border border-sand bg-white p-6 hover:border-ink">
          <h2 className="font-display text-2xl">Addresses</h2>
          <p className="text-sm text-stone">{home ? `${home.line1}, ${home.city}` : "No saved address yet."}</p>
        </Link>
      </div>
    </div>
  );
}
