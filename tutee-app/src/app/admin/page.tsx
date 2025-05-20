/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import SummaryCard from "@/components/admin/SummaryCard";
import RoleProtected from "@/components/security/RoleProtected";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CalendarX,
  Star,
  MessageCircle,
  Smile,
  BarChart2
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
} from "recharts";

// Import Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// Simple loading spinner component
function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[120px] w-full">
      <div className="w-8 h-8 border-4 border-[#E8B14F] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Date filter options
const dateRanges = [
  { label: "This Month", value: "month" },
  { label: "Last 6 Months", value: "6months" },
  { label: "All Time", value: "all" }
];

type SummaryCardsData = {
  totalTutees: number;
  totalTutors: number;
  totalSessions: number;
  avgTutorRating: number;
  avgTuteeRating: number;
  completedAllTime: number;
  cancelledAllTime: number;
  totalFeedback: number;
};

type UserGrowthData = {
  month: string;
  role: string;
  count: number;
};

type SessionStatusData = {
  status: string;
  count: number;
};

export default function AdminDashboardPage() {
  // STATE
  const [dateFilter, setDateFilter] = useState("month");
  const [cards, setCards] = useState<SummaryCardsData | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatusData[]>([]);
  const [topTutors, setTopTutors] = useState<any[]>([]);
  const [sessionsByUniversity, setSessionsByUniversity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Color palettes
  const universityColors = [
    "#A78BFA", "#FBBF24", "#60A5FA", "#34D399", "#F87171", "#E8B14F", "#7C3AED", "#06B6D4", "#F472B6", "#4ADE80"
  ];
  const sessionStatusColors: { [key: string]: string } = {
    scheduled: "#A78BFA",
    completed: "#E8B14F",
    cancelled: "#e53333",
  };
  const formatTutorName = (first: string, last: string) =>
    last ? `${first} ${last.charAt(0)}.` : first;

  // FETCH LOGIC (re-fetch on dateFilter change)
  useEffect(() => {
    setLoading(true);

    const qs = dateFilter === "all" ? "" : `?range=${dateFilter}`;
    Promise.all([
      fetch(`http://localhost:4000/api/admin/summary-cards${qs}`).then(r => r.json()),
      fetch(`http://localhost:4000/api/admin/user-growth${qs}`).then(r => r.json()),
      fetch(`http://localhost:4000/api/admin/session-status${qs}`).then(r => r.json()),
      fetch(`http://localhost:4000/api/admin/top-tutors${qs}`).then(r => r.json()),
      fetch(`http://localhost:4000/api/admin/sessions-by-university${qs}`).then(r => r.json())
    ]).then(
      ([cards, userGrowth, sessionStatus, topTutors, sessionsByUniversity]) => {
        setCards(cards);
        setUserGrowth(userGrowth);
        setSessionStatus(sessionStatus);
        setTopTutors(topTutors);
        setSessionsByUniversity(sessionsByUniversity);
        setLoading(false);
      }
    );
  }, [dateFilter]);

  // USER GROWTH DATA PIVOT
  const chartData = (() => {
    const dataByMonth: { [month: string]: any } = {};
    userGrowth.forEach((row: UserGrowthData) => {
      if (!dataByMonth[row.month])
        dataByMonth[row.month] = { month: row.month, tutee: 0, tutor: 0 };
      dataByMonth[row.month][row.role] = row.count;
    });
    return Object.values(dataByMonth);
  })();

  // Show bar if universities > 7, else pie
  const useBarForUniversity = sessionsByUniversity.length > 7;

  // Margin/label helper for long names (bar chart)
  const getLeftMargin = () => {
    if (sessionsByUniversity.some(u => u.university_name?.length > 18)) return 170;
    if (sessionsByUniversity.some(u => u.university_name?.length > 12)) return 120;
    return 80;
  };

  // --------- UI ---------
  return (
    <RoleProtected requiredRole="admin">
    <motion.div
      className="flex min-h-screen bg-[#F5F5EF] font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Sidebar */}
      <aside className="w-60 min-h-screen bg-black flex flex-col justify-between shadow-2xl">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 h-[72px] pl-4 border-b border-zinc-800">
            <img src="/imgs/adminlogo.png" alt="Tutee Logo" className="w-24 h-auto" />
          </div>
          {/* Nav */}
          <nav className="flex flex-col gap-1 mt-8">
            <SidebarLink
              icon={<BarChart2 size={20} />}
              text="Insights"
              active
              href="#"
              badge=""
            />
            <SidebarLink
              icon={<BookOpen size={20} />}
              text="Current Data"
              href="#"
            />
            <SidebarLink
              icon={<MessageCircle size={20} />}
              text="Feedbacks"
              href="#"
              badge={cards?.totalFeedback ? String(cards.totalFeedback) : undefined}
            />
          </nav>
        </div>
        {/* Footer */}
        <div className="p-4 text-xs text-gray-400">
          © {new Date().getFullYear()} – Tutee. All rights reserved
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10">

        {/* Date Range Filter */}
        <motion.div
          className="flex justify-end mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="flex gap-3 bg-white px-4 py-2 rounded-xl shadow">
            {dateRanges.map(opt => (
              <motion.button
                key={opt.value}
                onClick={() => setDateFilter(opt.value)}
                className={`px-4 py-1 rounded-full text-sm font-semibold transition-all
                  ${dateFilter === opt.value
                    ? "bg-[#E8B14F] text-black shadow"
                    : "text-gray-600 hover:bg-[#FDE68A]"}
                `}
                whileTap={{ scale: 0.93 }}
                animate={dateFilter === opt.value ? { scale: 1.13 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 350 }}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Top row: Summary Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={dateFilter + String(loading)}
            className="flex flex-wrap gap-8 mb-12"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.5, delay: 0.13 }}
          >
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[180px] h-[120px] rounded-2xl bg-gray-200 animate-pulse"
                  layoutId={`card-skeleton-${i}`}
                  initial={{ scale: 0.95, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0.4 }}
                />
              ))
              : (
                <>
                  <motion.div layoutId="card-tutees"><SummaryCard
                    title="Tutees"
                    value={cards?.totalTutees ?? "..."}
                    icon={<Users className="text-[#E8B14F]" size={28} />}
                    accent="#E8B14F"
                  /></motion.div>
                  <motion.div layoutId="card-tutors"><SummaryCard
                    title="Tutors"
                    value={cards?.totalTutors ?? "..."}
                    icon={<GraduationCap className="text-[#E8B14F]" size={28} />}
                    accent="#E8B14F"
                  /></motion.div>
                  <motion.div layoutId="card-sessions"><SummaryCard
                    title="Sessions"
                    value={cards?.totalSessions ?? "..."}
                    icon={<BookOpen className="text-[#E8B14F]" size={28} />}
                    accent="#E8B14F"
                  /></motion.div>
                  <motion.div layoutId="card-completed"><SummaryCard
                    title="Completed"
                    value={cards?.completedAllTime ?? "..."}
                    icon={<CalendarCheck className="text-green-500" size={28} />}
                    accent="#A7F3D0"
                  /></motion.div>
                  <motion.div layoutId="card-cancelled"><SummaryCard
                    title="Cancelled"
                    value={cards?.cancelledAllTime ?? "..."}
                    icon={<CalendarX className="text-red-400" size={28} />}
                    accent="red"
                  /></motion.div>
                  <motion.div layoutId="card-tutorrating"><SummaryCard
                    title="Avg Tutor Rating"
                    value={cards?.avgTutorRating ?? "..."}
                    icon={<Star className="text-yellow-400" size={28} />}
                    accent="#FDE68A"
                  /></motion.div>
                  <motion.div layoutId="card-tuteerating"><SummaryCard
                    title="Avg Tutee Rating"
                    value={cards?.avgTuteeRating ?? "..."}
                    icon={<Smile className="text-yellow-400" size={28} />}
                    accent="#FDE68A"
                  /></motion.div>
                  <motion.div layoutId="card-feedback"><SummaryCard
                    title="Feedback"
                    value={cards?.totalFeedback ?? "..."}
                    icon={<MessageCircle className="text-sky-400" size={28} />}
                    accent="#38bdf8"
                  /></motion.div>
                </>
              )
            }
          </motion.div>
        </AnimatePresence>

        {/* Charts Row */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Growth Over Time */}
          <motion.div
            className="bg-white rounded-2xl shadow-md p-6 min-h-[300px] flex flex-col"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
          >
            <h2 className="font-bold mb-4 text-lg">User Growth Over Time</h2>
            {loading ? <Spinner /> :
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tutee"
                    name="Tutees"
                    stroke="#E8B14F"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#A78BFA', fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: '#A78BFA', fill: '#A78BFA' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tutor"
                    name="Tutors"
                    stroke="#111827"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#111827', fill: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: '#111827', fill: '#111827' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            }
          </motion.div>

          {/* Session Status Pie Chart */}
          <motion.div
            className="bg-white rounded-2xl shadow-md p-6 min-h-[300px] flex flex-col"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.21 }}
          >
            <h2 className="font-bold mb-4 text-lg">Session Status Distribution</h2>
            {loading ? <Spinner /> :
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sessionStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ status }) => status.charAt(0).toUpperCase() + status.slice(1)}
                  >
                    {sessionStatus.map((entry, i) => (
                      <Cell key={entry.status} fill={sessionStatusColors[entry.status] || "#D1D5DB"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value + " sessions"} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            }
          </motion.div>

          {/* Top Tutors Bar Chart */}
          <motion.div
            className="w-full mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
          >
            <div className="bg-white rounded-2xl shadow-md p-6 min-h-[300px] flex flex-col">
              <h2 className="font-bold mb-4 text-lg">Top 5 Tutors by Sessions</h2>
              {loading ? <Spinner /> :
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={topTutors}
                    layout="vertical"
                    margin={{ left: 80, right: 30, top: 0, bottom: 0 }}
                    barCategoryGap={24}
                  >
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="first_name"
                      tick={{ fontSize: 14, fontWeight: 600, fill: "#333" }}
                    />
                    <Tooltip formatter={(val: number) => `${val} sessions`} />
                    <Bar dataKey="session_count" fill="#A78BFA" radius={[0, 8, 8, 0]}>
                      <LabelList
                        dataKey="first_name"
                        position="top"
                        formatter={(_value: any, _idx: number, props: any) => {
                          const tutor = props?.payload;
                          if (!tutor) return "";
                          return formatTutorName(tutor.first_name, tutor.last_name || "");
                        }}
                        style={{ fontSize: 14, fontWeight: 700, fill: "#444" }}
                      />
                      {topTutors.map((entry, idx) => (
                        <Cell key={entry.id} fill={["#A78BFA", "#FBBF24", "#60A5FA", "#34D399", "#F87171"][idx % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              }
            </div>
          </motion.div>

          {/* Sessions by University (Pie or Bar) */}
          <motion.div
            className="bg-white rounded-2xl shadow-md p-6 min-h-[300px] flex flex-col mt-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.27 }}
          >
            <h2 className="font-bold mb-4 text-lg">Sessions by University</h2>
           {loading ? <Spinner /> :
 <ResponsiveContainer width="100%" height={300}>
  <BarChart
    data={sessionsByUniversity}
    margin={{ left: 20, right: 20, top: 10, bottom: 60 }}
    barCategoryGap={24}
  >
    <XAxis
      dataKey="university_name"
      tick={{ fontSize: 13, fontWeight: 600, fill: "#333" }}
      angle={-25}
      textAnchor="end"
      interval={0}
      height={60}
    />
    <YAxis allowDecimals={false} />
    <Tooltip formatter={(v: number) => `${v} sessions`} />
    <Bar dataKey="session_count">
      <LabelList dataKey="session_count" position="top" />
      {sessionsByUniversity.map((entry, i) => (
        <Cell key={entry.university_name} fill={universityColors[i % universityColors.length]} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
}

          </motion.div>
        </div>
        {/* More sections can be added here */}
      </main>
    </motion.div>
    </RoleProtected>
  );
}

// SidebarLink sub-component
function SidebarLink({
  icon,
  text,
  href,
  active = false,
  badge
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center px-6 py-3 gap-4 text-sm font-medium rounded-l-full hover:bg-[#E8B14F]/20 transition-all relative ${active ? "bg-[#E8B14F]/80 text-black" : "text-gray-200"
        }`}
    >
      <span>{icon}</span>
      <span>{text}</span>
      {badge && (
        <span className="ml-auto bg-[#E8B14F] text-black rounded-full px-2 py-0.5 text-xs font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}
