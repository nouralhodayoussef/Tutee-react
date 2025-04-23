"use client";

import { useEffect, useState } from "react";

type MaterialModalProps = {
  requestId: number;
  onClose: () => void;
};

const MaterialModal = ({ requestId, onClose }: MaterialModalProps) => {
  const [materials, setMaterials] = useState<string[]>([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch(`http://localhost:4000/tutor/requests/materials/${requestId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setMaterials(data.map((m: any) => m.file_path));
      } catch (err) {
        console.error("❌ Error fetching materials", err);
      }
    };

    fetchMaterials();
  }, [requestId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white w-[641px] h-[512px] rounded-[15px] shadow-lg p-6 relative">
        <h2 className="text-[24px] font-medium text-black mb-6">
          Please Check The Uploaded Material
        </h2>

        <div className="space-y-4 overflow-y-auto max-h-[340px] pr-2">
          {materials.length > 0 ? (
            materials.map((file, index) => (
              <a
                href={file}
                key={index}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-[#D9D9D9] rounded-lg shadow px-4 py-3 hover:bg-gray-300 transition"
              >
                <img
                  src="/imgs/pdf-icon.png"
                  alt="PDF Icon"
                  className="w-[65px] h-[65px] object-contain mr-4"
                />
                <div>
                  <p className="text-black text-[14px] font-medium truncate w-[280px]">
                    {file.split("/").pop()}
                  </p>
                  <p className="text-[14px] text-black">PDF</p>
                </div>
              </a>
            ))
          ) : (
            <p className="text-black text-sm">No materials uploaded for this request.</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute bottom-6 right-6 bg-[#E8B14F] rounded-full px-6 py-3 text-black font-bold text-sm hover:bg-yellow-400 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MaterialModal;
