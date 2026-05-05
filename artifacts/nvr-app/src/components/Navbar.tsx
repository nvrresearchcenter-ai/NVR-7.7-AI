import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/authContext";
import { Sun, Moon, Menu, X, LogOut, Zap, ChevronDown, Settings } from "lucide-react";
import Logo from "./Logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/agent", label: "Agent" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free:  { label: "Free",  cls: "text-gray-400 bg-white/5 border-white/10" },
  spark: { label: "Spark", cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  pro:   { label: "Pro",   cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  agent: { label: "Agent", cls: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  super: { label: "Super", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

function getInitial(user: { name?: string; email: string }): string {
  if (user.name && user.name.trim().length > 0) return user.name.trim()[0].toUpperCase();
  return user.email[0].toUpperCase();
}

function getDisplayName(user: { name?: string; email: string }): string {
  if (user.name && user.name.trim().length > 0) return user.name.trim().split(" ")[0];
  return user.email.split("@")[0];
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [location] = useLocation();
  const isDark = theme === "dark";

  const navBg = isDark ? "bg-[#0d0d0d]/90 border-[#1f1f1f]" : "bg-white/90 border-gray-200";
  const mobileBg = isDark ? "bg-[#0d0d0d] border-[#1f1f1f]" : "bg-white border-gray-200";
  const logoText = isDark ? "text-white" : "text-gray-900";
  const linkActive = "text-cyan-500 bg-cyan-500/10";
  const linkInactive = isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100";
  const iconBtn = isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100";

  const badge = user ? (PLAN_BADGE[user.plan] ?? PLAN_BADGE.free) : null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo — on /chat opens the sidebar drawer; elsewhere navigates home */}
          {location === "/chat" ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("nvr:open-sidebar"))}
              className="flex items-center"
              aria-label="Open sidebar"
            >
              <Logo size="sm" showText className={logoText} />
            </button>
          ) : (
            <Link href="/">
              <Logo size="sm" showText className={logoText} />
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${location === link.href ? linkActive : linkInactive}`}
              >
                {link.label}
              </Link>
            ))}

            <button onClick={toggleTheme} className={`ml-1 p-1.5 rounded-lg transition-all ${iconBtn}`} aria-label="Toggle theme">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth section */}
            {user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isDark ? "border-[#2a2a2a] text-gray-300 hover:border-cyan-500/40 bg-[#1a1a1a]" : "border-gray-200 text-gray-700 hover:border-cyan-300 bg-gray-50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitial(user)}
                  </div>
                  <span className="hidden lg:inline max-w-28 truncate font-semibold">
                    {getDisplayName(user)}
                  </span>
                  {badge && badge.label !== "Free" && (
                    <span className={`hidden lg:inline text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-20 overflow-hidden ${isDark ? "bg-[#161616] border-[#2a2a2a]" : "bg-white border-gray-200"}`}>
                      {/* User info */}
                      <div className={`px-4 py-3 border-b ${isDark ? "border-[#2a2a2a]" : "border-gray-100"}`}>
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {getInitial(user)}
                          </div>
                          <div className="min-w-0">
                            {user.name && (
                              <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                {user.name}
                              </p>
                            )}
                            <p className={`text-xs truncate ${user.name ? (isDark ? "text-gray-500" : "text-gray-400") : (isDark ? "text-white" : "text-gray-900") + " font-semibold"}`}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                        {badge && (
                          <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border font-bold ${badge.cls}`}>
                            {badge.label} plan
                          </span>
                        )}
                      </div>

                      {/* Menu items */}
                      <Link
                        href="/pricing"
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        Upgrade plan
                      </Link>
                      <Link
                        href="/chat"
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <Settings className="w-3.5 h-3.5 text-gray-500" />
                        Go to Chat
                      </Link>

                      <div className={`border-t ${isDark ? "border-[#2a2a2a]" : "border-gray-100"}`} />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${isDark ? "text-red-400 hover:bg-red-500/5" : "text-red-500 hover:bg-red-50"}`}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-all"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-1">
            {user && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                {getInitial(user)}
              </div>
            )}
            <button onClick={toggleTheme} className={`p-1.5 rounded-lg transition-all ${iconBtn}`}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className={`p-1.5 rounded-lg transition-all ${iconBtn}`}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={`md:hidden border-t ${mobileBg}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center px-5 py-3 text-sm font-medium border-b transition-colors ${
                isDark ? "border-[#1a1a1a]" : "border-gray-100"
              } ${location === link.href ? "text-cyan-500 bg-cyan-500/5" : isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <div className={`px-5 py-3 border-b ${isDark ? "border-[#1a1a1a]" : "border-gray-100"}`}>
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {user.name || user.email.split("@")[0]}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{user.email}</p>
                {badge && (
                  <span className={`inline-flex mt-1.5 text-[10px] px-2 py-0.5 rounded-full border font-bold ${badge.cls}`}>
                    {badge.label} plan
                  </span>
                )}
              </div>
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className={`flex items-center gap-2 px-5 py-3 text-sm border-b transition-colors ${isDark ? "border-[#1a1a1a] text-gray-300" : "border-gray-100 text-gray-600"}`}>
                <Zap className="w-4 h-4 text-cyan-400" /> Upgrade plan
              </Link>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 text-left px-5 py-3 text-sm font-medium text-red-400"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center px-5 py-3 text-sm font-semibold text-cyan-500">
              Sign in / Create account
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
