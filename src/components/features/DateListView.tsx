import type { DateOption } from '../../types';

interface DateListViewProps {
  dateOptions: DateOption[];
  onRemoveDate: (dateId: string) => void;
}

interface GroupedDate {
  month: string; // "January 2025"
  dates: {
    dateOption: DateOption;
    dayOfWeek: string; // "Mon", "Tue", etc.
    dayOfMonth: number; // 15
  }[];
}

export default function DateListView({
  dateOptions,
  onRemoveDate,
}: DateListViewProps) {
  // Group dates by month
  const groupedByMonth: GroupedDate[] = [];

  dateOptions.forEach((option) => {
    const date = new Date(option.date + 'T00:00:00');
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayOfMonth = date.getDate();

    let monthGroup = groupedByMonth.find((g) => g.month === monthYear);
    if (!monthGroup) {
      monthGroup = { month: monthYear, dates: [] };
      groupedByMonth.push(monthGroup);
    }

    monthGroup.dates.push({
      dateOption: option,
      dayOfWeek,
      dayOfMonth,
    });
  });

  // Sort months chronologically
  groupedByMonth.sort((a, b) => {
    const dateA = new Date(a.dates[0].dateOption.date);
    const dateB = new Date(b.dates[0].dateOption.date);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-6">
      {groupedByMonth.map((monthGroup) => (
        <div key={monthGroup.month}>
          {/* Month Header */}
          <h3 className="text-lg font-bold text-ocean-700 mb-3">
            {monthGroup.month} ({monthGroup.dates.length} {monthGroup.dates.length === 1 ? 'date' : 'dates'})
          </h3>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-ocean-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-ocean-100">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-ocean-800 border-r border-ocean-200">
                    Day
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-ocean-800 border-r border-ocean-200">
                    Date
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-ocean-800">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthGroup.dates.map((dateInfo) => {
                  const isWeekend = ['Sat', 'Sun'].includes(dateInfo.dayOfWeek);

                  return (
                    <tr
                      key={dateInfo.dateOption.id}
                      className={`border-t border-ocean-200 transition-colors ${
                        isWeekend
                          ? 'bg-sand-100 hover:bg-sand-200'
                          : 'bg-white hover:bg-ocean-50'
                      }`}
                    >
                      {/* Day of Week */}
                      <td
                        className={`px-4 py-3 border-r border-ocean-200 font-medium ${
                          isWeekend ? 'text-coral-600' : 'text-gray-700'
                        }`}
                      >
                        {dateInfo.dayOfWeek}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 border-r border-ocean-200 text-gray-800">
                        {dateInfo.dateOption.label}
                      </td>

                      {/* Remove Button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onRemoveDate(dateInfo.dateOption.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-300 rounded-lg transition-colors"
                          aria-label="Remove date"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
