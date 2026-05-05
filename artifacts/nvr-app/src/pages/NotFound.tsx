import { Link } from "wouter";
import { Zap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center mb-4">
        <Zap className="w-6 h-6 text-cyan-400" />
      </div>
      <h1 className="text-5xl font-extrabold text-foreground mb-2">404</h1>
      <p className="text-muted-foreground text-base mb-6">Page not found</p>
      <Link href="/">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </Link>
    </div>
  );
}
