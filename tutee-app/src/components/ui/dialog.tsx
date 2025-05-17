"use client";
import React from "react";

export const Dialog = ({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: () => void;
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onOpenChange} // close on backdrop click (optional)
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // prevent close on modal click
      >
        {children}
      </div>
    </div>
  );
};


export const DialogContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`space-y-4 ${className}`}>{children}</div>
);
