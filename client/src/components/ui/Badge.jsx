const Badge = ({ label, color = 'gray' }) => {
  const colors = {
    gray:   'bg-gray-500/20 text-gray-400',
    green:  'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red:    'bg-red-500/20 text-red-400',
    blue:   'bg-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/20 text-violet-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${colors[color]}`}>
      {label}
    </span>
  );
};

export default Badge;