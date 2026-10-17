import type { Metadata } from "next";
import { AvatarUpload } from "@/components/account/AvatarUpload";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="space-y-12">
      <h1 className="font-display text-4xl">Profile</h1>
      <AvatarUpload />
      <ProfileForm />
      <ChangePasswordForm />
    </div>
  );
}
