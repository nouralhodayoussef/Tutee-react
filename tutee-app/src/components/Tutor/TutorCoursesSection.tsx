import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function TutorCoursesSection({ selectedMajorId, selectedUniversityId }: {
  selectedMajorId: number;
  selectedUniversityId: number;
}) {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("http://localhost:4000/get-tutor-courses", {
        credentials: "include",
      });
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error("Failed to fetch tutor courses:", err);
    }
  };

  const fetchFilteredCourses = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/get-filtered-courses?universityId=${selectedUniversityId}&majorId=${selectedMajorId}`
      );
      const data = await res.json();
      setFilteredCourses(data);
    } catch (err) {
      console.error("Failed to fetch filtered courses:", err);
    }
  };

  const addCourse = async () => {
    try {
      const res = await fetch("http://localhost:4000/add-courses-to-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId: selectedCourseId }),
      });
      if (res.ok) {
        setMessage("Course added successfully!");
        fetchCourses();
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Failed to add course:", err);
    }
  };

 const deleteCourse = async (courseId: number) => {
  try {
    const res = await fetch("http://localhost:4000/remove-courses-from-tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ courseId }),
    });

    if (res.ok) {
      setCourses((prev) => prev.filter((c: any) => c.id !== courseId));
    } else {
      const data = await res.json();
      alert("Failed to delete course: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Failed to delete course:", err);
    alert("Something went wrong while deleting.");
  }
};


  const createCourse = async () => {
    try {
      const res = await fetch("http://localhost:4000/add-new-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          universityId: selectedUniversityId,
          majorId: selectedMajorId,
          courseName: newCourseName,
          courseCode: newCourseCode,
        }),
      });
      if (res.ok) {
        setMessage("New course created and added!");
        fetchCourses();
        setShowCreateModal(false);
        setNewCourseName("");
        setNewCourseCode("");
      }
    } catch (err) {
      console.error("Failed to create new course:", err);
    }
  };

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[#E8B14F] font-bold text-[16px]">Your Courses</p>
        <button
          className="text-sm text-[#E8B14F] underline"
          onClick={() => {
            setShowAddModal(true);
            fetchFilteredCourses();
          }}
        >
          Add a Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-[#F1F1F1] rounded-xl p-4 text-sm text-gray-700">
          You are not currently teaching any courses.
        </div>
      ) : (
        <table className="w-full text-sm border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-[#E8B14F] text-white">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Course Name</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.course_code}</td>
                <td className="p-2">{c.course_name}</td>
                <td className="p-2 text-center">
                  <button onClick={() => deleteCourse(c.id)}>
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {message && <p className="text-green-600 font-medium mt-2">{message}</p>}

     {showAddModal && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md relative font-poppins">
      <button onClick={() => setShowAddModal(false)} className="absolute top-3 right-4 text-gray-600 font-bold text-lg">×</button>
      <h2 className="text-lg font-bold mb-6">Add A Course</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-1">University</label>
          <select
            value={selectedUniversityId}
            disabled
            className="w-full border border-[#E8B14F] rounded-full px-4 py-2 bg-gray-100 text-gray-700"
          >
            <option>{selectedUniversityId}</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1">Major</label>
          <select
            value={selectedMajorId}
            disabled
            className="w-full border border-[#E8B14F] rounded-full px-4 py-2 bg-gray-100 text-gray-700"
          >
            <option>{selectedMajorId}</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1">Course Name</label>
          <select
            className="w-full border border-[#E8B14F] rounded-full px-4 py-2"
            onChange={(e) => setSelectedCourseId(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>-- Select Course --</option>
            {filteredCourses.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.course_code} - {c.course_name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="bg-[#E8B14F] text-white px-6 py-2 rounded-full mt-2 w-full hover:opacity-90"
          onClick={addCourse}
          disabled={!selectedCourseId}
        >
          Add Course
        </button>

        <p
          className="text-sm text-[#E8B14F] underline text-center mt-2 cursor-pointer"
          onClick={() => {
            setShowAddModal(false);
            setShowCreateModal(true);
          }}
        >
          Add a new course
        </p>
      </div>
    </div>
  </div>
)}


      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-3 right-4 text-gray-600">×</button>
            <h2 className="text-lg font-bold mb-4">Add a New Course</h2>
            <input
              type="text"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="Course Name"
              className="w-full border border-[#E8B14F] rounded-full px-4 py-2 mb-4"
            />
            <input
              type="text"
              value={newCourseCode}
              onChange={(e) => setNewCourseCode(e.target.value)}
              placeholder="Course Code"
              className="w-full border border-[#E8B14F] rounded-full px-4 py-2 mb-4"
            />
            <button
              className="bg-[#E8B14F] text-white px-6 py-2 rounded-full"
              onClick={createCourse}
            >
              Add Course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
