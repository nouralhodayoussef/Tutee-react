'use client';

import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, PenSquare } from 'lucide-react';

interface ControlsProps {
  stream: MediaStream | null;
  isScreenSharing?: boolean;
  onShareScreen?: () => void;
  onLeave?: () => void;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
  onOpenWhiteboard?: () => void;
}

const Controls = ({
  stream,
  isScreenSharing,
  onShareScreen,
  onLeave,
  onToggleMic,
  onToggleCam,
  onOpenWhiteboard,
}: ControlsProps) => {
  // Use the stream to determine mic/cam state directly
  const isMicOn = !!stream?.getAudioTracks()[0]?.enabled;
  const isCamOn = !!stream?.getVideoTracks()[0]?.enabled;

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Mic */}
      <button
        onClick={onToggleMic}
        className="w-11 h-11 rounded-full bg-[#E8B14F] text-black shadow hover:bg-yellow-500"
        title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
      >
        {isMicOn ? <Mic className="w-5 h-5 mx-auto" /> : <MicOff className="w-5 h-5 mx-auto" />}
      </button>

      {/* Cam */}
      <button
        onClick={onToggleCam}
        className="w-11 h-11 rounded-full bg-[#E8B14F] text-black shadow hover:bg-yellow-500"
        title={isCamOn ? "Turn Off Camera" : "Turn On Camera"}
      >
        {isCamOn ? <Video className="w-5 h-5 mx-auto" /> : <VideoOff className="w-5 h-5 mx-auto" />}
      </button>

      {/* Screen Share */}
      {onShareScreen && (
        <button
          onClick={onShareScreen}
          className={`w-11 h-11 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-[#E8B14F]'} text-white shadow hover:opacity-90`}
          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
        >
          <Monitor className="w-5 h-5 mx-auto" />
        </button>
      )}

      {/* Whiteboard */}
      {onOpenWhiteboard && (
        <button
          onClick={onOpenWhiteboard}
          className="w-11 h-11 rounded-full bg-[#E8B14F] text-black shadow hover:bg-yellow-500"
          title="Open Whiteboard"
        >
          <PenSquare className="w-5 h-5 mx-auto" />
        </button>
      )}

      {/* Leave Button always LAST */}
      {onLeave && (
        <button
          onClick={onLeave}
          className="w-11 h-11 rounded-full bg-red-600 text-white shadow hover:bg-red-700 ml-2"
          title="Leave Session"
        >
          <PhoneOff className="w-5 h-5 mx-auto" />
        </button>
      )}
    </div>
  );
};

export default Controls;
