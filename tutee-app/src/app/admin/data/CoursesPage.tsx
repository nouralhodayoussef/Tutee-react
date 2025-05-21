/* admin/data/CoursesPage.tsx */
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
}

export default function CoursesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<number | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 10;

  useEffect(() => {
    fetch('http://localhost:4000/api/admin/universities')
      .then(res => res.json())
      .then(setUniversities);

    fetch('http://localhost:4000/api/admin/majors')
      .then(res => res.json())
      .then(setMajors);
  }, []);

  useEffect(() => {
    if (selectedUniversity && selectedMajor) {
      fetch(`http://localhost:4000/api/admin/courses?university_id=${selectedUniversity}&major_id=${selectedMajor}`)
        .then(res => res.json())
        .then(setCourses);
    }
  }, [selectedUniversity, selectedMajor]);

  const paginatedCourses = courses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage);
  const totalPages = Math.ceil(courses.length / coursesPerPage);

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

  return (
    <div className="">
      <div className="flex gap-4 mb-6">
        <select
          value={selectedUniversity ?? ''}
          onChange={e => setSelectedUniversity(Number(e.target.value))}
          className="px-4 py-2 rounded border border-gray-300 shadow-sm"
        >
          <option value="">Select University</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>{u.university_name}</option>
          ))}
        </select>

        <select
          value={selectedMajor ?? ''}
          onChange={e => setSelectedMajor(Number(e.target.value))}
          className="px-4 py-2 rounded border border-gray-300 shadow-sm"
        >
          <option value="">Select Major</option>
          {majors.map(m => (
            <option key={m.id} value={m.id}>{m.major_name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded p-4">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm font-bold text-black border-b">
              <th className="p-3">Course Code</th>
              <th className="p-3">Course Name</th>
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
                <td className="p-3">
                  {editCourseId === course.id ? (
                    <button onClick={saveEdit} className="text-green-600 font-medium">Save</button>
                  ) : (
                    <Pencil onClick={() => handleEdit(course)} className="w-4 h-4 cursor-pointer text-blue-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded bg-black text-[#E8B14F] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded bg-[#E8B14F] text-black disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
