/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DeleteUserModal from '@/components/modals/DeleteUserModal';
import SuccessModal from '@/components/modals/SuccessModal';
import CoursesPage from './CoursesPage';
import RoleProtected from '@/components/security/RoleProtected';
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  photo?: string;
}

export default function AdminCurrentDataPage() {
  const [tab, setTab] = useState<'tutors' | 'tutees' | 'courses'>('tutors');
  const [search, setSearch] = useState('');
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutees, setTutees] = useState<User[]>([]);
  const [sidebarMin, setSidebarMin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [selectedUser, setSelectedUser] = useState<null | { id: number; name: string; email: string }>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tab]);

  const activeList = tab === 'tutors' ? tutors : tutees;

  const filteredData = activeList.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = search.toLowerCase();
    return (
      fullName.includes(query) ||
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      email.includes(query)
    );
  });

  const paginatedData = filteredData.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const totalPages = Math.ceil(filteredData.length / usersPerPage);

  return (
    <RoleProtected requiredRoles={['admin']}>
      <div className="flex min-h-screen bg-[#F5F5EF]">
        <AdminSidebar minimized={sidebarMin} setMinimized={setSidebarMin} active="Current Data" />

        <main className={`flex-1 p-4 sm:p-8 md:p-10 transition-all duration-300 ${sidebarMin ? 'md:ml-20' : 'md:ml-60'}`}>
          <h1 className="text-2xl font-bold mb-6">Current Data</h1>

          {/* Tabs */}
          <div className="flex gap-2 border-b mb-6">
            {['tutors', 'courses', 'tutees'].map(key => {
              const selected = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key as 'tutors' | 'tutees' | 'courses')}
                  className={`py-2 cursor-pointer px-4 text-sm font-medium transition-all relative
          ${selected
                      ? 'text-[#E8B14F] font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#E8B14F]'
                      : 'text-gray-500 hover:text-[#E8B14F]'}
        `}
                >
                  {key === 'tutors' ? 'All Tutors' : key === 'tutees' ? 'All Tutees' : 'All Courses'}
                </button>
              );
            })}
          </div>

          {/* Search */}
          {(tab === 'tutors' || tab === 'tutees') && (
            <motion.input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-4 w-[320px] px-4 py-2 border border-[#E8B14F] rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8B14F] bg-white shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            />
          )}

          {/* Table */}
          {tab !== 'courses' ? (
            <motion.div
              className="bg-white rounded-lg shadow p-4 max-h-[500px] overflow-y-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-sm font-bold text-black border-b bg-[#FDFDFB]">
                    <th className="p-4 w-16">Photo</th>
                    <th className="p-4">{tab === 'tutors' ? 'Tutor' : 'Tutee'} Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? paginatedData.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      className="text-sm border-b hover:bg-[#f9f8f5]"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.4 }}
                      viewport={{ once: true, amount: 0.2 }}
                    >
                      <td className="p-4">
                        <img
                          src={user.photo || '/imgs/default-user.png'}
                          alt={`${user.first_name} ${user.last_name}`}
                          className="w-10 h-10 rounded-full object-cover border border-gray-300"
                        />
                      </td>

                      <td className="p-4">{user.first_name} {user.last_name}</td>
                      <td className="p-4">{user.email}</td>
                      <td
                        className="p-4 text-red-500 cursor-pointer hover:text-red-700"
                        onClick={() =>
                          setSelectedUser({
                            id: user.id,
                            name: `${user.first_name} ${user.last_name}`,
                            email: user.email,
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">No data found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-1 cursor-pointer rounded text-sm font-medium border transition ${currentPage === 1
                          ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                          : 'bg-black text-[#E8B14F] border-black hover:opacity-90'
                        }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-1 cursor-pointer rounded text-sm font-medium border transition ${currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                          : 'bg-[#E8B14F] text-black border-[#E8B14F] hover:opacity-90'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <CoursesPage />
          )}

          {selectedUser && (
            <DeleteUserModal
              userFullName={selectedUser.name}
              email={selectedUser.email}
              onClose={() => setSelectedUser(null)}
              onConfirm={async (reason) => {
                const endpoint =
                  tab === 'tutors'
                    ? `http://localhost:4000/api/admin/delete-tutor/${selectedUser.id}`
                    : `http://localhost:4000/api/admin/delete-tutee/${selectedUser.id}`;

                try {
                  const res = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, email: selectedUser.email }),
                  });

                  if (res.ok) {
                    if (tab === 'tutors') {
                      setTutors((prev) => prev.filter((u) => u.id !== selectedUser.id));
                    } else {
                      setTutees((prev) => prev.filter((u) => u.id !== selectedUser.id));
                    }
                    setSelectedUser(null);
                    setShowSuccess(true);
                  } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to delete user.');
                  }
                } catch (err) {
                  console.error('Error:', err);
                  alert('Something went wrong.');
                }
              }}
            />
          )}

          {showSuccess && (
            <SuccessModal
              message="User has been suspended successfully."
              onClose={() => setShowSuccess(false)}
            />
          )}
        </main>
      </div>
    </RoleProtected>
  );
}
