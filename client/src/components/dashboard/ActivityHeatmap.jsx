const DAY_COUNT = 84;

const dayKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const levelClass = (count) => {
  if (count >= 5) return 'bg-violet-400';
  if (count >= 3) return 'bg-violet-600';
  if (count >= 1) return 'bg-violet-800';
  return 'bg-gray-800';
};

const ActivityHeatmap = ({ activities = [] }) => {
  const counts = new Map(activities.map((activity) => [
    String(activity.date).slice(0, 10),
    activity.problemsSolved || 0,
  ]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (DAY_COUNT - 1));
  const days = Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dayKey(date);
    return { date, key, count: counts.get(key) || 0 };
  });
  const activeDays = days.filter((day) => day.count > 0).length;
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5" aria-labelledby="activity-calendar-title">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 id="activity-calendar-title" className="text-white font-semibold">Activity</h3>
          <p className="text-gray-500 text-xs mt-1">{activeDays} active days in the last 12 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500" aria-label="Activity level legend">
          <span>Less</span>
          {[0, 1, 3, 5].map((count) => (
            <span key={count} className={`w-3 h-3 rounded-sm ${levelClass(count)}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[610px]">
          <div className="grid grid-flow-col grid-rows-1 gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${DAY_COUNT}, minmax(0, 1fr))` }}>
            {days.map((day, index) => {
              const isMonthStart = index === 0 || day.date.getMonth() !== days[index - 1].date.getMonth();
              return (
                <span key={day.key} className="h-3 text-[9px] text-gray-500 whitespace-nowrap">
                  {isMonthStart ? day.date.toLocaleDateString('en', { month: 'short' }) : ''}
                </span>
              );
            })}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: `repeat(${DAY_COUNT}, minmax(0, 1fr))` }}>
            {days.map((day) => (
              <span
                key={day.key}
                title={`${day.count} solved on ${day.date.toLocaleDateString()}`}
                aria-label={`${day.count} problems solved on ${day.date.toLocaleDateString()}`}
                className={`aspect-square min-w-1.5 rounded-[3px] ${levelClass(day.count)}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivityHeatmap;
