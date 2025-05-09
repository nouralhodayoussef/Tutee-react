"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TutorHeader from "@/components/layout/TutorHeader";
import TutorCoursesSection from "@/components/Tutor/TutorCoursesSection";
import { X } from "lucide-react";

export default function TutorEditProfile() {
  const router = useRouter();

  type Skill = {
    id: number;
    skill_name: string;
  };

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photo, setPhoto] = useState("/imgs/default-profile.png");
  const [description, setDescription] = useState("");
  const [charCount, setCharCount] = useState(0);

  const [universities, setUniversities] = useState([]);
  const [majors, setMajors] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState<number | string>("");
  const [selectedMajor, setSelectedMajor] = useState<number | string>("");

  const [inputFirstName, setInputFirstName] = useState("");
  const [inputLastName, setInputLastName] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  const [skills, setSkills] = useState<Skill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [searchSkill, setSearchSkill] = useState("");
  const [showSkillModal, setShowSkillModal] = useState(false);

  useEffect(() => {
    const fetchTutorInfo = async () => {
      try {
        const res = await fetch("http://localhost:4000/tutoreditprofile", {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok) {
          setFirstName(data.first_name);
          setLastName(data.last_name);
          setDescription(data.description || "");
          setInputDescription(data.description || "");
          setSelectedMajor(data.selectedMajorId || "");
          setSelectedUniversity(data.selectedUniversityId || "");
          setCharCount((data.description || "").length);
          setUniversities(data.universities || []);
          setMajors(data.majors || []);
          setDefaultPrice(data.price_per_hour?.toString() || "");
          setSkills(data.skills || []);

          if (data.photo?.includes("drive.google.com")) {
            const match = data.photo.match(/[-\w]{25,}/);
            const fileId = match ? match[0] : "";
            setPhoto(`https://drive.google.com/uc?export=view&id=${fileId}`);
          } else if (data.photo) {
            setPhoto(data.photo);
          }
        }
      } catch (err) {
        console.error("Error fetching tutor info:", err);
      }
    };

    const fetchSkills = async () => {
      try {
        const res = await fetch("http://localhost:4000/skills", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setAvailableSkills(data);
      } catch (err) {
        console.error("Error loading skills:", err);
      }
    };

    fetchTutorInfo();
    fetchSkills();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    const nameRegex = /^[A-Za-z]{2,25}$/;
    const lastNameRegex = /^[A-Za-z]{2,35}$/;

    if (inputFirstName && !nameRegex.test(inputFirstName)) {
      setFirstNameError("First name must be 2-25 letters only.");
      isValid = false;
    } else {
      setFirstNameError("");
    }

    if (inputLastName && !lastNameRegex.test(inputLastName)) {
      setLastNameError("Last name must be 2-35 letters only.");
      isValid = false;
    } else {
      setLastNameError("");
    }

    if (!isValid) return;

    const payload: any = {
      selectedMajor,
      selectedUniversity,
    };

    if (inputFirstName.trim()) payload.firstName = inputFirstName;
    if (inputLastName.trim()) payload.lastName = inputLastName;
    if (pricePerHour.trim()) payload.pricePerHour = pricePerHour;
    if (inputDescription.trim()) payload.description = inputDescription;

    try {
      const res = await fetch("http://localhost:4000/update-tutor", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg("Profile updated successfully!");
        setTimeout(() => location.reload(), 1500);
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const addSkill = async (skillId: number) => {
    try {
      const res = await fetch("http://localhost:4000/add-skills", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      if (res.ok) {
        setSkills((prev) => [...prev, availableSkills.find((s) => s.id === skillId)!]);
      }
    } catch (err) {
      console.error("Error adding skill:", err);
    }
  };

  const removeSkill = async (skillId: number) => {
    try {
      const res = await fetch("http://localhost:4000/remove-skills", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      if (res.ok) {
        setSkills((prev) => prev.filter((s) => s.id !== skillId));
      }
    } catch (err) {
      console.error("Error removing skill:", err);
    }
  };

  const filteredSkills = availableSkills.filter(
    (s) =>
      s.skill_name.toLowerCase().includes(searchSkill.toLowerCase()) &&
      !skills.some((existing) => existing.id === s.id)
  );

  return (
    <>
      <TutorHeader />
      <div className="min-h-screen bg-[#FAFAF5] font-poppins px-4 py-12 md:px-6">
        <div className="max-w-[1354px] bg-white mx-auto shadow-md rounded-[15px] px-6 md:px-12 pt-10 pb-8">
          <h1 className="text-[32px] md:text-[46px] font-bold mb-10">Your Profile</h1>

          <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <Image src={photo} alt="Profile" width={69} height={67} className="rounded-full object-cover" />
              <div>
                <p className="font-bold text-[16px]">{firstName} {lastName}</p>
                <p className="text-sm text-gray-600">{description || "No description provided"}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-2 lg:mt-0">
              <button type="button" className="bg-[#E8B14F] text-white rounded-full px-6 py-2 cursor-pointer hover:opacity-90">
                Upload Photo
              </button>
              <button type="button" className="bg-[#8C94A3] text-white rounded-full px-6 py-2 cursor-pointer hover:opacity-90">
                Delete
              </button>
            </div>
          </div>

          <hr className="border-[#D0D0D0] mb-6" />

          <div className="flex flex-col lg:flex-row gap-8">
            <form className="flex-1 space-y-6" onSubmit={handleSubmit}>
              <div className="flex flex-wrap gap-6">
                <div className="w-full md:w-[48%]">
                  <input
                    type="text"
                    value={inputFirstName}
                    onChange={(e) => setInputFirstName(e.target.value)}
                    placeholder={firstName}
                    className={`w-full border ${firstNameError ? 'border-red-500' : 'border-[#E8B14F]'} rounded-full px-6 py-2`}
                  />
                  {firstNameError && <p className="text-red-500 text-sm mt-1">{firstNameError}</p>}
                </div>
                <div className="w-full md:w-[48%]">
                  <input
                    type="text"
                    value={inputLastName}
                    onChange={(e) => setInputLastName(e.target.value)}
                    placeholder={lastName}
                    className={`w-full border ${lastNameError ? 'border-red-500' : 'border-[#E8B14F]'} rounded-full px-6 py-2`}
                  />
                  {lastNameError && <p className="text-red-500 text-sm mt-1">{lastNameError}</p>}
                </div>
              </div>

              <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)} className="w-full border border-[#E8B14F] rounded-full px-6 py-2">
                {universities.map((u: any) => (
                  <option key={u.id} value={u.university_name}>{u.university_name}</option>
                ))}
              </select>
              <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} className="w-full border border-[#E8B14F] rounded-full px-6 py-2">
                {majors.map((m: any) => (
                  <option key={m.major_id} value={m.major_name}>{m.major_name}</option>
                ))}
              </select>

              <div>
                <textarea
                  maxLength={250}
                  value={inputDescription}
                  onChange={(e) => {
                    setInputDescription(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  placeholder={description || "Write a small description about you"}
                  className="w-full border border-[#E8B14F] rounded-2xl p-4 min-h-[100px]"
                />
                <p className="text-right text-sm text-gray-500">{charCount}/250</p>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" className="bg-[#E8B14F] text-white rounded-full px-8 py-2">Update Profile</button>
                {successMsg && <p className="text-green-600 font-medium">{successMsg}</p>}
              </div>
            </form>

            <div className="w-full lg:w-[35%] space-y-6">
              <div>
                <p className="text-[#E8B14F] font-bold text-[16px] mb-2">Account Privacy</p>
                <p onClick={() => router.push("/change-password")} className="text-black font-semibold text-sm sm:text-base cursor-pointer hover:underline">
                  Change your password
                </p>
              </div>
              <div>
                <p className="text-[#E8B14F] font-bold text-[16px] mb-2">Price per Hour (USD)</p>
                <input
                  type="number"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full border border-[#E8B14F] rounded-full px-6 py-2"
                  placeholder={defaultPrice ? `$${defaultPrice}` : "Set your hourly rate"}
                />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-[#E8B14F] font-bold text-[16px] mb-1">Your Skills</p>
                  <button type="button" onClick={() => setShowSkillModal(true)} className="text-[#E8B14F] underline text-sm font-medium">View Your Skills</button>
                </div>
                <input
                  type="text"
                  placeholder="Search skills..."
                  className="w-full border border-[#E8B14F] rounded-full px-6 py-2 mb-2"
                  value={searchSkill}
                  onChange={(e) => setSearchSkill(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto">
                  {filteredSkills.map((s) => (
                    <div key={s.id} className="flex justify-between items-center py-1">
                      <span>{s.skill_name}</span>
                      <button className="text-[#E8B14F] font-semibold" onClick={() => addSkill(s.id)}>+ Add</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
           <TutorCoursesSection
            selectedMajorId={Number(selectedMajor)}
            selectedUniversityId={Number(selectedUniversity)}
          />
        </div>
      </div>

      {showSkillModal && (
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md max-h-[70vh] overflow-y-auto relative">
            <button onClick={() => setShowSkillModal(false)} className="absolute top-2 right-4 text-gray-500 text-xl font-bold">×</button>
            <h2 className="text-lg font-semibold mb-4">Your Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id} className="bg-[#E8B14F] text-white px-3 py-1 rounded-full flex items-center">
                  {s.skill_name}
                  <X className="ml-2 w-4 h-4 cursor-pointer" onClick={() => removeSkill(s.id)} />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
    
  );
}
