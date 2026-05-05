import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/theme";
import { Loader2, AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled. Please try again.",
  google_failed: "Google sign-in failed. Please try again.",
  no_email: "Could not retrieve your email from Google. Please try again.",
  default: "An unexpected error occurred. Please try again.",
};

export default function OAuthCallback() {
  const [, navigate] = useLocation();
  const { loginWithToken } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const err = params.get("error");

    if (err) {
      setError(ERROR_MESSAGES[err] ?? ERROR_MESSAGES.default);
      return;
    }

    if (!token) {
      setError(ERROR_MESSAGES.default);
      return;
    }

    loginWithToken(token)
      .then(() => navigate("/chat"))
      .catch(() => setError("Failed to complete sign-in. Please try again."));
  }, [loginWithToken, navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? "bg-[#0d0d0d]" : "bg-[#f8f8f8]"}`}>
      <div className={`w-full max-w-sm rounded-2xl border p-8 text-center ${isDark ? "bg-[#141414] border-[#222]" : "bg-white border-gray-200 shadow-sm"}`}>
        {error ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <h2 className={`font-bold text-base mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Sign-in failed</h2>
            <p className={`text-sm mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm"
            >
              Back to Sign in
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Completing sign-in…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
