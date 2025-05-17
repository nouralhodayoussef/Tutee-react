"use client";
import * as SliderPrimitive from "@radix-ui/react-slider";
import React from "react";

export function Slider({ min = 1, max = 3, step = 0.1, defaultValue, onValueChange }: any) {
  return (
    <SliderPrimitive.Root
      className="relative flex w-full touch-none select-none items-center"
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-gray-200">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-[#E8B14F]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-[#E8B14F] shadow" />
    </SliderPrimitive.Root>
  );
}