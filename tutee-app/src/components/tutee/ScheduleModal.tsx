"use client";

import { useState } from "react";
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

interface TimeRange {
  date: Date;
  ranges: { start: string; end: string }[];
}

export default function ScheduleModal({ onClose, tutorId, courseId, tutorName, courseCode }: ScheduleModalProps) {
  const [step, setStep] = useState(0);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([]);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedExtensions = [
    "pdf", "doc", "docx", "ppt", "pptx", "jpg", "jpeg", "png", "gif", "bmp", "zip", "rar", "7z",
  ];

  const toggleDate = (date: Date) => {
    const exists = selectedDates.find((d) => d.toDateString() === date.toDateString());
    if (exists) {
      setSelectedDates(selectedDates.filter((d) => d.toDateString() !== date.toDateString()));
      setTimeRanges(timeRanges.filter((tr) => tr.date.toDateString() !== date.toDateString()));
    } else {
      setSelectedDates([...selectedDates, date]);
      setTimeRanges([...timeRanges, { date, ranges: [{ start: "09:00", end: "17:00" }] }]);
    }
  };

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const checkOverlap = (ranges: { start: string; end: string }[]) => {
    const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (toMinutes(sorted[i].end) > toMinutes(sorted[i + 1].start)) return true;
    }
    return false;
  };

  const findNextAvailableRange = (ranges: { start: string; end: string }[]) => {
    const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    let start = 8 * 60;
    for (let r of sorted) {
      const rStart = toMinutes(r.start);
      if (start + 60 <= rStart) {
        return {
          start: toTimeString(start),
          end: toTimeString(start + 60),
        };
      }
      start = Math.max(start, toMinutes(r.end));
    }
    return {
      start: toTimeString(start),
      end: toTimeString(start + 60),
    };
  };

  const toTimeString = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const addTimeRange = (dateIndex: number) => {
    const existing = timeRanges[dateIndex].ranges;
    const suggested = findNextAvailableRange(existing);
    const updated = [...timeRanges];
    updated[dateIndex].ranges.push(suggested);
    setTimeRanges(updated);
  };

  const removeTimeRange = (dateIndex: number, rangeIndex: number) => {
    const updated = [...timeRanges];
    updated[dateIndex].ranges.splice(rangeIndex, 1);
    setTimeRanges(updated);
  };

  const updateRange = (dateIndex: number, rangeIndex: number, field: "start" | "end", value: string) => {
    const updated = [...timeRanges];
    updated[dateIndex].ranges[rangeIndex][field] = value;
    setTimeRanges(updated);
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
    setMaterialFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (step === 0 && selectedDates.length === 0) {
      setError("Please select at least one date.");
      return;
    }

    if (step === 1) {
      for (let { ranges } of timeRanges) {
        if (checkOverlap(ranges)) {
          setError("You have overlapping time ranges. Please fix them before continuing.");
          return;
        }
      }
    }

    setError("");
    setStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (!tutorId || !courseId) {
        setError("Missing tutor or course information.");
        console.error("❌ tutorId or courseId is undefined", { tutorId, courseId });
        setIsSubmitting(false);
        return;
      }

      formData.append("tutorId", tutorId.toString());
      formData.append("courseId", courseId.toString());
      formData.append("note", note);
      formData.append("slots", JSON.stringify(
        timeRanges.map(({ date, ranges }) => ({
          date: date.toISOString().split("T")[0],
          ranges,
        }))
      ));

      materialFiles.forEach((file) => {
        formData.append("materials", file);
      });

      const res = await fetch("http://localhost:4000/request-session", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        setStep(4); // ✅ show success
      } else {
        const error = await res.json();
        setError(error?.message || "Failed to submit.");
      }
    } catch (err) {
      console.error("❌ Exception:", err);
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-6">
              Please choose the time slots which best fit you
            </h2>
            <div className="flex justify-center">
              <Calendar
                onClickDay={toggleDate}
                tileDisabled={({ date }) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                tileClassName={({ date }) =>
                  selectedDates.some(
                    (d) => d.toDateString() === date.toDateString()
                  )
                    ? "custom-selected"
                    : ""
                }
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center">Choose the time slots for each selected day</h2>
            <div className="space-y-6">
              {timeRanges.map((tr, dateIndex) => (
                <div key={dateIndex} className="bg-gray-100 rounded-xl p-4">
                  <p className="font-medium text-gray-800 mb-2">{tr.date.toDateString()}</p>
                  {tr.ranges.map((range, rangeIndex) => {
                    const overlaps = tr.ranges.some((r, i) => {
                      if (i === rangeIndex) return false;
                      return toMinutes(r.start) < toMinutes(range.end) && toMinutes(range.start) < toMinutes(r.end);
                    });

                    return (
                      <div key={rangeIndex} className="mb-2">
                        <div className="flex items-center gap-3 mb-1">
                          <input
                            type="time"
                            value={range.start}
                            onChange={(e) => updateRange(dateIndex, rangeIndex, "start", e.target.value)}
                            className="border p-2 rounded"
                          />
                          <span>–</span>
                          <input
                            type="time"
                            value={range.end}
                            onChange={(e) => updateRange(dateIndex, rangeIndex, "end", e.target.value)}
                            className="border p-2 rounded"
                          />
                          <button onClick={() => removeTimeRange(dateIndex, rangeIndex)} className="text-red-500 font-bold px-2">×</button>
                        </div>
                        {range.start >= range.end && <p className="text-red-500 text-sm">End time must be after start time</p>}
                        {overlaps && <p className="text-red-500 text-sm">This time range overlaps with an existing one.</p>}
                      </div>
                    );
                  })}
                  <button onClick={() => addTimeRange(dateIndex)} className="text-sm text-[#E8B14F] font-bold">+ Add another time range</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
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
        );
      case 3:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center">Any notes for your tutor?</h2>
            <textarea
              maxLength={500}
              placeholder="Optional: Write any extra information here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[120px] border border-gray-300 rounded-lg p-4 resize-none"
            />
          </div>
        );
      case 4:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-[#E8B14F] mb-4">🎉 Your request has been submitted!</h2>
            <p className="text-gray-700">The tutor will review it and respond shortly.</p>
            <button onClick={onClose} className="mt-6 bg-[#E8B14F] text-white px-6 py-2 rounded-full font-bold">
              Close
            </button>
          </div>
        );
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

          {renderStep()}

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          {step < 3 && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleContinue}
                className="bg-[#E8B14F] text-white px-6 py-2 rounded-full font-bold"
              >
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#E8B14F] text-white px-6 py-2 rounded-full font-bold"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
