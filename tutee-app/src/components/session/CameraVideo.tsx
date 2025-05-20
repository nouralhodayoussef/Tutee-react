import { useEffect, useRef } from "react";

type CameraVideoProps = {
    stream: MediaStream | null;
    fallbackSrc?: string;
    name?: string;
    muted?: boolean;
    className?: string;
    updateKey?: number;
    camOn?: boolean; // This is what remote user controls
};

const CameraVideo = ({
    stream,
    fallbackSrc = "/imgs/default-profile.png",
    name = "",
    muted = false,
    className = "",
    updateKey,
}: CameraVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream ?? null;
        }
        return () => {
            if (videoRef.current) videoRef.current.srcObject = null;
        };
    }, [stream, updateKey]);

    const showVideo =
        !!stream &&
        stream.getVideoTracks().length > 0 &&
        stream.getVideoTracks().some((t) => t.enabled);

    if (!showVideo) {
        return (
            <img
                src={fallbackSrc}
                alt={name ? `${name}'s camera` : "No camera"}
                className={`object-cover w-full h-full rounded-2xl bg-black ${className}`}
            />
        );
    }

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={`object-cover w-full h-full rounded-2xl bg-black ${className}`}
        />
    );
};

export default CameraVideo;
