import React from "react";

type PresentationAreaProps = {
  localScreenStream: MediaStream | null;
  remoteScreenStream: MediaStream | null;
  isLocalSharing: boolean;
  isRemoteSharing: boolean;
  onStopSharing?: () => void;
};

export default function PresentationArea({
  localScreenStream,
  remoteScreenStream,
  isLocalSharing,
  isRemoteSharing,
  onStopSharing,
}: PresentationAreaProps) {
  const streamToShow = isRemoteSharing
    ? remoteScreenStream
    : isLocalSharing
    ? localScreenStream
    : null;

  return (
    <div className="w-full max-w-4xl aspect-[16/9] bg-[#fcfcfa] rounded-2xl shadow-xl flex items-center justify-center text-center relative border border-gray-200">
      {streamToShow ? (
        <>
          <video
            autoPlay
            playsInline
            controls={false}
            style={{
              width: "100%",
              height: "100%",
              background: "black",
              borderRadius: "1rem",
              objectFit: "contain",
              position: "absolute",
              top: 0,
              left: 0,
            }}
            ref={el => {
              if (el) el.srcObject = streamToShow;
            }}
          />
          {isLocalSharing && (
            <button
              onClick={onStopSharing}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-10"
            >
              Stop Sharing
            </button>
          )}
        </>
      ) : (
        <span className="text-2xl font-semibold text-black/70 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          Presentation here
        </span>
      )}
    </div>
  );
}
