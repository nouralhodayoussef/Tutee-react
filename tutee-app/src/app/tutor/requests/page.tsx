"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import TutorHeader from "@/components/layout/TutorHeader";
import TimeSlotsModal from "@/components/Tutor/TimeSlotModal";
import MaterialModal from "@/components/Tutor/MaterialModal";
import ModalPortal from "@/components/ModalPortal";

export default function TutorRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:4000/tutor/requests/requests", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5ef]">
      <TutorHeader />

      <div className="relative mx-auto mt-20 w-[90%] max-w-[1292px] rounded-[15px] bg-white p-10 shadow-md flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-[32px] md:text-[36px] font-bold text-black mb-2">
            Tutee’s Requests
          </h1>
          <p className="text-[16px] md:text-[18px] text-black">
            You have these requests from tutees
          </p>

          {requests.length === 0 ? (
            <div className="mt-10 text-sm md:text-base text-gray-600">
              You currently have no pending requests.
            </div>
          ) : (
            <div className="mt-10 grid gap-6">
              {requests.map((req, idx) => (
                <div
                  key={idx}
                  className="bg-[#f5f5f5] rounded-[15px] p-6 flex flex-col md:flex-row items-center justify-between"
                >
                  <div className="flex flex-col gap-2 text-center md:text-left">
                    <p className="text-sm md:text-base">
                      <span className="font-bold">{req.course_code}</span> - {req.course_name}
                    </p>
                    <p className="text-sm md:text-base">
                      With: <span className="font-bold">{req.tutee_name}</span>
                    </p>

                    <div className="flex gap-2 items-center justify-center md:justify-start mt-3">
                      <Image
                        src={req.tutee_photo || "/imgs/tutee-profile.png"}
                        alt="Tutee photo"
                        width={60}
                        height={60}
                        className="rounded-full"
                      />
                    </div>

                    <div className="flex gap-3 mt-4 flex-wrap justify-center md:justify-start">
                      <button
                        className="bg-[#E8B14F] px-4 py-2 rounded-full text-sm font-semibold"
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowSlotModal(true);
                        }}
                      >
                        Select A Time Slot
                      </button>
                      <button
                        className="bg-[#E8B14F] px-4 py-2 rounded-full text-sm font-semibold"
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowMaterialModal(true);
                        }}
                      >
                        Check Material
                      </button>
                      <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block w-full md:w-[423px] md:h-[246px] relative">
          <Image
            src="/imgs/illustration-tutee-requests.png"
            alt="Illustration"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {showSlotModal && selectedRequest && (
        <ModalPortal>
          <TimeSlotsModal
            requestId={selectedRequest.id}
            availableSlots={selectedRequest.available_slots || []}
            scheduledSlots={selectedRequest.scheduled_slots || []}
            onClose={() => setShowSlotModal(false)}
            onConfirm={async (slot) => {
              try {
                const [date, time] = slot.split("T");
                const res = await fetch("http://localhost:4000/tutor/select-slot", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    requestId: selectedRequest.id,
                    date,
                    time,
                  }),
                });

                if (!res.ok) throw new Error("Failed to confirm slot");

                alert("✅ Slot confirmed successfully.");
                fetchRequests(); // refresh the list
                setShowSlotModal(false);
              } catch (err) {
                alert("❌ Failed to confirm slot. Try again.");
                console.error(err);
              }
            }}
          />
        </ModalPortal>
      )}

      {showMaterialModal && selectedRequest && (
        <ModalPortal>
          <MaterialModal
            requestId={selectedRequest.id}
            onClose={() => setShowMaterialModal(false)}
          />
        </ModalPortal>
      )}
    </div>
  );
}
