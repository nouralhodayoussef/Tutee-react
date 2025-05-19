'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Controls from '@/components/Controls';
import Whiteboard from '@/components/Whiteboard';
import ChatBox from '@/components/ChatBox';

const iceServers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

type SessionInfo = {
  tutee_first_name: string;
  tutee_last_name: string;
  tutee_photo: string;
  tutor_first_name: string;
  tutor_last_name: string;
  tutor_photo: string;
};
type UserRole = 'tutee' | 'tutor';
type CurrentUser = { role: UserRole };

export default function SessionRoom() {
  const { roomId } = useParams() as { roomId: string };
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [isRemoteScreenActive, setIsRemoteScreenActive] = useState(false); // remote

  const [joined, setJoined] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [_, setForceUpdate] = useState(0); // for re-rendering on mic/cam changes

  // Camera toggles
  const [camOn, setCamOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);

  // For ICE
  const pendingCandidates: RTCIceCandidateInit[] = [];

  // --- Camera toggle logic for local stream
  const handleToggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
    socketRef.current?.emit('camera-status', { camOn: videoTrack.enabled, roomId });
    setForceUpdate(val => val + 1);
  };

  // --- Mic toggle logic for local stream
  const handleToggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    sessionStorage.setItem('micEnabled', String(audioTrack.enabled));
    setForceUpdate(val => val + 1);
  };

  // --- Screen sharing
  const handleShareScreen = async () => {
    if (!peerConnectionRef.current) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenActive(true);

      const screenTrack = displayStream.getVideoTracks()[0];
      peerConnectionRef.current.addTrack(screenTrack, displayStream);

      // Always set the screen video ref's srcObject
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream;
        console.log('Set screenVideoRef.current.srcObject (local):', screenVideoRef.current.srcObject);
      } else {
        console.log('screenVideoRef.current is null during handleShareScreen');
      }

      screenTrack.onended = () => {
        setIsScreenActive(false);
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;

      };

      // Always create an offer (no signalingState check)
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current?.emit('offer', { roomId, offer });

    } catch (err) {
      setIsScreenActive(false);
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      alert('Failed to share screen');
      console.error(err);
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

  const handleOpenWhiteboard = () => {
    setShowWhiteboard(true);
    socketRef.current?.emit('open-whiteboard', { roomId });
  };

  useEffect(() => {
    fetch(`http://localhost:4000/session/${roomId}/access`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSessionInfo(data.session);
        setCurrentUser({ role: data.currentUserRole });
      });
  }, [roomId]);

  const showNotification = (msg: string) => {
    setNotifications((prev) => [...prev, msg]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 4000);
  };

  // --- Keeps screen ref synced for remote or local
  useEffect(() => {
    if (!screenVideoRef.current) return;
    // If isScreenActive and srcObject not set, keep it in sync
    if (!isScreenActive && screenVideoRef.current.srcObject) {
      screenVideoRef.current.srcObject = null;
    }
  }, [isScreenActive]);

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

    // Whiteboard Events
    socket.on('open-whiteboard', () => setShowWhiteboard(true));
    socket.on('close-whiteboard', () => setShowWhiteboard(false));

    // Listen for remote camera toggling
    socket.on('camera-status', ({ camOn }) => {
      setRemoteCamOn(camOn);
    });

    const setupConnection = async (mediaStream: MediaStream) => {
      const micEnabled = sessionStorage.getItem('micEnabled') !== 'false';
      const camEnabled = sessionStorage.getItem('camEnabled') !== 'false';
      setCamOn(camEnabled);

      // Enable/disable local tracks
      mediaStream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = camEnabled));
      setStream(mediaStream);

      if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      // Initial offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('offer', { roomId, offer });

      // --- Listen for remote tracks (camera, mic, screen) ---
      pc.ontrack = (event) => {
        const track = event.track;

        // Screen sharing
        const isScreen = track.kind === 'video' && (
          track.label.toLowerCase().includes('screen') ||
          track.getSettings().displaySurface !== undefined
        );
        if (track.kind === 'video' && isScreen) {
          let screenMedia: MediaStream;
          if (screenVideoRef.current?.srcObject instanceof MediaStream) {
            screenMedia = screenVideoRef.current.srcObject as MediaStream;
          } else {
            screenMedia = new MediaStream();
            if (screenVideoRef.current) screenVideoRef.current.srcObject = screenMedia;
          }
          if (!screenMedia.getTracks().some((t) => t.id === track.id)) {
            screenMedia.addTrack(track);
          }
          setIsRemoteScreenActive(true);

          // Debug
          console.log('Screen track received and added:', track);
          if (screenVideoRef.current) {
            screenVideoRef.current.onloadedmetadata = () => {
              console.log('Screen video metadata loaded', screenVideoRef.current?.videoWidth, screenVideoRef.current?.videoHeight);
            };
          }

          track.onended = () => {
            if (screenVideoRef.current?.srcObject instanceof MediaStream) {
              const ms = screenVideoRef.current.srcObject as MediaStream;
              ms.removeTrack(track);
              if (ms.getTracks().length === 0) {
                setIsRemoteScreenActive(false);
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
          setRemoteCamOn(track.enabled);

          // Listen for track enabled/disabled (mute/unmute video)
          track.onmute = () => setRemoteCamOn(false);
          track.onunmute = () => setRemoteCamOn(track.enabled);
          track.onended = () => setRemoteCamOn(false);
          track.addEventListener?.('enabled', () => setRemoteCamOn(track.enabled));
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
        await peerConnectionRef.current.setRemoteDescription(new window.RTCSessionDescription(offer));
        for (const c of pendingCandidates) {
          await peerConnectionRef.current.addIceCandidate(new window.RTCIceCandidate(c));
        }
        pendingCandidates.length = 0;
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer });
      });

      socket.on('answer', async ({ answer }) => {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new window.RTCSessionDescription(answer));
        for (const c of pendingCandidates) {
          await peerConnectionRef.current.addIceCandidate(new window.RTCIceCandidate(c));
        }
        pendingCandidates.length = 0;
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        if (!candidate || !peerConnectionRef.current) return;
        if (!peerConnectionRef.current.remoteDescription) {
          pendingCandidates.push(candidate);
        } else {
          await peerConnectionRef.current.addIceCandidate(new window.RTCIceCandidate(candidate));
        }
      });
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(setupConnection)
      .catch((err) => {
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
      peerConnectionRef.current?.getSenders().forEach((s) => s.track?.stop());
      peerConnectionRef.current?.close();
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [roomId]);

  const hasLocalVideo =
    stream &&
    stream.getVideoTracks &&
    stream.getVideoTracks().some((t) => t.enabled);

  // --- JSX ---
  return (
    <div className="relative min-h-screen bg-[#f5f5ef] flex flex-col font-montserrat">
      {/* Logo and Title Bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-2">
        <img src="/imgs/logo.png" alt="Tutee" className="h-12" />
        <span className="text-2xl font-bold ml-8">
          Class<span className="text-[#E8B14F]">room</span>
        </span>
        <div className="w-12" /> {/* For spacing/alignment */}
      </div>

      {/* Toast Notifications */}
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

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-row justify-center items-stretch w-full max-w-[1700px] mx-auto gap-8 px-4 pb-28">
        {/* Main "presentation" (screen share) area */}
        <div className="flex-1 flex flex-col items-center justify-center pt-2">
          {/* Presentation container */}
          <div className="w-full max-w-4xl aspect-[16/9] bg-[#fcfcfa] rounded-2xl shadow-xl flex items-center justify-center text-center relative border border-gray-200">
            {/* --- Always render the screen video element for ref assignment! --- */}
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              style={{
                display: (isScreenActive || isRemoteScreenActive) ? 'block' : 'none',
                width: '100%',
                height: '100%',
                background: 'black',
                borderRadius: '1rem',
                objectFit: 'contain',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
            {!(isScreenActive || isRemoteScreenActive) && (
              <span className="text-2xl font-semibold text-black/70 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">Presentation here</span>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-[380px] flex flex-col items-center">
          {/* User video/photo containers */}
          <div className="flex flex-row justify-end gap-8 w-full mb-5 mt-2">
            {/* LOCAL USER */}
            <div className="flex flex-col items-center w-[110px]">
              <div className="rounded-2xl bg-[#F7F7F5] shadow-md w-[110px] h-[110px] flex items-center justify-center overflow-hidden relative">
                {hasLocalVideo ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl bg-black"
                  />
                ) : (
                  <img
                    src={
                      currentUser?.role === 'tutee'
                        ? sessionInfo?.tutee_photo || '/imgs/default-profile.png'
                        : sessionInfo?.tutor_photo || '/imgs/default-profile.png'
                    }
                    alt="Your profile"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                )}
              </div>
              <span className="mt-2 bg-white border border-[#E8B14F] px-3 py-1 rounded-full text-xs font-medium shadow text-gray-800 max-w-[100px] truncate text-center">
                {currentUser?.role === 'tutee'
                  ? `${sessionInfo?.tutee_first_name ?? ''} ${sessionInfo?.tutee_last_name ?? ''}`
                  : `${sessionInfo?.tutor_first_name ?? ''} ${sessionInfo?.tutor_last_name ?? ''}`}
              </span>
            </div>
            {/* REMOTE USER */}
            <div className="flex flex-col items-center w-[110px]">
              <div className="rounded-2xl bg-[#F7F7F5] shadow-md w-[110px] h-[110px] flex items-center justify-center overflow-hidden relative">
                {remoteCamOn ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-2xl bg-black"
                  />
                ) : (
                  <img
                    src={
                      currentUser?.role === 'tutee'
                        ? sessionInfo?.tutor_photo || '/imgs/default-profile.png'
                        : sessionInfo?.tutee_photo || '/imgs/default-profile.png'
                    }
                    alt="Other profile"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                )}
              </div>
              <span className="mt-2 bg-white border border-[#E8B14F] px-3 py-1 rounded-full text-xs font-medium shadow text-gray-800 max-w-[100px] truncate text-center">
                {currentUser?.role === 'tutee'
                  ? `${sessionInfo?.tutor_first_name ?? ''} ${sessionInfo?.tutor_last_name ?? ''}`
                  : `${sessionInfo?.tutee_first_name ?? ''} ${sessionInfo?.tutee_last_name ?? ''}`}
              </span>
            </div>
          </div>

          {/* Chat Box */}
          <div className="w-full flex-1 flex flex-col rounded-2xl bg-white shadow-xl border border-[#e8b14f]/40 overflow-hidden min-h-[420px]">
            <div className="bg-[#E8B14F] px-4 py-2 font-bold text-black flex items-center sticky top-0 z-10 rounded-t-2xl text-base">
              Chats
              <span className="ml-2 text-xs font-normal text-black/60">
                {/* Count */}
              </span>
            </div>
            <div className="flex-1 flex flex-col">
              {socketRef.current && sessionInfo && currentUser && (
                <ChatBox
                  socket={socketRef.current}
                  currentUser={{
                    role: currentUser.role,
                    name:
                      currentUser.role === "tutee"
                        ? sessionInfo.tutee_first_name
                        : sessionInfo.tutor_first_name,
                    avatar:
                      currentUser.role === "tutee"
                        ? sessionInfo.tutee_photo
                        : sessionInfo.tutor_photo,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls (bottom, fixed, pill-shaped) */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
    bg-[#E8B14F]/90 rounded-[28px]
    px-4 py-2 shadow-lg flex flex-row items-center min-w-[330px] max-w-[500px]"
      >
        <Controls
          stream={stream}
          onShareScreen={handleShareScreen}
          isScreenSharing={isScreenActive}
          onLeave={handleLeave}
          onOpenWhiteboard={handleOpenWhiteboard}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCamera}
        />
      </div>

      {/* Whiteboard overlay */}
      {socketRef.current && (
        <Whiteboard
          visible={showWhiteboard}
          onClose={() => {
            setShowWhiteboard(false);
            socketRef.current?.emit('close-whiteboard', { roomId });
          }}
          socket={socketRef.current}
          roomId={roomId}
        />
      )}
    </div>
  );
}
