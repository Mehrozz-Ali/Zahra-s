import { getCategories } from "@/lib/data";
import { AnnouncementBar } from "./AnnouncementBar";
import { HeaderClient } from "./HeaderClient";

export async function SiteHeader() {
  const categories = await getCategories();
  return (
    <>
      <AnnouncementBar />
      <HeaderClient categories={categories.map(({ name, slug }) => ({ name, slug }))} />
    </>
  );
}
