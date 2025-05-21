'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Trash2, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Feedback = {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
    description: string | null;
};

export default function AdminFeedbackPage() {
    const [sidebarMin, setSidebarMin] = useState(false);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadFeedbacks(); }, []);

    const loadFeedbacks = async () => {
        setLoading(true);
        const res = await fetch('http://localhost:4000/api/admin/all-feedback');
        const data = await res.json();
        setFeedbacks(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this feedback?')) return;
        await fetch(`http://localhost:4000/api/admin/delete-feedback/${id}`, { method: 'DELETE' });
        setFeedbacks(prev => prev.filter(f => f.id !== id));
    };

    // Filter feedbacks by name, email, or phone
    const filtered = feedbacks.filter(f =>
        (f.first_name + ' ' + f.last_name + ' ' + (f.email ?? '') + ' ' + (f.phone_number ?? ''))
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F5F5EF]">
            {/* Sidebar */}
            <AdminSidebar
                minimized={sidebarMin}
                setMinimized={setSidebarMin}
                active="Feedbacks"
            />

            {/* Main Content */}
            <main
                className={`flex-1 min-h-screen transition-all duration-300 pt-20 md:pt-0 ${sidebarMin ? "md:ml-20" : "md:ml-60"
                    }`}
            >
                <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-8">
                    <motion.h1
                        className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-6 sm:mb-8 text-black"
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-[#E8B14F] drop-shadow">Feedback</span>
                    </motion.h1>
                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="mb-6 sm:mb-8"
                    >
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full max-w-md px-4 py-2 sm:px-5 sm:py-3 border-2 border-[#E8B14F] rounded-full shadow focus:outline-none focus:ring-2 focus:ring-[#E8B14F] bg-white text-black font-medium text-base sm:text-lg"
                        />
                    </motion.div>

                    {/* Feedback Cards */}
                    <AnimatePresence>
                        {loading ? (
                            <motion.div
                                className="text-center py-16 text-gray-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Loading feedback...
                            </motion.div>
                        ) : filtered.length === 0 ? (
                            <motion.div
                                className="text-center py-16 text-gray-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                No feedback found.
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <AnimatePresence>
                                    {filtered.map((f, idx) => (
                                        <motion.div
                                            key={f.id}
                                            initial={{ opacity: 0, y: 40 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 40 }}
                                            transition={{ delay: idx * 0.07, duration: 0.35, type: "spring" }}
                                            className="bg-white border-2 border-[#E8B14F]/40 rounded-3xl shadow-lg p-4 sm:p-6 flex flex-col gap-2 relative group hover:shadow-2xl transition-all min-w-0 w-full"
                                        >
                                            {/* Delete button */}
                                            <button
                                                title="Delete Feedback"
                                                className="absolute top-3 right-4 text-red-400 hover:text-red-600 transition"
                                                onClick={() => handleDelete(f.id)}
                                            >
                                                <Trash2 size={22} />
                                            </button>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <div className="bg-[#E8B14F]/60 rounded-full px-3 py-1 text-sm font-bold text-black shadow">
                                                    {f.first_name || '-'} {f.last_name || ''}
                                                </div>
                                                {f.email && (
                                                    <a href={`mailto:${f.email}`} className="ml-2 text-[#E8B14F] flex items-center gap-1 text-sm hover:underline truncate">
                                                        <Mail size={15} /> {f.email}
                                                    </a>
                                                )}
                                            </div>
                                            {f.phone_number && (
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mb-1">
                                                    <Phone size={14} /> {f.phone_number}
                                                </div>
                                            )}
                                            <div className="mt-2 px-1 text-[15px] sm:text-base text-black font-medium leading-relaxed break-words">
                                                <span className="block whitespace-pre-line">
                                                    {f.description}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

        </div>
    );
}
