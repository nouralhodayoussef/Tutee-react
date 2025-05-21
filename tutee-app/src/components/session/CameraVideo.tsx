import { useEffect, useRef } from "react";

type CameraVideoProps = {
    stream: MediaStream | null;
    fallbackSrc?: string;
    name?: string;
    muted?: boolean;
    className?: string;
    updateKey?: number;
    camOn?: boolean;
};

function isScreenTrack(track: MediaStreamTrack) {
    const label = track.label.toLowerCase();
    return (
        label.includes("screen") ||
        label.includes("window") ||
        label.includes("display") ||
        (track.getSettings && !!track.getSettings().displaySurface)
    );
}

const CameraVideo = ({
    stream,
    fallbackSrc = "/imgs/default-profile.png",
    name = "",
    muted = false,
    className = "",
    updateKey,
}: CameraVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Filter ONLY camera video tracks
    const videoTracks = stream
        ? stream.getVideoTracks().filter((t) => !isScreenTrack(t) && t.enabled)
        : [];

    const showVideo = !!stream && videoTracks.length > 0;

    useEffect(() => {
        if (videoRef.current) {
            if (videoTracks.length > 0) {
                // Only camera, not screen!
                const camStream = new MediaStream([videoTracks[0]]);
                videoRef.current.srcObject = camStream;
            } else {
                videoRef.current.srcObject = null;
            }
        }
        return () => {
            if (videoRef.current) videoRef.current.srcObject = null;
        };
    }, [stream, updateKey, videoTracks.length]);

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
