const StatCard = ({ icon, label, value, sub, color = 'violet' }) => {
  const colors = {
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    green:  'bg-green-500/10  border-green-500/20  text-green-400',
    blue:   'bg-blue-500/10   border-blue-500/20   text-blue-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    red:    'bg-red-500/10    border-red-500/20    text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value ?? '—'}</p>
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
};

export default StatCard;