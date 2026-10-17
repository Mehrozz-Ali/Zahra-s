import type { Metadata } from "next";
import { BannerManager } from "@/components/admin/banners/BannerManager";

export const metadata: Metadata = { title: "Homepage banners" };

export default function AdminBannersPage() {
  return <BannerManager />;
}
