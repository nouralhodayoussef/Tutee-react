// Edited: session/[roomId]/page.tsx with debug exposure and fixed typing
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Controls from '@/components/Controls';

const iceServers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function SessionRoom() {
  const { roomId } = useParams() as { roomId: string };
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [joined, setJoined] = useState(false);

  const pendingCandidates: RTCIceCandidateInit[] = [];
  const isOffererRef = useRef<boolean>(false);

  useEffect(() => {
    if (joined) return;
    setJoined(true);

    const socket = io('http://localhost:4000', { withCredentials: true });
    socketRef.current = socket;
    (window as unknown as { socketRef: typeof socketRef }).socketRef = socketRef;

    socket.on('created-room', () => {
      isOffererRef.current = false;
      console.log('🧍 I am the first in the room (listener).');
    });
    socket.on('joined-room', () => {
      isOffererRef.current = true;
      console.log('👥 I am the second in the room (offerer).');
    });

    socket.on('connect', () => {
      socket.emit('join-room', { roomId: roomId.trim() });
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔴 Disconnected from socket.io: ${reason}`);
    });

    const setupConnection = async (mediaStream: MediaStream) => {
      const micEnabled = sessionStorage.getItem('micEnabled') !== 'false';
      const camEnabled = sessionStorage.getItem('camEnabled') !== 'false';

      mediaStream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = camEnabled));

      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;
      (window as unknown as { peerConnectionRef: typeof peerConnectionRef }).peerConnectionRef = peerConnectionRef;

      console.log('✅ Peer connection initialized:', pc);

      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
        console.log('➕ Track added to connection:', track.kind, track.label);
      });

      pc.getSenders().forEach((s) => {
        console.log('📤 Local track:', s.track?.kind, s.track?.label);
      });

      pc.ontrack = (event) => {
        const [incomingStream] = event.streams;
        const track = event.track;

        console.log('📡 ontrack fired:', track.kind, track.label);

        if (track.kind === 'video' && track.label.includes('screen')) {
          if (screenVideoRef.current) screenVideoRef.current.srcObject = incomingStream;
          setIsScreenSharing(true);
          console.log('🎥 Assigned to screen container');
        } else if (track.kind === 'video') {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = incomingStream;
          console.log('🎥 Assigned to remote camera');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { roomId, candidate: event.candidate });
          console.log('🧊 Sent ICE candidate');
        }
      };

      socket.on('user-joined', async () => {
        if (!isOffererRef.current) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
        console.log('📤 Sent offer');
      });

      socket.on('offer', async ({ offer }) => {
        console.log('📩 Received offer');
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        for (const candidate of pendingCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.length = 0;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer });
      });

      socket.on('answer', async ({ answer }) => {
        console.log('📩 Received answer');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        for (const candidate of pendingCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.length = 0;
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        if (!candidate || !pc) return;
        if (!pc.remoteDescription) {
          pendingCandidates.push(candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ ICE candidate added');
        } catch (err) {
          console.error('❌ Error adding ICE candidate:', err);
        }
      });
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        if (mediaStream.getTracks().length === 0) throw new Error('No media tracks');
        setupConnection(mediaStream);
      })
      .catch((err) => {
        alert('Camera/Microphone access is required.');
        console.error('⚠️ getUserMedia failed:', err);
      });

    return () => {
      [localVideoRef, remoteVideoRef, screenVideoRef].forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.srcObject = null;
        }
      });
      stream?.getTracks().forEach((t) => t.stop());
      screenStream?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.getSenders().forEach((s) => s.track?.stop());
      peerConnectionRef.current?.close();
      socket.disconnect();
    };
  }, [roomId]);

  const handleShareScreen = async () => {
    if (isScreenSharing && screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      const senders = peerConnectionRef.current?.getSenders() || [];
      senders.forEach((sender) => {
        if (sender.track?.kind === 'video' && sender.track.label.includes('screen')) {
          peerConnectionRef.current?.removeTrack(sender);
        }
      });
      setScreenStream(null);
      setIsScreenSharing(false);
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      displayStream.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, displayStream);
      });
      setScreenStream(displayStream);
      setIsScreenSharing(true);
      if (screenVideoRef.current) screenVideoRef.current.srcObject = displayStream;

      const offer = await peerConnectionRef.current!.createOffer();
      await peerConnectionRef.current!.setLocalDescription(offer);
      socketRef.current?.emit('offer', { roomId, offer });

      screenTrack.addEventListener('ended', async () => {
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
        setScreenStream(null);
        setIsScreenSharing(false);
        const offer = await peerConnectionRef.current!.createOffer();
        await peerConnectionRef.current!.setLocalDescription(offer);
        socketRef.current?.emit('offer', { roomId, offer });
      });
    } catch (err) {
      console.error('❌ Screen share error:', err);
    }
  };

  const handleLeave = () => {
    // TODO: Redirect to /rate/[sessionId] after rating is implemented
    window.location.href = '/tutor/bookedSessions';
  };

  return (
    <div className="min-h-screen bg-[#f5f5ef] flex flex-col items-center justify-between py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Tutee Live Session</h1>

      <div className={`w-full max-w-[1400px] flex ${isScreenSharing ? 'flex-row' : 'flex-col items-center'} justify-center gap-6`}>
        {isScreenSharing && (
          <div className="flex-1 bg-black rounded-lg overflow-hidden h-[500px]">
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <div className={`flex ${isScreenSharing ? 'flex-col' : 'flex-row'} items-center justify-center gap-6`}>
          <div className="flex flex-col items-center">
            <h2 className="text-sm font-medium">You</h2>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`rounded-lg bg-black ${isScreenSharing ? 'w-40 h-28' : 'w-72 h-48'}`}
            />
          </div>

          <div className="flex flex-col items-center">
            <h2 className="text-sm font-medium">Other</h2>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`rounded-lg bg-gray-800 ${isScreenSharing ? 'w-40 h-28' : 'w-72 h-48'}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Controls
          stream={stream}
          onShareScreen={handleShareScreen}
          isScreenSharing={isScreenSharing}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
}
