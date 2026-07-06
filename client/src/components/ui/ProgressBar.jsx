const ProgressBar = ({ value = 0, color = 'bg-violet-500', height = 'h-2' }) => {
  return (
    <div className={`w-full bg-gray-800 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${color} ${height} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};

export default ProgressBar;