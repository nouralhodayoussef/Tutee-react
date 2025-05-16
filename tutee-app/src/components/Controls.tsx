'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from 'lucide-react';

interface ControlsProps {
  stream: MediaStream | null;
  isScreenSharing?: boolean;
  onShareScreen?: () => void;
  onLeave?: () => void;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
}


const Controls = ({ stream, isScreenSharing, onShareScreen, onLeave, onToggleMic, onToggleCam }: ControlsProps) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  useEffect(() => {
    const mic = sessionStorage.getItem('micEnabled');
    const cam = sessionStorage.getItem('camEnabled');

    setMicEnabled(mic !== 'false');
    setCamEnabled(cam !== 'false');
  }, []);

  const toggleMic = () => {
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (track) {
      const next = !track.enabled;
      track.enabled = next;
      setMicEnabled(next);
      sessionStorage.setItem('micEnabled', String(next));
      onToggleMic?.();
    }
  };

  const toggleCam = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      const next = !track.enabled;
      track.enabled = next;
      setCamEnabled(next);
      sessionStorage.setItem('camEnabled', String(next));
      onToggleCam?.();
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

      {onShareScreen && (
        <button
          onClick={onShareScreen}
          className={`w-12 h-12 rounded-full ${
            isScreenSharing ? 'bg-blue-600' : 'bg-[#E8B14F]'
          } text-white shadow hover:opacity-90`}
        >
          <Monitor className="w-5 h-5 mx-auto" />
        </button>
      )}

      {onLeave && (
        <button
          onClick={onLeave}
          className="w-12 h-12 rounded-full bg-red-600 text-white shadow hover:bg-red-700"
        >
          <PhoneOff className="w-5 h-5 mx-auto" />
        </button>
      )}
    </div>
  );
};

export default Controls;
