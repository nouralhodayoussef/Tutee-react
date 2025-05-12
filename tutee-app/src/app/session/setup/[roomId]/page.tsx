// Edited: session/setup/[roomId]/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function SetupRoom() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        sessionStorage.setItem('micEnabled', 'true');
        sessionStorage.setItem('camEnabled', 'true');
      })
      .catch(() => {
        setError('Unable to access camera or microphone.');
      });

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
      sessionStorage.setItem('micEnabled', audioTrack.enabled.toString());
    }
  };

  const toggleCam = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamEnabled(videoTrack.enabled);
      sessionStorage.setItem('camEnabled', videoTrack.enabled.toString());
    }
  };

  const handleJoin = () => {
    router.push(`/session/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5ef] flex flex-col md:flex-row items-center justify-center p-8 gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-[320px] h-[240px] rounded-lg overflow-hidden bg-black">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-600 text-sm">
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex gap-4 mt-2">
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
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-2xl font-bold">Ready to join?</h2>
        <p className="text-sm text-gray-700 max-w-[300px]">
          Make sure your microphone and camera are working correctly before joining the session.
        </p>
        <button
          onClick={handleJoin}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow"
        >
          Join Session
        </button>
      </div>
    </div>
  );
}
