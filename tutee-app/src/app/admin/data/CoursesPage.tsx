'use client';

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';

interface University {
  id: number;
  university_name: string;
}

interface Major {
  id: number;
  major_name: string;
}

interface Course {
  id: number;
  course_code: string;
  course_name: string;
  university_name?: string; // Only returned in unfiltered case
}

export default function CoursesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<number | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const coursesPerPage = 20;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch('http://localhost:4000/api/admin/universities')
      .then(res => res.json())
      .then(setUniversities);

    fetch('http://localhost:4000/api/admin/majors')
      .then(res => res.json())
      .then(setMajors);
  }, []);

  useEffect(() => {
    const baseUrl = 'http://localhost:4000/api/admin/courses';
    const params = new URLSearchParams();

    if (selectedUniversity) {
      params.append('university_id', selectedUniversity.toString());
    }

    if (selectedMajor) {
      params.append('major_id', selectedMajor.toString());
    }

    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    fetch(url)
      .then(res => res.json())
      .then(setCourses)
      .catch(err => console.error("Failed to fetch courses:", err));
  }, [selectedUniversity, selectedMajor]);

  const filteredCourses = Array.isArray(courses)
    ? courses.filter(course =>
      course.course_code.toLowerCase().includes(search.toLowerCase()) ||
      course.course_name.toLowerCase().includes(search.toLowerCase())
    )
    : [];

  const paginatedCourses = filteredCourses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const handleEdit = (course: Course) => {
    setEditCourseId(course.id);
    setEditCode(course.course_code);
    setEditName(course.course_name);
  };

  const saveEdit = async () => {
    await fetch(`http://localhost:4000/api/admin/update-course/${editCourseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_code: editCode, course_name: editName }),
    });
    setCourses(prev =>
      prev.map(c =>
        c.id === editCourseId ? { ...c, course_code: editCode, course_name: editName } : c
      )
    );
    setEditCourseId(null);
  };

  if (!mounted) return null;

  const showUniversityColumn = !(selectedUniversity && selectedMajor);

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          value={selectedUniversity ?? ''}
          onChange={e => setSelectedUniversity(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 rounded-full border border-yellow-400 shadow-sm focus:outline-none"
        >
          <option value="">All Universities</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>
              {u.university_name}
            </option>
          ))}
        </select>

        <select
          value={selectedMajor ?? ''}
          onChange={e => setSelectedMajor(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 rounded-full border border-yellow-400 shadow-sm focus:outline-none"
        >
          <option value="">All Majors</option>
          {majors.map(m => (
            <option key={m.id} value={m.id}>
              {m.major_name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by Course Code or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-yellow-400 rounded-full shadow-sm w-80 focus:outline-none"
        />
      </div>

      <div className="bg-white shadow rounded p-4">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm font-bold text-black border-b">
              <th className="p-3">Course Code</th>
              <th className="p-3">Course Name</th>
              {showUniversityColumn && <th className="p-3">University</th>}
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCourses.map(course => (
              <tr key={course.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-3">
                  {editCourseId === course.id ? (
                    <input
                      value={editCode}
                      onChange={e => setEditCode(e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    course.course_code
                  )}
                </td>
                <td className="p-3">
                  {editCourseId === course.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    course.course_name
                  )}
                </td>
                {showUniversityColumn && (
                  <td className="p-3">
                    {course.university_name}
                  </td>
                )}
                <td className="p-3">
                  {editCourseId === course.id ? (
                    <button onClick={saveEdit} className=" cursor-pointer text-green-600 font-medium">Save</button>
                  ) : (
                    <Pencil onClick={() => handleEdit(course)} className="w-4 h-4 cursor-pointer text-blue-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-end mt-4 gap-2 items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 cursor-pointer py-1 text-sm border rounded bg-black text-[#E8B14F] disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-700 font-medium">
              Page {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev))}
              disabled={currentPage === totalPages}
              className="px-3 cursor-pointer py-1 text-sm border rounded bg-[#E8B14F] text-black disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
