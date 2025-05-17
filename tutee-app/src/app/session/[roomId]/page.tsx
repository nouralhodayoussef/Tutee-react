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
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [joined, setJoined] = useState(false);
  const [remoteAudioActive, setRemoteAudioActive] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const pendingCandidates: RTCIceCandidateInit[] = [];
  const screenSenderRef = useRef<RTCRtpSender | null>(null);

  const showNotification = (msg: string) => {
    setNotifications((prev) => [...prev, msg]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 4000);
  };

  const setupLocalVolumeDetection = (stream: MediaStream) => {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    const data = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser);
    const detect = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setLocalSpeaking(avg > 5);
      requestAnimationFrame(detect);
    };
    detect();
  };

  useEffect(() => {
    if (joined) return;
    setJoined(true);

    const socket = io('http://localhost:4000', { withCredentials: true });
    socketRef.current = socket;

    socket.on('created-room', () => { });
    socket.on('joined-room', () => { });

    socket.on('connect', () => {
      socket.emit('join-room', { roomId: roomId.trim() });
    });

    socket.on('user-joined', () => showNotification('The other user has joined the session'));
    socket.on('user-left', () => showNotification('The other user has left the session'));
    socket.on('disconnect', () => console.log('🔴 Socket disconnected'));

    const setupConnection = async (mediaStream: MediaStream) => {
      const micEnabled = sessionStorage.getItem('micEnabled') !== 'false';
      const camEnabled = sessionStorage.getItem('camEnabled') !== 'false';

      mediaStream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = camEnabled));
      setStream(mediaStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
      setupLocalVolumeDetection(mediaStream);

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Send camera and mic to peer
      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      // Always renegotiate for both offerer and listener
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('offer', { roomId, offer });

      // --- Track/Stream handlers (remote) ---
      pc.ontrack = (event) => {
        const track = event.track;
        const isScreen = track.kind === 'video' && (track.label.toLowerCase().includes('screen') ||
          track.getSettings().displaySurface !== undefined);

        // 🟡 SCREEN SHARING LOGIC
        if (track.kind === 'video' && isScreen) {
          // Both the local sharer and the remote user handle this identically!
          let screenMedia: MediaStream;
          if (screenVideoRef.current?.srcObject instanceof MediaStream) {
            screenMedia = screenVideoRef.current.srcObject as MediaStream;
          } else {
            screenMedia = new MediaStream();
            if (screenVideoRef.current) screenVideoRef.current.srcObject = screenMedia;
          }
          // Don't add duplicate tracks
          if (!screenMedia.getTracks().some((t) => t.id === track.id)) {
            screenMedia.addTrack(track);
          }
          setIsScreenActive(true);

          // Remove the screen when the track ends (stops sharing)
          track.onended = () => {
            if (screenVideoRef.current?.srcObject instanceof MediaStream) {
              const ms = screenVideoRef.current.srcObject as MediaStream;
              ms.removeTrack(track);
              if (ms.getTracks().length === 0) {
                setIsScreenActive(false);
                if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
              }
            }
          };
          return;
        }
        // Camera
        if (track.kind === 'video' && !isScreen) {
          let camStream = remoteVideoRef.current?.srcObject as MediaStream;
          if (!camStream) {
            camStream = new MediaStream();
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = camStream;
          }
          if (!camStream.getTracks().some(t => t.id === track.id)) {
            camStream.addTrack(track);
          }
          return;
        }
        // Audio
        if (track.kind === 'audio') {
          let remote = remoteVideoRef.current?.srcObject as MediaStream;
          if (!remote) {
            remote = new MediaStream();
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
          }
          if (!remote.getTracks().some(t => t.id === track.id)) {
            remote.addTrack(track);
          }
          track.onunmute = () => setRemoteAudioActive(true);
          track.onmute = () => setRemoteAudioActive(false);
          return;
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketRef.current?.emit('ice-candidate', { roomId, candidate: e.candidate });
        }
      };

      socket.on('offer', async ({ offer }) => {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        for (const c of pendingCandidates) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.length = 0;
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer });
      });

      socket.on('answer', async ({ answer }) => {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        for (const c of pendingCandidates) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.length = 0;
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        if (!candidate || !peerConnectionRef.current) return;
        if (!peerConnectionRef.current.remoteDescription) {
          pendingCandidates.push(candidate);
        } else {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(setupConnection).catch((err) => {
      alert('Camera/Mic permission needed');
      console.error(err);
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

  // ====== SCREEN SHARING LOGIC (multi-track, NOT replace!) ======
  const handleShareScreen = async () => {
    if (!peerConnectionRef.current || !socketRef.current) return;

    // Stop sharing
    if (isScreenActive && screenStream && screenSenderRef.current) {
      peerConnectionRef.current.removeTrack(screenSenderRef.current);
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenActive(false);
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      screenSenderRef.current = null;
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(displayStream);
      setIsScreenActive(true);

      // Add the screen track as a new track (multi-track!)
      const screenTrack = displayStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.addTrack(screenTrack, displayStream);
      screenSenderRef.current = sender;

      // Locally show your shared screen
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream;
      }

      displayStream.getTracks()[0].onended = () => handleShareScreen();

      // Renegotiate
      if (peerConnectionRef.current.signalingState === 'stable') {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketRef.current?.emit('offer', { roomId, offer });
      }
    } catch (err) {
      console.error('❌ Error sharing screen:', err);
      showNotification('Failed to share screen');
    }
  };

  const handleLeave = () => {
    fetch('http://localhost:4000/session/whoami', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const role = data.role;
        if (role === 'tutee') window.location.href = '/tutee/booked-sessions';
        else if (role === 'tutor') window.location.href = '/tutor/bookedSessions';
        else window.location.href = '/';
      });
  };

  return (
    <div className="min-h-screen bg-[#f5f5ef] flex flex-col items-center justify-between py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Tutee Live Session</h1>
      {/* 🔔 Toast */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {notifications.map((msg, i) => (
          <div
            key={i}
            className="bg-black text-white px-4 py-2 rounded-lg shadow-md animate-fadeInOut text-sm"
          >
            {msg}
          </div>
        ))}
      </div>
      <div className={`w-full max-w-[1400px] flex ${isScreenActive
        ? 'flex-row' : 'flex-col items-center'} justify-center gap-6`}>
        {isScreenActive && screenStream && (
          <div className="flex-1 bg-black rounded-lg overflow-hidden h-[500px] relative">
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
              onLoadedMetadata={() => {
                if (screenVideoRef.current) {
                  screenVideoRef.current.play().catch((e) =>
                    console.warn('🟡 Screen video play error:', e)
                  );
                }
              }}
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              Someone is sharing screen
            </div>
          </div>
        )}

        <div className={`flex ${isScreenActive
          ? 'flex-col' : 'flex-row'} items-center justify-center gap-6`}>
          <div className="flex flex-col items-center">
            <h2 className="text-sm font-medium">You</h2>
            <div className={`relative ${localSpeaking ? 'ring-4 ring-green-400' : ''} rounded-lg`}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`rounded-lg bg-black ${isScreenActive
                  ? 'w-40 h-28' : 'w-72 h-48'}`}
              />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-sm font-medium">Other</h2>
            <div className={`relative ${remoteAudioActive ? 'ring-4 ring-green-400' : ''} rounded-lg`}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`rounded-lg bg-gray-800 ${isScreenActive
                  ? 'w-40 h-28' : 'w-72 h-48'}`}
              />
              {!remoteAudioActive && (
                <span className="absolute bottom-1 right-1 bg-black text-white text-xs px-2 py-0.5 rounded-full">Muted</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <Controls
          stream={stream}
          onShareScreen={handleShareScreen}
          isScreenSharing={isScreenActive}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
}
