/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import SummaryCard from "@/components/admin/SummaryCard";
import RoleProtected from "@/components/security/RoleProtected";
import {
  Users, GraduationCap, BookOpen, CalendarCheck, CalendarX, Star, MessageCircle, Smile, BarChart2, Repeat2, Flame, UserCheck
} from "lucide-react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Spinner
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

// Section tabs
const dashboardSections = [
  { label: "Platform Growth", value: "growth", icon: <BarChart2 size={18} /> },
  { label: "Engagement Analysis", value: "engagement", icon: <Flame size={18} /> },
  { label: "Sessions Overview", value: "sessions", icon: <CalendarCheck size={18} /> },
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

export default function AdminDashboardPage() {
  // SECTION STATE
  const [section, setSection] = useState("growth");
  const [dateFilter, setDateFilter] = useState("month");
  const [loading, setLoading] = useState(true);

  // DATA STATE
  const [cards, setCards] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [sessionStatus, setSessionStatus] = useState<any[]>([]);
  const [topTutors, setTopTutors] = useState<any[]>([]);
  const [sessionsByUniversity, setSessionsByUniversity] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any>(null);
  const [repeatBooking, setRepeatBooking] = useState<any>(null);
  const [unratedSessions, setUnratedSessions] = useState<any[]>([]);
  const [cancellationReasons, setCancellationReasons] = useState<any[]>([]);
  const [sidebarMin, setSidebarMin] = useState(false);

  // Sessions table state
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsRange, setSessionsRange] = useState<'today' | 'week' | 'upcoming'>('today');

  // Color palettes
  const universityColors = [
    "#A78BFA", "#FBBF24", "#60A5FA", "#34D399", "#F87171", "#E8B14F", "#7C3AED", "#06B6D4", "#F472B6", "#4ADE80"
  ];

  // FETCH LOGIC
  const API_BASE = "http://localhost:4000/api/admin";
  useEffect(() => {
    setLoading(true);
    const qs = dateFilter === "all" ? "" : `?range=${dateFilter}`;
    Promise.all([
      fetch(`${API_BASE}/summary-cards${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/user-growth${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/session-status${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/top-tutors${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/sessions-by-university${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/active-users${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/repeat-booking-rate${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/unrated-sessions${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/cancellation-reasons${qs}`).then(r => r.json()),
      fetch(`${API_BASE}/sessions-explorer${qs}`).then(r => r.json()),
    ]).then(
      ([
        cards, userGrowth, sessionStatus, topTutors, sessionsByUniversity,
        activeUsers, repeatBooking, unratedSessions, cancellationReasons
      ]) => {
        setCards(cards);
        setUserGrowth(userGrowth);
        setSessionStatus(sessionStatus);
        setTopTutors(topTutors);
        setSessionsByUniversity(sessionsByUniversity);
        setActiveUsers(activeUsers);
        setRepeatBooking(repeatBooking);
        setUnratedSessions(unratedSessions);
        setCancellationReasons(cancellationReasons);
        setLoading(false);
      }
    );
  }, [dateFilter]);

  // Fetch sessions table
  useEffect(() => {
    if (section !== "sessions") return;
    setSessionsLoading(true);
    fetch(`http://localhost:4000/api/admin/sessions-explorer?range=${sessionsRange}`)
      .then(r => r.json())
      .then(data => {
        setSessions(Array.isArray(data) ? data : []);
        setSessionsLoading(false);
      });
  }, [section, sessionsRange]);

  // Pivot growth data for chart
  const chartData = (() => {
    const dataByMonth: { [month: string]: any } = {};
    userGrowth.forEach((row: any) => {
      if (!dataByMonth[row.month])
        dataByMonth[row.month] = { month: row.month, tutee: 0, tutor: 0 };
      dataByMonth[row.month][row.role] = row.count;
    });
    return Object.values(dataByMonth);
  })();

  // Section Animation Variants
  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 },
  };

  return (
    <RoleProtected requiredRoles={['admin']}>
      <motion.div
        className="flex min-h-screen bg-[#F5F5EF] font-sans"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Sidebar */}
        <AdminSidebar
          minimized={sidebarMin}
          setMinimized={setSidebarMin}
          feedbackCount={cards?.totalFeedback}
        />

        {/* Main Content */}
        <main
          className={`
            flex-1
            pt-16
            px-2 py-4
            sm:px-6 sm:py-6
            md:px-10 md:py-10
            transition-all duration-300
            ${!sidebarMin ? "md:ml-60" : ""}
          `}
        >
          {/* Section Selector & Date Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-8">
            {dashboardSections.map(sec => (
              <motion.button
                key={sec.value}
                onClick={() => setSection(sec.value)}
                className={`
                  flex items-center gap-2
                  px-3 py-2 sm:px-6 sm:py-2
                  rounded-xl font-semibold
                  text-sm sm:text-base shadow
                  ${section === sec.value
                    ? "bg-[#E8B14F] text-black"
                    : "bg-white text-gray-700 hover:bg-[#fdf7ea]"}
                `}
                whileTap={{ scale: 0.97 }}
                animate={section === sec.value ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 340 }}
              >
                {sec.icon}
                {sec.label}
              </motion.button>
            ))}
            {/* Date Range Filter: hide in Sessions Overview */}
            {section !== "sessions" && (
              <div className="flex gap-1 md:gap-3 bg-white px-2 md:px-4 py-2 rounded-xl shadow ml-auto">
                {dateRanges.map(opt => (
                  <motion.button
                    key={opt.value}
                    onClick={() => setDateFilter(opt.value)}
                    className={`px-2 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold transition-all
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
            )}
          </div>

          {/* Section Content */}
          <AnimatePresence mode="wait">
            {section === "growth" && (
              <motion.div
                key="growth"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.7 }}
              >
                {/* Summary Cards */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-8 mb-8 md:mb-12">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-full h-[90px] md:h-[120px] rounded-2xl bg-gray-200 animate-pulse" />
                    ))
                    : (
                      <>
                        <SummaryCard
                          title="Tutees"
                          value={cards?.totalTutees ?? "..."}
                          icon={<Users className="text-[#E8B14F]" size={28} />}
                          accent="#E8B14F"
                        />
                        <SummaryCard
                          title="Tutors"
                          value={cards?.totalTutors ?? "..."}
                          icon={<GraduationCap className="text-[#E8B14F]" size={28} />}
                          accent="#E8B14F"
                        />
                        <SummaryCard
                          title="Sessions"
                          value={cards?.totalSessions ?? "..."}
                          icon={<BookOpen className="text-[#E8B14F]" size={28} />}
                          accent="#E8B14F"
                        />
                        <SummaryCard
                          title="Completed"
                          value={cards?.completedAllTime ?? "..."}
                          icon={<CalendarCheck className="text-green-500" size={28} />}
                          accent="#A7F3D0"
                        />
                        <SummaryCard
                          title="Cancelled"
                          value={cards?.cancelledAllTime ?? "..."}
                          icon={<CalendarX className="text-red-400" size={28} />}
                          accent="red"
                        />
                        <SummaryCard
                          title="Feedback"
                          value={cards?.totalFeedback ?? "..."}
                          icon={<MessageCircle className="text-sky-400" size={28} />}
                          accent="#38bdf8"
                        />
                      </>
                    )
                  }
                </div>
                {/* Charts Row */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* User Growth Chart */}
                  <motion.div className="bg-white rounded-2xl shadow-md p-4 md:p-6 min-h-[260px] md:min-h-[300px] flex flex-col">
                    <h2 className="font-bold mb-4 text-base md:text-lg">User Growth Over Time</h2>
                    {loading ? <Spinner /> :
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="tutee" name="Tutees" stroke="#E8B14F" strokeWidth={3} />
                          <Line type="monotone" dataKey="tutor" name="Tutors" stroke="#111827" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    }
                  </motion.div>
                  {/* Sessions by University */}
                  <motion.div className="bg-white rounded-2xl shadow-md p-4 md:p-6 min-h-[260px] md:min-h-[300px] flex flex-col">
                    <h2 className="font-bold mb-4 text-base md:text-lg">Sessions by University</h2>
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
              </motion.div>
            )}

            {section === "engagement" && (
              <motion.div
                key="engagement"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.7 }}
              >
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-full h-[90px] md:h-[120px] rounded-2xl bg-gray-200 animate-pulse" />
                    ))
                    : (
                      <>
                        <SummaryCard
                          title="Active Tutees"
                          value={activeUsers?.activeTutees ?? "..."}
                          icon={<UserCheck className="text-[#E8B14F]" size={28} />}
                          accent="#E8B14F"
                        />
                        <SummaryCard
                          title="Active Tutors"
                          value={activeUsers?.activeTutors ?? "..."}
                          icon={<UserCheck className="text-[#FBBF24]" size={28} />}
                          accent="#FBBF24"
                        />
                        <SummaryCard
                          title="Repeat Booking Rate"
                          value={repeatBooking ? `${repeatBooking.rate}%` : "..."}
                          icon={<Repeat2 className="text-[#A78BFA]" size={28} />}
                          accent="#A78BFA"
                        />
                        <SummaryCard
                          title="Unrated Sessions"
                          value={unratedSessions.length}
                          icon={<Star className="text-gray-400" size={28} />}
                          accent="#e5e7eb"
                        />
                      </>
                    )
                  }
                </div>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Top Tutors */}
                  <motion.div className="bg-white rounded-2xl shadow-md p-4 md:p-6 min-h-[260px] md:min-h-[300px] flex flex-col">
                    <h2 className="font-bold mb-4 text-base md:text-lg">Top 5 Tutors by Sessions</h2>
                    {loading ? <Spinner /> :
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={topTutors}
                          layout="vertical"
                          margin={{ left: 100, right: 30, top: 0, bottom: 0 }}
                          barCategoryGap={24}
                        >
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="first_name"
                            tick={({ payload, ...rest }) => {
                              const tutor = topTutors.find(t => t.first_name === payload.value);
                              return (
                                <g transform={`translate(${rest.x},${rest.y})`}>
                                  <text x={-5} y={0} dy={4} fontSize={15} fontWeight={600} fill="#333" textAnchor="end">
                                    {tutor
                                      ? (tutor.first_name + " " + (tutor.last_name?.charAt(0) || "") + ".")
                                      : payload.value}
                                  </text>
                                </g>
                              );
                            }}
                            width={100}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload || !payload[0] || !payload[0].payload) return null;
                              const tutor = payload[0].payload;
                              return (
                                <div style={{
                                  background: "#fff", border: "1px solid #E8B14F", borderRadius: 10,
                                  padding: 12, boxShadow: "0 2px 10px #e8b14f33"
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                                    <img
                                      src={tutor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.first_name + " " + (tutor.last_name || ""))}`}
                                      alt="avatar"
                                      style={{
                                        width: 36, height: 36, borderRadius: "50%", marginRight: 10, border: "2px solid #A78BFA"
                                      }}
                                    />
                                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                                      {tutor.first_name} {tutor.last_name}
                                    </span>
                                  </div>
                                  <div style={{ color: "#a78bfa", fontWeight: 500, fontSize: 15, marginBottom: 4 }}>
                                    {tutor.price_per_hour ? `${Number(tutor.price_per_hour).toFixed(2)} $/h` : ""}
                                  </div>
                                  <div>
                                    <span style={{ color: "#333" }}>Sessions: </span>
                                    <b>{tutor.session_count}</b>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="session_count" fill="#A78BFA" radius={[0, 8, 8, 0]}>
                            {topTutors.map((entry, idx) => (
                              <Cell key={entry.id} fill={["#A78BFA", "#FBBF24", "#60A5FA", "#34D399", "#F87171"][idx % 5]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    }
                  </motion.div>
                  {/* Cancellation Reasons */}
                  <motion.div className="bg-white rounded-2xl shadow-md p-4 md:p-6 min-h-[260px] md:min-h-[300px] flex flex-col">
                    <h2 className="font-bold mb-4 text-base md:text-lg">Session Cancellation Reasons</h2>
                    {loading ? <Spinner /> :
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={cancellationReasons}
                            dataKey="count"
                            nameKey="reason"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={false}
                            labelLine={false}
                          >
                            {cancellationReasons.map((entry, i) => (
                              <Cell
                                key={entry.reason}
                                fill={["#e53333", "#FBBF24", "#60A5FA", "#A78BFA", "#E8B14F"][i % 5]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v, _name, props) =>
                              [`${v} cancellations`, props.payload.reason]
                            }
                          />
                          <Legend
                            wrapperStyle={{ fontSize: 16 }}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    }
                  </motion.div>
                </div>
                {/* Table of Unrated Sessions */}
                <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mt-6 md:mt-8">
                  <h2 className="font-bold mb-4 text-base md:text-lg">Unrated Sessions</h2>
                  {loading ? <Spinner /> :
                    unratedSessions.length === 0 ? (
                      <div className="text-gray-400">All sessions have been rated! 🎉</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[#E8B14F] font-semibold text-xs md:text-sm">
                              <th>Date</th>
                              <th>Tutor</th>
                              <th>Tutee</th>
                              <th>Course</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unratedSessions.map((s, i) => (
                              <tr key={i} className="border-t">
                                <td className="py-2">{new Date(s.scheduled_date).toLocaleDateString('en-GB')}</td>
                                <td className="py-2">{`${s.tutor_first} ${s.tutor_last}`}</td>
                                <td className="py-2">{`${s.tutee_first} ${s.tutee_last}`}</td>
                                <td className="py-2">{`${s.course_code} - ${s.course_name}`}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </div>
              </motion.div>
            )}

            {section === "sessions" && (
              <motion.div
                key="sessions"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.7 }}
              >
                {/* Header and Filters */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                  <h2 className="font-bold text-xl md:text-2xl flex items-center gap-3">
                    <CalendarCheck className="text-[#E8B14F]" size={28} />
                    Sessions Overview
                  </h2>
                  <div className="flex gap-3">
                    <button
                      className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow
                        ${sessionsRange === "today" ? "bg-[#E8B14F] text-black" : "bg-white text-gray-700 hover:bg-[#fdf7ea]"}
                      `}
                      onClick={() => setSessionsRange("today")}
                    >
                      Today
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow
                        ${sessionsRange === "week" ? "bg-[#E8B14F] text-black" : "bg-white text-gray-700 hover:bg-[#fdf7ea]"}
                      `}
                      onClick={() => setSessionsRange("week")}
                    >
                      This Week
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full font-semibold text-sm transition-all shadow
                        ${sessionsRange === "upcoming" ? "bg-[#E8B14F] text-black" : "bg-white text-gray-700 hover:bg-[#fdf7ea]"}
                      `}
                      onClick={() => setSessionsRange("upcoming")}
                    >
                      Future
                    </button>
                  </div>
                </div>
                {/* Sessions Table */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-md p-6"
                >
                  {sessionsLoading ? (
                    <Spinner />
                  ) : sessions.length === 0 ? (
                    <div className="text-gray-400 text-center py-16">
                      No sessions found for this filter!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[#E8B14F] font-semibold text-xs md:text-sm">
                            <th>Date</th>
                            <th>Time</th>
                            <th>Tutor</th>
                            <th>Tutee</th>
                            <th>Course</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((s, i) => (
                            <tr key={s.id || i} className="border-t">
                              <td className="py-2">
                                {new Date(s.scheduled_date).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-2">
                                {new Date(s.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={s.tutor_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.tutor_first + " " + (s.tutor_last || ""))}`}
                                    alt="tutor"
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                  />
                                  <span>{s.tutor_first} {s.tutor_last}</span>
                                </div>
                              </td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={s.tutee_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.tutee_first + " " + (s.tutee_last || ""))}`}
                                    alt="tutee"
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                  />
                                  <span>{s.tutee_first} {s.tutee_last}</span>
                                </div>
                              </td>
                              <td className="py-2">{s.course_code} - {s.course_name}</td>
                              <td className="py-2 capitalize">{s.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </motion.div>
    </RoleProtected>
  );
}
