import { Link } from "wouter";
import { useTheme } from "@/lib/theme";
import Logo from "./Logo";

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const border = isDark ? "border-[#1f1f1f]" : "border-gray-200";
  const bg = isDark ? "bg-[#0a0a0a]" : "bg-white";
  const muted = isDark ? "text-gray-600" : "text-gray-400";
  const link = "hover:text-cyan-500 transition-colors";

  return (
    <footer className={`border-t ${border} ${bg}`}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <Logo size="sm" showText className={isDark ? "text-white" : "text-gray-900"} />
            <p className={`mt-3 text-xs leading-relaxed max-w-xs ${muted}`}>
              NVR 7.7 AI is an intelligent AI assistant with chat, image generation, and agent workspace capabilities.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Pages</p>
            <ul className={`space-y-2 text-sm ${muted}`}>
              <li><Link href="/" className={link}>Home</Link></li>
              <li><Link href="/chat" className={link}>Chat</Link></li>
              <li><Link href="/agent" className={link}>Agent</Link></li>
              <li><Link href="/pricing" className={link}>Pricing</Link></li>
              <li><Link href="/terms" className={link}>Terms of Service</Link></li>
              <li><Link href="/privacy" className={link}>Privacy Policy</Link></li>
              <li><Link href="/refund" className={link}>Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Contact</p>
            <ul className={`space-y-2.5 text-sm ${muted}`}>
              <li className="flex flex-col gap-0.5">
                <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>Support</span>
                <a href="mailto:info@nvrai.chat" className={`${link} text-xs`}>info@nvrai.chat</a>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>Business</span>
                <a href="mailto:nvrai@outlook.com" className={`${link} text-xs`}>nvrai@outlook.com</a>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>System</span>
                <a href="mailto:noreplay@nvrai.chat" className={`${link} text-xs`}>noreplay@nvrai.chat</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className={`border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${border}`}>
          <p className={`text-xs ${muted}`}>© 2026 NVR 7.7 AI. All rights reserved.</p>
          <div className={`flex items-center gap-4 text-xs ${muted}`}>
            <Link href="/terms" className={link}>Terms</Link>
            <Link href="/privacy" className={link}>Privacy</Link>
            <Link href="/refund" className={link}>Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
