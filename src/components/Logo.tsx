import React from "react";

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <span className="font-['Young_Serif'] text-2xl font-normal tracking-tight">
        PranuBl
      </span>

      {/* SVG from public folder */}
      <img
        src="/sunf.svg"
        alt="PranuBlogs logo"
        className="w-7 h-7"
      />

      <span className="font-['Young_Serif'] text-2xl font-normal tracking-tight">
        gs
      </span>
    </div>
  );
};
