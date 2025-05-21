/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar'; // Update this import path if needed

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

export default function AdminCurrentDataPage() {
  const [tab, setTab] = useState<'tutors' | 'tutees' | 'courses'>('tutors');
  const [search, setSearch] = useState('');
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutees, setTutees] = useState<User[]>([]);
  const [sidebarMin, setSidebarMin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tutorsRes, tuteesRes] = await Promise.all([
          fetch('http://localhost:4000/api/admin/all-tutors').then(res => res.json()),
          fetch('http://localhost:4000/api/admin/all-tutees').then(res => res.json())
        ]);
        setTutors(Array.isArray(tutorsRes) ? tutorsRes : []);
        setTutees(Array.isArray(tuteesRes) ? tuteesRes : []);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    fetchData();
  }, []);

  const activeList = tab === 'tutors' ? tutors : tutees;
  const filteredData = activeList.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    const confirm = window.confirm('Are you sure you want to delete this user?');
    if (!confirm) return;

    const endpoint =
      tab === 'tutors'
        ? `http://localhost:4000/api/admin/delete-tutor/${id}`
        : `http://localhost:4000/api/admin/delete-tutee/${id}`;

    const res = await fetch(endpoint, { method: 'DELETE' });
    if (res.ok) {
      if (tab === 'tutors') setTutors(prev => prev.filter(t => t.id !== id));
      else setTutees(prev => prev.filter(t => t.id !== id));
    } else {
      alert('Failed to delete user.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5EF]">
      {/* Sidebar */}
      <AdminSidebar
        minimized={sidebarMin}
        setMinimized={setSidebarMin}
        active="Current Data"
      />

      {/* Main Content */}
      <main className={`flex-1 p-4 sm:p-8 md:p-10 transition-all duration-300 ${sidebarMin ? "md:ml-20" : "md:ml-60"}`}>
        <h1 className="text-2xl font-bold mb-6">Current Data</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          {['tutors', 'courses', 'tutees'].map(key => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-all ${
                tab === key ? 'border-[#E8B14F] text-black' : 'border-transparent text-gray-500'
              }`}
            >
              {key === 'tutors' ? 'All Tutors' : key === 'tutees' ? 'All Tutees' : 'All Courses'}
            </button>
          ))}
        </div>

        {/* Search */}
        {(tab === 'tutors' || tab === 'tutees') && (
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-4 w-72 px-3 py-2 border border-gray-300 rounded shadow-sm"
          />
        )}

        {/* Table */}
        {tab !== 'courses' ? (
          <div className="bg-white rounded-lg shadow p-4 max-h-[500px] overflow-y-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-2 w-10"><input type="checkbox" /></th>
                  <th className="p-2">{tab === "tutors" ? "Tutor" : "Tutee"} Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map(user => (
                  <tr key={user.id} className="text-sm border-b hover:bg-gray-50">
                    <td className="p-2"><input type="checkbox" /></td>
                    <td className="p-2">{user.first_name} {user.last_name}</td>
                    <td className="p-2">{user.email}</td>
                    <td
                      className="p-2 text-red-500 cursor-pointer hover:text-red-700"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 size={16} />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">No data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 mt-4">Courses section coming soon...</div>
        )}
      </main>
    </div>
  );
}
