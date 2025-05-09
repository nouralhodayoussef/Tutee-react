// components/Controls.tsx
"use client";

import { useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

interface ControlsProps {
  stream: MediaStream | null;
}

const Controls = ({ stream }: ControlsProps) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamEnabled(videoTrack.enabled);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={toggleMic}
        className="w-12 h-12 rounded-full bg-[#E8B14F] text-black shadow hover:bg-yellow-500"
      >
        {micEnabled ? <Mic className="w-5 h-5 mx-auto" /> : <MicOff className="w-5 h-5 mx-auto" />}
      </button>

      <button
        onClick={toggleCam}
        className="w-12 h-12 rounded-full bg-[#E8B14F] text-black shadow hover:bg-yellow-500"
      >
        {camEnabled ? <Video className="w-5 h-5 mx-auto" /> : <VideoOff className="w-5 h-5 mx-auto" />}
      </button>
    </div>
  );
};

export default Controls;