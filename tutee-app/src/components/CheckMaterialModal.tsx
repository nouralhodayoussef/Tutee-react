'use client';

import { X } from 'lucide-react';

interface CheckMaterialModalProps {
  materials: string[];
  onClose: () => void;
}

export default function CheckMaterialModal({ materials, onClose }: CheckMaterialModalProps) {
  const s3BaseUrl = 'https://tutee-materials.s3.eu-north-1.amazonaws.com/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-black mb-4">Session Materials</h2>

        {materials && materials.length > 0 ? (
          <ul className="space-y-3">
            {materials.map((file, idx) => (
              <li key={idx} className="text-sm text-blue-600 underline break-all">
                <a href={`${s3BaseUrl}${file}`} target="_blank" rel="noopener noreferrer">
                  {file}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">No materials uploaded for this session.</p>
        )}
      </div>
    </div>
  );
}
