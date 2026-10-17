"use client";

import clsx from "clsx";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/redux";
import { useWishlistIds } from "@/hooks/useWishlist";
import { selectCartCount } from "@/store/slices/cartSlice";
import { SITE } from "@/lib/site";

interface HeaderClientProps {
  categories: Array<{ name: string; slug: string }>;
}

const SALE_SLUG = "sale";

export function HeaderClient({ categories }: HeaderClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const cartCount = useAppSelector(selectCartCount);
  const wishlistCount = useWishlistIds().length;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Every category is shown in the menu. The sale link goes last, in rose.
  const sale = categories.find((c) => c.slug === SALE_SLUG);
  const others = categories.filter((c) => c.slug !== SALE_SLUG);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // A slimmer bar once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock page scroll, focus the close button, close on Escape, return focus afterwards
  useEffect(() => {
    if (!menuOpen) return;
    const button = menuButton.current;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [menuOpen]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/shop?q=${encodeURIComponent(q)}`);
  };

  const isActive = (href: string) => (href === "/shop" ? pathname === "/shop" : pathname === href);
  const navLink = (href: string, label: string, extra?: string) => (
    <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
      className={clsx("relative whitespace-nowrap py-3 text-[0.8rem] uppercase tracking-[0.18em] transition-colors hover:text-rose-dark after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-center after:scale-x-0 after:bg-rose-dark after:transition-transform hover:after:scale-x-100",
        isActive(href) ? "text-rose-dark after:scale-x-100" : "text-ink", extra)}>
      {label}
    </Link>
  );

  const accountHref = user ? "/account" : "/auth/login";
  const iconButton = "inline-flex h-10 w-10 items-center justify-center hover:text-rose-dark";
  const badge = "absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-dark px-1 text-[10px] font-medium text-ivory";

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-sand bg-ivory/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">Skip to content</a>

      {/* Top row: menu or search on the left, the logo in the middle, account and cart on the right */}
      <div className={clsx("mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 transition-[height] duration-200 sm:px-6", scrolled ? "h-[3.75rem]" : "h-[4.5rem]")}>
        <div className="flex items-center">
          <button ref={menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className={clsx(iconButton, "-ml-2 xl:hidden")}>
            <Menu className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => setSearchOpen((o) => !o)} aria-label="Search" aria-expanded={searchOpen} className="hidden items-center gap-2 text-[0.8rem] uppercase tracking-[0.18em] hover:text-rose-dark xl:inline-flex">
            <Search className="h-[1.1rem] w-[1.1rem]" />Search
          </button>
        </div>

        <Link href="/" aria-label={`${SITE.name}, home`} className="justify-self-center">
          <span className="hidden sm:block"><BrandLogo size={scrolled ? "sm" : "md"} priority /></span>
          <span className="sm:hidden"><BrandLogo size="sm" priority /></span>
        </Link>

        <div className="flex items-center justify-end">
          <button type="button" onClick={() => setSearchOpen((o) => !o)} aria-label="Search" aria-expanded={searchOpen} className={clsx(iconButton, "xl:hidden")}><Search className="h-5 w-5" /></button>
          {isAdmin && <Link href="/admin" className="mr-1 flex h-10 items-center px-3 text-[0.8rem] uppercase tracking-[0.18em] hover:text-rose-dark max-xl:hidden">Admin</Link>}
          <Link href={accountHref} aria-label={user ? "My account" : "Log in"} className={clsx(iconButton, "max-xl:hidden")}><User className="h-5 w-5" /></Link>
          <Link href="/wishlist" aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}` : "Wishlist"} className={clsx(iconButton, "relative max-xl:hidden")}>
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && <span aria-hidden className={badge}>{wishlistCount}</span>}
          </Link>
          <Link href="/cart" aria-label={cartCount > 0 ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Cart"} className={clsx(iconButton, "relative -mr-2 xl:mr-0")}>
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span aria-hidden className={badge}>{cartCount}</span>}
          </Link>
        </div>
      </div>

      {/* Second row (large screens): the shop's categories, like a fashion catalogue */}
      <nav aria-label="Shop" className="hidden border-t border-sand/70 xl:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-9 px-6">
          {navLink("/shop", "Shop all")}
          {others.map((c) => navLink(`/category/${c.slug}`, c.name))}
          {sale && navLink(`/category/${sale.slug}`, sale.name, "font-medium !text-rose-dark")}
        </div>
      </nav>

      {searchOpen && (
        <form onSubmit={submitSearch} role="search" className="border-t border-sand bg-white">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input id="site-search" type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search suits, lawn, khaddar..." className="h-11 flex-1 border border-sand px-4 outline-none focus:border-rose-dark" />
            <button type="submit" className="h-11 bg-ink px-6 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Search</button>
          </div>
        </form>
      )}

    </header>
      {menuOpen && createPortal(
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-ivory p-6 shadow-2xl animate-[drawer-in_.2s_ease-out]">
            <div className="mb-6 flex items-center justify-between">
              <BrandLogo size="sm" />
              <button ref={closeButton} type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className={iconButton}><X className="h-6 w-6" /></button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col">
              <Link href="/" className="border-b border-sand py-3 text-sm uppercase tracking-widest">Home</Link>
              <Link href="/shop" className="border-b border-sand py-3 text-sm uppercase tracking-widest">Shop all</Link>
              {[...others, ...(sale ? [sale] : [])].map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`} className={clsx("border-b border-sand py-3 text-sm uppercase tracking-widest", c.slug === SALE_SLUG && "text-rose-dark")}>{c.name}</Link>
              ))}
              <Link href="/about" className="border-b border-sand py-3 text-sm uppercase tracking-widest">About</Link>
            </nav>
            <div className="mt-8 flex flex-col gap-1 text-sm">
              {isAdmin && <Link href="/admin" className="py-2 font-medium">Admin panel</Link>}
              <Link href={accountHref} className="py-2">{user ? "My account" : "Log in or register"}</Link>
              <Link href="/wishlist" className="py-2">Wishlist{wishlistCount > 0 && ` (${wishlistCount})`}</Link>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
