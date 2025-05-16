'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMicCam } from '@/components/MicCameraContext';
import Image from 'next/image';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function SetupPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { micOn, camOn, setMicOn, setCamOn } = useMicCam();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4000/session/${roomId}/access`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (!data.allowed) {
          setError('Access denied.');
        } else {
          // Set user photo based on role
          if (data.currentUserRole === 'tutee') {
            setUserPhoto(data.session.tutee_photo || null);
          } else if (data.currentUserRole === 'tutor') {
            setUserPhoto(data.session.tutor_photo || null);
          }
        }
      })
      .catch(() => setError('Access denied.'))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        videoRef.current!.srcObject = mediaStream;
        setMicOn(true);
        setCamOn(true);
      })
      .catch(() => {
        setError('Failed to access camera or microphone.');
      });

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleJoin = () => {
    sessionStorage.setItem('micEnabled', String(micOn));
    sessionStorage.setItem('camEnabled', String(camOn));
    stream?.getTracks().forEach((track) => track.stop());
    router.push(`/session/${roomId}`);
  };

  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      const next = !audioTrack.enabled;
      audioTrack.enabled = next;
      setMicOn(next);
      sessionStorage.setItem('micEnabled', String(next));
    }
  };

  const toggleCam = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const next = !videoTrack.enabled;
      videoTrack.enabled = next;
      setCamOn(next);
      sessionStorage.setItem('camEnabled', String(next));
    }
  };

  if (loading) return <div className="text-center p-10">Checking access...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <main className="min-h-screen bg-[#F5F5EF] text-black flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-6xl flex items-center justify-between mb-4">
        <Image src="/imgs/logo.png" alt="Tutee Logo" width={120} height={60} />
        <h1 className="text-xl sm:text-2xl font-bold text-center flex-1 -ml-16">
          Prepare to Join Session
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-10 w-full max-w-3xl flex flex-col items-center gap-6">
        <div className="w-full max-w-md h-64 sm:h-80 bg-black/10 rounded-xl overflow-hidden relative">
          {/* Video always mounted */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${camOn ? '' : 'opacity-0'}`}
          />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Image
                src={userPhoto || "/imgs/default-user.png"}
                alt="User Photo"
                width={120}
                height={120}
                className="rounded-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 flex items-center justify-center rounded-full border-2 ${
              micOn ? 'bg-[#E8B14F] border-[#E8B14F]' : 'bg-gray-200 border-gray-300'
            }`}
          >
            {micOn ? <Mic className="text-white" /> : <MicOff className="text-gray-600" />}
          </button>
          <button
            onClick={toggleCam}
            className={`w-14 h-14 flex items-center justify-center rounded-full border-2 ${
              camOn ? 'bg-[#E8B14F] border-[#E8B14F]' : 'bg-gray-200 border-gray-300'
            }`}
          >
            {camOn ? <Video className="text-white" /> : <VideoOff className="text-gray-600" />}
          </button>
        </div>

        <button
          onClick={handleJoin}
          className="mt-4 bg-[#E8B14F] text-white font-bold px-8 py-3 rounded-full shadow hover:bg-yellow-500 transition"
        >
          Join Session
        </button>
      </div>
    </main>
  );
}
