import React from "react";
import { Button } from "../../components/ui/button";
import { SunflowerIcon } from "../../components/SunflowerIcon";

export const Navbar = (): JSX.Element => {
  return (
    <nav className="flex items-center justify-between w-full px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="[font-family:'Young_Serif',Helvetica] font-normal text-white text-xl tracking-[0] leading-normal">
          PranuBl
        </div>
        <SunflowerIcon className="w-[18px] h-[18px] text-[#FFC312]" />
        <div className="[font-family:'Young_Serif',Helvetica] font-normal text-white text-xl tracking-[0] leading-normal">
          gs
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button className="[font-family:'Work_Sans',Helvetica] font-bold text-white text-xl tracking-[0] leading-normal whitespace-nowrap">
          Log In
        </button>
        <Button className="bg-[#521a5b] hover:bg-[#6b2278] rounded-xl h-[41px] px-[23px] [font-family:'Work_Sans',Helvetica] font-bold text-white text-sm tracking-[0] leading-normal whitespace-nowrap">
          CREATE YOUR BLOG
        </Button>
      </div>
    </nav>
  );
};
