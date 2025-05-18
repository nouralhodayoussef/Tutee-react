'use client';
import Image from "next/image";
import { useEffect, useRef } from "react";

interface VideoCardProps {
  name: string;
  photo: string;
  stream: MediaStream | null;
  camOn?: boolean;
  isMe?: boolean;
}

export default function VideoCard({
  name,
  photo,
  stream,
  camOn = true,
  isMe = false,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream && camOn) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, camOn]);

  return (
    <div className="flex flex-col items-center bg-[#F7F7F5] rounded-2xl shadow-md px-4 py-2 w-[320px] h-[260px] justify-center relative">
      {camOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMe}
          className="rounded-xl w-full h-[170px] object-cover bg-black"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-[170px]">
          <Image
            src={photo || "/imgs/default-profile.png"}
            alt={name}
            width={70}
            height={70}
            className="rounded-full mb-2 border-4 border-[#E8B14F] bg-white object-cover"
          />
          <span className="font-semibold text-lg text-black">{name}</span>
        </div>
      )}
      {/* Name always at the bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/80 rounded-full text-sm font-medium shadow text-black">
        {isMe ? "You" : name}
      </div>
    </div>
  );
}
