// /app/session/[roomId]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Controls from "@/components/Controls";

let socket: any;
let peerConnection: RTCPeerConnection;
const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

interface PageProps {
  params: { roomId: string };
}

export default function SessionRoom({ params }: PageProps) {
  const roomId = params.roomId;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);
  const [glowStrength, setGlowStrength] = useState(0);

  useEffect(() => {
    if (!roomId || joined) return;

    socket = io("http://localhost:4000");
    socket.emit("join-room", { roomId });
    setJoined(true);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = currentStream;
      }

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(currentStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      const checkSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const strength = Math.min(Math.max((volume - 20) / 80, 0), 1); // normalize from 0 to 1
        setGlowStrength(strength);
      };

      const interval = setInterval(checkSpeaking, 200);

      peerConnection = new RTCPeerConnection(iceServers);

      currentStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, currentStream);
      });

      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      socket.on("user-joined", async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
      });

      socket.on("offer", async (data: { offer: RTCSessionDescriptionInit }) => {
        const { offer } = data;
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer });
      });

      socket.on("answer", async (data: { answer: RTCSessionDescriptionInit }) => {
        const { answer } = data;
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", async (data: { candidate: RTCIceCandidateInit }) => {
        const { candidate } = data;
        if (candidate) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding received ice candidate", err);
          }
        }
      });

      socket.on("user-left", () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });

      return () => {
        clearInterval(interval);
        audioContext.close();
      };
    });

    return () => {
      if (socket) socket.disconnect();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (peerConnection) peerConnection.close();
    };
  }, [roomId, joined, stream]);

  const glowColor = `rgba(232, 177, 79, ${glowStrength})`;
  const shadowStyle = {
    boxShadow: glowStrength > 0 ? `0 0 ${30 * glowStrength}px ${glowColor}` : "none",
    borderRadius: "20px",
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5ef] p-8">
      <h1 className="text-2xl font-bold mb-6">Tutee Live Session</h1>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="relative flex flex-col items-center">
          <div style={shadowStyle}></div>
          <h2 className="text-sm font-medium mb-2 z-10">Your Camera</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="relative z-10 w-[320px] h-[240px] rounded-lg bg-black"
          />
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-sm font-medium mb-2">Other Participant</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-[320px] h-[240px] rounded-lg bg-gray-800"
          />
        </div>
      </div>

      <Controls stream={stream} />
    </div>
  );
}

// http://localhost:3000/session/test123