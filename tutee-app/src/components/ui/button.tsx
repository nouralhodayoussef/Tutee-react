"use client";
import React from "react";

export const Button = ({ children, onClick, variant = "default" }: any) => {
  const style =
    variant === "secondary"
      ? "bg-white text-[#E8B14F] border border-[#E8B14F] hover:bg-[#FFF4E0]"
      : "bg-[#E8B14F] text-white hover:opacity-90";

  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition ${style}`}
    >
      {children}
    </button>
  );
};