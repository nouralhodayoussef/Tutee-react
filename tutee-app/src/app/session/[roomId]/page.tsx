/* eslint-disable @typescript-eslint/no-unused-vars */
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
  session_id: number;
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
  const videoSenderRef = useRef<RTCRtpSender | null>(null);
  const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenSenderRef = useRef<RTCRtpSender | null>(null);
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
  const [showChatMobile, setShowChatMobile] = useState(false);

  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(true);

  // Step 1: Check access permission
  useEffect(() => {
    setAccessLoading(true);
    fetch(`http://localhost:4000/session/${roomId}/access`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (!data.allowed) {
          setAccessError('Access denied.');
        } else {
          setSessionInfo(data.session);
          setCurrentUser({ role: data.currentUserRole });
        }
      })
      .catch(() => {
        setAccessError('Access denied.');
      })
      .finally(() => setAccessLoading(false));
  }, [roomId]);

  // Step 2: Securely initialize media + WebRTC
  useEffect(() => {
    if (joined || accessLoading || accessError) return;
    setJoined(true);

    const socket = io('http://localhost:4000', { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId: roomId.trim() });
    });

    // Notifications and screen sharing
    socket.on('user-joined', () => showNotification('The other user has joined the session'));
    socket.on('user-left', () => showNotification('The other user has left the session'));
    socket.on('disconnect', () => console.log('🔴 Socket disconnected'));
    socket.on('screen-share-started', () => {
      setIsRemoteSharing(true);
      showNotification("The other user started sharing their screen.");
    });
    socket.on('screen-share-stopped', () => {
      setIsRemoteSharing(false);
      setRemoteScreenStream(null);
      showNotification("The other user stopped sharing their screen.");
    });
    socket.on('open-whiteboard', () => setShowWhiteboard(true));
    socket.on('close-whiteboard', () => setShowWhiteboard(false));
    socket.on('camera-status', ({ camOn }) => {
      setRemoteCamOn(camOn);
      setRemoteVideoUpdate(v => v + 1);
    });

    // === WebRTC Setup ===
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(async (mediaStream) => {
        const micEnabled = sessionStorage.getItem('micEnabled') !== 'false';
        const camEnabled = sessionStorage.getItem('camEnabled') !== 'false';
        setCamOn(camEnabled);
        setMicOn(micEnabled);

        mediaStream.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
        mediaStream.getVideoTracks().forEach((t) => (t.enabled = camEnabled));
        setStream(mediaStream);

        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;

        pc.addTransceiver('audio', { direction: 'sendrecv' });
        pc.addTransceiver('video', { direction: 'sendrecv' });

        pc.onnegotiationneeded = async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, offer });
        };

        mediaStream.getAudioTracks().forEach((track) => pc.addTrack(track, mediaStream));
        const videoTrack = mediaStream.getVideoTracks()[0];
        cameraVideoTrackRef.current = videoTrack;
        videoSenderRef.current = pc.addTrack(videoTrack, mediaStream);

        pc.ontrack = (event) => {
          const track = event.track;
          const isScreen = track.label.toLowerCase().includes('screen') ||
            track.label.toLowerCase().includes('window') ||
            track.label.toLowerCase().includes('display');

          if (track.kind === 'video' && isScreen) {
            setRemoteScreenStream(new MediaStream([track]));
            setIsRemoteSharing(true);
            return;
          }

          if (track.kind === 'video' && !isScreen) {
            setRemoteStream((prev) => {
              const audioTracks = prev?.getAudioTracks() ?? [];
              return new MediaStream([...audioTracks, track]);
            });
            return;
          }

          if (track.kind === 'audio') {
            setRemoteStream((prev) => {
              const videoTracks = prev?.getVideoTracks() ?? [];
              return new MediaStream([...videoTracks, track]);
            });
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit('ice-candidate', { roomId, candidate: e.candidate });
          }
        };

        socket.on('offer', async ({ offer }) => {
          if (!peerConnectionRef.current) return;
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer });
        });

        socket.on('answer', async ({ answer }) => {
          if (!peerConnectionRef.current) return;
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate }) => {
          if (candidate && peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });
      })
      .catch(() => {
        alert('Camera/Mic permission needed.');
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      localScreenStream?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.getSenders().forEach((s) => s.track?.stop());
      peerConnectionRef.current?.close();
      socket.disconnect();
    };
  }, [roomId, accessError, accessLoading]);

  const handleToggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
    sessionStorage.setItem('micEnabled', String(audioTrack.enabled));
  };

  const handleToggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
    setLocalVideoUpdate(v => v + 1);
    socketRef.current?.emit('camera-status', { camOn: videoTrack.enabled, roomId });
  };

  const handleShareScreen = async () => {
  if (isRemoteSharing) {
    showNotification('The other user is already sharing their screen.');
    return;
  }
  if (!peerConnectionRef.current || !videoSenderRef.current) return;

  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    setLocalScreenStream(displayStream);
    setIsLocalSharing(true);

    const screenTrack = displayStream.getVideoTracks()[0];
    await videoSenderRef.current.replaceTrack(screenTrack);

    socketRef.current?.emit('screen-share-started', { roomId });

    screenTrack.onended = () => {
      handleStopShareScreen();
    };
  } catch (err) {
    setIsLocalSharing(false);
    setLocalScreenStream(null);
    alert('Failed to share screen');
    console.error(err);
  }
};
const handleOpenWhiteboard = () => {
  setShowWhiteboard(true);
  socketRef.current?.emit('open-whiteboard', { roomId });
};
  const handleStopShareScreen = async () => {
    setIsLocalSharing(false);

    if (videoSenderRef.current && cameraVideoTrackRef.current) {
      await videoSenderRef.current.replaceTrack(cameraVideoTrackRef.current);
    }

    if (localScreenStream) {
      localScreenStream.getTracks().forEach((track) => track.stop());
    }

    setLocalScreenStream(null);
    socketRef.current?.emit('screen-share-stopped', { roomId });
  };
 const handleLeave = () => {
  fetch('http://localhost:4000/session/whoami', { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => {
      const role = data.role;
      if (role === 'tutee' && sessionInfo?.session_id) {
        window.location.href = `/tutee/booked-sessions?rateSession=${sessionInfo.session_id}`;
      } else if (role === 'tutor' && sessionInfo?.session_id) {
        window.location.href = `/tutor/bookedSessions?rateSession=${sessionInfo.session_id}`;
      } else if (role === 'tutor') {
        window.location.href = '/tutor/bookedSessions';
      } else {
        window.location.href = '/';
      }
    })
    .catch(() => {
      window.location.href = '/';
    });
};
  const showNotification = (msg: string) => {
    setNotifications((prev) => [...prev, msg]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 4000);
  };

  // === FINAL RENDER PROTECTION ===
  if (accessLoading) return <div className="text-center p-10">Checking access...</div>;
  if (accessError) return <div className="text-red-600 text-center p-10">{accessError}</div>;

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
      <div className="flex-1 w-full max-w-[1700px] mx-auto px-4 pb-28">
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-row justify-center items-stretch gap-8 w-full">
          <div className="flex-1 flex flex-col items-center justify-center pt-2">
            <PresentationArea
              localScreenStream={localScreenStream}
              remoteScreenStream={remoteScreenStream}
              isLocalSharing={isLocalSharing}
              isRemoteSharing={isRemoteSharing}
              onStopSharing={handleStopShareScreen}
            />
          </div>
          <div className="w-[380px] flex flex-col items-center">
            <div className="flex flex-row justify-end gap-8 w-full mb-5 mt-2">
              {/* Local Camera */}
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

              {/* Remote Camera */}
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

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col items-center w-full gap-4">
          <div className="flex flex-row justify-center gap-4 mt-4">
            <div className="w-[90px] h-[90px] rounded-2xl bg-[#F7F7F5] shadow-md overflow-hidden flex items-center justify-center">
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
            <div className="w-[90px] h-[90px] rounded-2xl bg-[#F7F7F5] shadow-md overflow-hidden flex items-center justify-center">
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
            </div>
          </div>

          <div className="w-full">
            <PresentationArea
              localScreenStream={localScreenStream}
              remoteScreenStream={remoteScreenStream}
              isLocalSharing={isLocalSharing}
              isRemoteSharing={isRemoteSharing}
              onStopSharing={handleStopShareScreen}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#E8B14F]/90 rounded-[28px] px-4 py-2 shadow-lg flex flex-row items-center min-w-[330px] max-w-[500px]">
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

      {/* Chat FAB for Mobile */}
      {!showChatMobile && (
        <button
          className="fixed bottom-28 right-4 z-50 bg-[#E8B14F] text-black p-3 rounded-full shadow-lg lg:hidden"
          onClick={() => setShowChatMobile(true)}
        >
          💬
        </button>
      )}

      {/* Mobile Chat Modal */}
      {showChatMobile && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center lg:hidden">
          <div className="bg-white rounded-2xl shadow-lg w-11/12 max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-[#E8B14F]">
              <span className="font-semibold text-black">Chats</span>
              <button onClick={() => setShowChatMobile(false)} className="text-black text-xl font-bold">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
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
      )}

      {/* Whiteboard */}
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
