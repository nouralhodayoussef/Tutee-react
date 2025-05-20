// components/ChatBox.tsx
'use client';
import { Socket } from "socket.io-client";
import Image from "next/image";
import { useEffect, useRef, useState, FormEvent, KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";

type Message = {
  user: "tutee" | "tutor";
  name: string;
  text: string;
  time: string;
  avatar: string;
};

interface ChatBoxProps {
  socket: Socket;
  currentUser: {
    role: "tutee" | "tutor";
    name: string;
    avatar: string;
  };
}

export default function ChatBox({ socket, currentUser }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Receive messages via socket
  useEffect(() => {
    const handler = (msg: Message) => {
      setMessages((msgs) => [
        ...msgs,
        msg,
      ]);
    };
    socket.on("chat-message", handler);

    return () => {
      socket.off("chat-message", handler);
    };
  }, [socket]);

  // Send message
  const sendMessage = (e?: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() || !socket) return;
    setSending(true);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: Message = {
      user: currentUser.role,
      name: currentUser.name,
      text: input.trim(),
      time,
      avatar: currentUser.avatar || "/imgs/tutee-profile.png",
    };
    // Local echo
    setMessages((msgs) => [...msgs, msg]);
    socket.emit("chat-message", msg);
    setInput('');
    setSending(false);
  };

  return (
    <div className="flex flex-col flex-1 w-full h-full bg-white rounded-2xl shadow">

      {/* Messages */}
      <div
        ref={chatRef}
        className="px-4 py-2 space-y-4 overflow-y-auto"
        style={{
          background: "transparent",
          height: 320, // Or any fixed height you want (e.g. 320, 350, 400)
          maxHeight: 320, // Prevents the box from growing infinitely
        }}
      >
        {messages.map((msg, idx) => {
          const isMe = msg.user === currentUser.role;
          return (
            <div
              key={idx}
              className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-2`}
            >
              {!isMe && (
                <Image src={msg.avatar || "/imgs/tutee-profile.png"} width={24} height={24} alt="avatar" className="rounded-full" />
              )}
              <div>
                <div
                  className={`px-3 py-2 rounded-lg text-sm font-montserrat`}
                  style={{
                    background: isMe
                      ? "rgba(45, 140, 255, 0.1)"
                      : "rgba(232, 177, 79, 0.51)",
                    border: isMe
                      ? "1px solid rgba(45, 140, 255, 0.1)"
                      : "1px solid rgba(75, 85, 99, 0.5)",
                    color: "#000"
                  }}
                >
                  {msg.text}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{msg.time}</div>
              </div>
              {isMe && (
                <Image src={msg.avatar || "/imgs/tutee-profile.png"} width={24} height={24} alt="avatar" className="rounded-full" />
              )}
            </div>
          );
        })}
      </div>
      {/* Input */}
      <form
        className="flex items-center border-t border-gray-300 px-3 py-2 bg-white"
        style={{ height: 50 }}
        onSubmit={sendMessage}
      >
        <input
          className="flex-1 outline-none bg-transparent text-[14px] px-2 font-montserrat"
          type="text"
          placeholder="Message to everyone..."
          value={input}
          disabled={sending}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              sendMessage();
            }
          }}
          maxLength={300}
        />
        <button
          type="submit"
          className="ml-2 bg-[#2D8CFF] p-2 rounded-lg"
          disabled={sending || !input.trim()}
        >
          <SendHorizonal color="#fff" size={20} />
        </button>
      </form>
    </div>
  );
}
