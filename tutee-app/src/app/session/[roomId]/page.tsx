'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Controls from '@/components/session/Controls';
import Whiteboard from '@/components/session/Whiteboard';
import ChatBox from '@/components/session/ChatBox';
import CameraVideo from '@/components/session/CameraVideo';
import PresentationArea from '@/components/session/PresentationArea';

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
  const pendingCandidates: RTCIceCandidateInit[] = [];

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);

  const [isLocalSharing, setIsLocalSharing] = useState(false);
  const [isRemoteSharing, setIsRemoteSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);
  const [localVideoUpdate, setLocalVideoUpdate] = useState(0);
  const [remoteVideoUpdate, setRemoteVideoUpdate] = useState(0);


  // Screen sharing logic
  const handleShareScreen = async () => {
    if (isRemoteSharing) {
      showNotification('The other user is already sharing their screen.');
      return;
    }
    if (!peerConnectionRef.current) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setLocalScreenStream(displayStream);
      setIsLocalSharing(true);

      // Add track to peer connection (does NOT remove camera)
      const screenTrack = displayStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.addTrack(screenTrack, displayStream);

      // Notify remote user via socket
      socketRef.current?.emit('screen-share-started', { roomId });

      screenTrack.onended = () => {
        handleStopShareScreen();
      };

      // Update for local preview
      setLocalScreenStream(displayStream);

      // Force renegotiate
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current?.emit('offer', { roomId, offer });

    } catch (err) {
      setIsLocalSharing(false);
      setLocalScreenStream(null);
      alert('Failed to share screen');
      console.error(err);
    }
  };

  const handleStopShareScreen = () => {
    setIsLocalSharing(false);
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((track) => track.stop());
    }
    setLocalScreenStream(null);

    // Remove screen track from peer connection
    if (peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      senders.forEach((sender) => {
        if (
          sender.track &&
          sender.track.kind === 'video' &&
          sender.track.label.toLowerCase().includes('screen')
        ) {
          peerConnectionRef.current?.removeTrack(sender);
        }
      });
    }

    socketRef.current?.emit('screen-share-stopped', { roomId });

    // Renegotiate to remove screen track
    if (peerConnectionRef.current) {
      peerConnectionRef.current.createOffer().then((offer) => {
        return peerConnectionRef.current!.setLocalDescription(offer).then(() => {
          socketRef.current?.emit('offer', { roomId, offer });
        });
      });
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

    // Screen sharing events
    socket.on('screen-share-started', () => {
      setIsRemoteSharing(true);
      showNotification("The other user started sharing their screen.");
    });
    socket.on('screen-share-stopped', () => {
      setIsRemoteSharing(false);
      setRemoteScreenStream(null);
      showNotification("The other user stopped sharing their screen.");
    });

    // Whiteboard Events
    socket.on('open-whiteboard', () => setShowWhiteboard(true));
    socket.on('close-whiteboard', () => setShowWhiteboard(false));

    // Listen for remote camera toggling
    socket.on('camera-status', ({ camOn }) => {
      setRemoteCamOn(camOn);
      setRemoteVideoUpdate(v => v + 1);
    });

    // Setup WebRTC connection
    const setupConnection = async (mediaStream: MediaStream) => {
      const micEnabled = sessionStorage.getItem('micEnabled') !== 'false';
      const camEnabled = sessionStorage.getItem('camEnabled') !== 'false';
      setCamOn(camEnabled);
      setMicOn(micEnabled);

      mediaStream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = camEnabled));
      setStream(mediaStream);

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;
pc.onnegotiationneeded = () => {
  renegotiate();
};
      // Add all camera/audio tracks to connection
      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      const renegotiate = async () => {
        if (!peerConnectionRef.current) return;
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socketRef.current?.emit('offer', { roomId, offer });
        } catch (err) {
          console.error('Renegotiation failed:', err);
        }
      };

      pc.ontrack = (event) => {
        const track = event.track;
        if (track.kind === 'video') {
          // Distinguish screen from camera
          const isScreen =
            track.label.toLowerCase().includes('screen') ||
            track.getSettings().displaySurface !== undefined;

          if (isScreen) {
            setRemoteScreenStream((prev) => {
              const stream = prev ?? new MediaStream();
              if (!stream.getTracks().some((t) => t.id === track.id)) {
                stream.addTrack(track);
              }
              return stream;
            });
            setIsRemoteSharing(true);
            track.onended = () => {
              setRemoteScreenStream(null);
              setIsRemoteSharing(false);
            };
          } else {
            setRemoteStream((prev) => {
              const stream = prev ?? new MediaStream();
              if (!stream.getTracks().some((t) => t.id === track.id)) {
                stream.addTrack(track);
              }
              return stream;
            });
          }
        }
        if (track.kind === 'audio') {
          setRemoteStream((prev) => {
            const stream = prev ?? new MediaStream();
            if (!stream.getTracks().some((t) => t.id === track.id)) {
              stream.addTrack(track);
            }
            return stream;
          });
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
      setRemoteStream(null);
      setRemoteScreenStream(null);
      setIsRemoteSharing(false);
      setIsLocalSharing(false);
      setLocalScreenStream(null);
      setRemoteVideoUpdate(0);
      setLocalVideoUpdate(0);
      stream?.getTracks().forEach((t) => t.stop());
      localScreenStream?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.getSenders().forEach((s) => s.track?.stop());
      peerConnectionRef.current?.close();
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [roomId]);

  // --- Mic toggle logic for local stream
  const handleToggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
    sessionStorage.setItem('micEnabled', String(audioTrack.enabled));
  };
  // --- Camera toggle logic for local stream
  const handleToggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
    setLocalVideoUpdate(v => v + 1);
    socketRef.current?.emit('camera-status', { camOn: videoTrack.enabled, roomId });
  };

  // --- JSX ---
  return (
    <div className="relative min-h-screen bg-[#f5f5ef] flex flex-col font-montserrat">
      {/* Logo and Title Bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-2">
        <img src="/imgs/logo.png" alt="Tutee" className="h-12" />
        <span className="text-2xl font-bold ml-8">
          Class<span className="text-[#E8B14F]">room</span>
        </span>
        <div className="w-12" />
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
          {/* PresentationArea */}
          <PresentationArea
            localScreenStream={localScreenStream}
            remoteScreenStream={remoteScreenStream}
            isLocalSharing={isLocalSharing}
            isRemoteSharing={isRemoteSharing}
            onStopSharing={handleStopShareScreen}
          />
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-[380px] flex flex-col items-center">
          {/* User video/photo containers */}
          <div className="flex flex-row justify-end gap-8 w-full mb-5 mt-2">
            {/* LOCAL USER */}
            <div className="flex flex-col items-center w-[110px]">
              <div className="rounded-2xl bg-[#F7F7F5] shadow-md w-[110px] h-[110px] flex items-center justify-center overflow-hidden relative">
                <CameraVideo
                  stream={stream}
                  fallbackSrc={
                    currentUser?.role === 'tutee'
                      ? sessionInfo?.tutee_photo || '/imgs/default-profile.png'
                      : sessionInfo?.tutor_photo || '/imgs/default-profile.png'
                  }
                  name="You"
                  muted
                  updateKey={localVideoUpdate}
                />
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
                <CameraVideo
                  stream={remoteCamOn ? remoteStream : null}
                  fallbackSrc={
                    currentUser?.role === 'tutee'
                      ? sessionInfo?.tutor_photo || '/imgs/default-profile.png'
                      : sessionInfo?.tutee_photo || '/imgs/default-profile.png'
                  }
                  name="Remote"
                  muted={false}
                  updateKey={remoteVideoUpdate}
                  camOn={remoteCamOn}
                />
                {remoteStream && (
                  <audio
                    autoPlay
                    playsInline
                    controls={false}
                    ref={el => {
                      if (el) el.srcObject = remoteStream;
                    }}
                    style={{ display: 'none' }}
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
              <span className="ml-2 text-xs font-normal text-black/60"></span>
            </div>
            <div className="flex-1 flex flex-col">
              {socketRef.current && sessionInfo && currentUser && (
                <ChatBox
                  socket={socketRef.current}
                  currentUser={{
                    role: currentUser.role,
                    name:
                      currentUser.role === 'tutee'
                        ? sessionInfo.tutee_first_name
                        : sessionInfo.tutor_first_name,
                    avatar:
                      currentUser.role === 'tutee'
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
    bg-[#E8B14F]/90 rounded-[28px]
    px-4 py-2 shadow-lg flex flex-row items-center min-w-[330px] max-w-[500px]">
        <Controls
          stream={stream}
          micOn={micOn}
          camOn={camOn}
          onShareScreen={handleShareScreen}
          isScreenSharing={isLocalSharing}
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
