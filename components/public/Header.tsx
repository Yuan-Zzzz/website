"use client";

import React, { useState } from "react";
import Link from "next/link";

const navItems = [
  { href: "/#about", label: "关于我" },
  { href: "/games", label: "游戏作品" },
  { href: "/articles", label: "文章" },
  { href: "/#contact", label: "联系方式" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="win95-outset bg-win95-bg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-black text-win95-title no-underline"
          style={{ textShadow: "2px 2px 0px #808080" }}
        >
          YUAN
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="win95-btn no-underline text-xs"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden win95-btn text-xs"
        >
          {isMenuOpen ? "关闭" : "菜单"}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <nav className="md:hidden win95-inset bg-win95-bg mx-4 mb-2 p-2 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="win95-btn no-underline text-xs text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
