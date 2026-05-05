interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: "w-8 h-8 rounded-xl", text: "text-[17px]" },
  md: { box: "w-9 h-9 rounded-xl", text: "text-lg" },
  lg: { box: "w-14 h-14 rounded-2xl shadow-lg shadow-cyan-500/20", text: "text-2xl" },
};

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${s.box} bg-cyan-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-cyan-500/30`}>
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[65%] h-[65%]">
          <path d="M72 18L38 62h26L44 102l44-54H62L72 18z" fill="white"/>
        </svg>
      </div>
      {showText && (
        <span className={`font-bold tracking-tight ${s.text}`}>
          <span className="text-cyan-500">NVR</span>
          <span className="font-light text-inherit"> 7.7 AI</span>
        </span>
      )}
    </div>
  );
}
