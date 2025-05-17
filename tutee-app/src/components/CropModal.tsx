"use client";

import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Area } from "react-easy-crop";

interface CropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  open: boolean;
}

const CropModal = ({ imageSrc, onClose, onCropComplete, open }: CropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  const onCropCompleteHandler = useCallback((_: any, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleApply = async () => {
    try {
      if (isMobile) {
        if (previewBlobUrl) {
          const blob = await fetch(previewBlobUrl).then((res) => res.blob());
          onCropComplete(blob);
        }
      } else {
        if (!croppedAreaPixels) return;
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        onCropComplete(croppedBlob);
      }
      onClose();
    } catch (err) {
      console.error("❌ Cropping failed:", err);
    }
  };

  // Auto crop for mobile once image is loaded
  useEffect(() => {
    if (!isMobile || !imageSrc) return;
    const cropCenterImage = async () => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = async () => {
        const size = Math.min(img.width, img.height);
        const area: Area = {
          x: (img.width - size) / 2,
          y: (img.height - size) / 2,
          width: size,
          height: size,
        };
        const cropped = await getCroppedImg(imageSrc, area);
        const blobUrl = URL.createObjectURL(cropped);
        setPreviewBlobUrl(blobUrl);
      };
    };
    cropCenterImage();
  }, [isMobile, imageSrc]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[500px] max-h-[90vh] p-6 flex flex-col gap-6">
        {/* Mobile: Preview only */}
        {isMobile && previewBlobUrl ? (
          <>
            <div className="flex justify-center">
              <img
                src={previewBlobUrl}
                alt="Preview"
                className="w-40 h-40 rounded-full object-cover border border-gray-300"
              />
            </div>
            <p className="text-center text-sm text-gray-500">
              This is the cropped photo preview.
            </p>
          </>
        ) : (
          // Desktop: Cropper
          <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteHandler}
            />
          </div>
        )}

        {/* Zoom only for desktop */}
        {!isMobile && (
          <Slider
            defaultValue={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value: [number]) => setZoom(value[0])}
          />
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CropModal;
