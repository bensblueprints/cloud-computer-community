export default function StatsCard({ label, value, icon: Icon, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-900/50 text-purple-400',
    green: 'bg-green-900/50 text-green-400',
    blue: 'bg-blue-900/50 text-blue-400',
    yellow: 'bg-yellow-900/50 text-yellow-400',
    red: 'bg-red-900/50 text-red-400',
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
