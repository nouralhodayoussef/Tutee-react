// components/admin/SummaryCard.tsx

type SummaryCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
};

export default function SummaryCard({ title, value, icon, accent }: SummaryCardProps) {
  return (
    <div
      className="flex flex-col items-start justify-between p-5 rounded-2xl shadow-md bg-white min-w-[180px] min-h-[120px] border-l-8"
      style={{ borderColor: accent }}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-xl font-semibold text-black">{title}</span>
      </div>
      <span className="text-3xl font-bold text-[#E8B14F]">{value}</span>
    </div>
  );
}
