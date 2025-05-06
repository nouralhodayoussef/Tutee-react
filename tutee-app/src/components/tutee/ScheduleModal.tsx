"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ModalPortal from "@/components/ModalPortal";

interface ScheduleModalProps {
  onClose: () => void;
  tutorId: number;
  courseId: number;
  tutorName: string;
  courseCode: string;
}

interface TimeSlotMap {
  [day: number]: string[];
}

export default function ScheduleModal({ onClose, tutorId, courseId, tutorName, courseCode }: ScheduleModalProps) {
  const [step, setStep] = useState(0);
  const [availableSlots, setAvailableSlots] = useState<TimeSlotMap>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedExtensions = ["pdf", "doc", "docx", "ppt", "pptx", "jpg", "jpeg", "png", "gif", "bmp", "zip", "rar", "7z"];

  useEffect(() => {
    fetch(`http://localhost:4000/tutor/availability/slots?tutorId=${tutorId}`)
      .then(res => res.json())
      .then(data => setAvailableSlots(data.slots || {}))
      .catch(err => console.error("Failed to fetch slots:", err));
  }, [tutorId]);

  const getDayIndex = (date: Date) => (date.getDay() === 0 ? 7 : date.getDay());

  const isDayAvailable = (date: Date) => {
    const day = getDayIndex(date);
    return day in availableSlots;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const day = getDayIndex(date);
    setSelectedTimes([]);
  };

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    let errorMessage = "";

    for (let file of newFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext && allowedExtensions.includes(ext)) {
        validFiles.push(file);
      } else {
        errorMessage = "Some files were rejected. Only PDF, Word, PPT, images, and ZIPs are allowed.";
      }
    }

    if (errorMessage) setUploadError(errorMessage);
    else setUploadError("");

    setMaterialFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setMaterialFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (step === 0 && !selectedDate) {
      setError("Please select a valid date.");
      return;
    }
    if (step === 1 && selectedTimes.length === 0) {
      setError("Please select at least one time slot.");
      return;
    }
    if (step === 2 && materialFiles.length === 0) {
      setError("Please upload at least one material file.");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (!tutorId || !courseId || !selectedDate || selectedTimes.length === 0 || materialFiles.length === 0) {
        setError("Missing required fields.");
        setIsSubmitting(false);
        return;
      }

      const dateString = selectedDate.toLocaleDateString("en-CA"); // 'YYYY-MM-DD' in local timezone
      const normalizeTime = (time: string) => {
        if (time.length === 5) return `${time}:00`; // from '08:00' to '08:00:00'
        return time;
      };

      const slotRanges = selectedTimes.map(time => ({
        start: normalizeTime(time),
        end: normalizeTime(time),
      }));

      formData.append("tutorId", tutorId.toString());
      formData.append("courseId", courseId.toString());
      formData.append("note", note);
      formData.append("slots", JSON.stringify([{ date: dateString, ranges: slotRanges }]));
      materialFiles.forEach(file => formData.append("materials", file));

      const res = await fetch("http://localhost:4000/schedule-session", {
        method: "POST",
        body: formData,
        credentials: "include", // to include session cookie
      });

      if (res.ok) {
        setStep(4);
      } else {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setError(json?.error || "Failed to schedule session.");
        } catch (err) {
          console.error("Non-JSON response:", text);
          setError("Server returned unexpected response.");
        }
      }

    } catch (err) {
      console.error("Submission failed:", err);
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
        <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-8 relative shadow-lg">
          {step < 4 && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
              <X size={20} />
            </button>
          )}

          {step < 4 && <p className="text-sm text-gray-500 mb-4">Step {step + 1} / 4</p>}

          {step === 0 && (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-6">Choose a date</h2>
              <div className="flex justify-center">
                <Calendar
                  onClickDay={handleDateSelect}
                  tileDisabled={({ date }) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0)) || !isDayAvailable(date)
                  }
                  tileClassName={({ date }) =>
                    selectedDate && selectedDate.toDateString() === date.toDateString() ? "custom-selected" : ""
                  }
                />
              </div>
            </div>
          )}

          {step === 1 && selectedDate && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-center">Select available time slots</h2>
              <p className="text-center text-sm text-gray-600 mb-4">{selectedDate.toDateString()}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableSlots[getDayIndex(selectedDate)]?.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleTime(slot)}
                    className={`px-4 py-2 rounded-full text-sm font-medium shadow ${selectedTimes.includes(slot)
                      ? "bg-[#E8B14F] text-white"
                      : "bg-gray-200 text-black"
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}>
              <h2 className="text-xl font-semibold mb-6">Upload materials to be covered</h2>
              <p className="mb-2 text-gray-700">Drag and drop files here, or click to browse</p>
              <input type="file" multiple className="hidden" id="material-upload" onChange={(e) => handleFiles(e.target.files)} />
              <label htmlFor="material-upload" className="cursor-pointer px-6 py-2 bg-[#E8B14F] text-white rounded-full font-semibold inline-block">
                Browse Files
              </label>
              {materialFiles.length > 0 && (
                <ul className="mt-6 space-y-2 text-left max-h-[200px] overflow-y-auto pr-2">
                  {materialFiles.map((file, i) => (
                    <li key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm text-gray-800 truncate">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="text-red-500 text-sm font-bold ml-4">✕</button>
                    </li>
                  ))}
                </ul>
              )}
              {uploadError && <p className="text-red-500 text-sm mt-4">{uploadError}</p>}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-center">Any notes for your tutor?</h2>
              <textarea
                maxLength={500}
                placeholder="Optional: Write any extra information here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full min-h-[120px] border border-gray-300 rounded-lg p-4 resize-none"
              />

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(step - 1)}
                  className="bg-gray-200 text-black px-6 py-2 rounded-full font-bold"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || materialFiles.length === 0}
                  className={`${materialFiles.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E8B14F]'
                    } text-white px-6 py-2 rounded-full font-bold`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          )}


          {step === 4 && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-[#E8B14F] mb-4">🎉 Request submitted!</h2>
              <p className="text-gray-700">The tutor will review your session and respond soon.</p>
              <button
                onClick={onClose}
                className="mt-6 bg-[#E8B14F] text-white px-6 py-2 rounded-full font-bold"
              >
                Close
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

          {step < 3 && (
            <div className="mt-8 flex justify-between">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="bg-gray-200 text-black px-4 py-2 rounded-full font-bold"
                >
                  Back
                </button>
              )}
              <div className="flex-1"></div>
              <button
                onClick={handleContinue}
                className="bg-[#E8B14F] text-white px-6 py-2 rounded-full font-bold"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
