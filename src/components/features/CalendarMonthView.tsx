import { useState, useMemo, memo } from 'react';
import type { DateOption } from '../../types';
import { formatDateLabel } from '../../utils/dateHelpers';

interface CalendarMonthViewProps {
  dateOptions: DateOption[];
  onAddDate: (isoDate: string) => void;
  onRemoveDate: (dateId: string) => void;
}

// Memoized calendar day cell component for better performance
const CalendarDay = memo(function CalendarDay({
  day,
  year,
  month,
  isSelected,
  isPast,
  isToday,
  isWeekend,
  onClick,
}: {
  day: number;
  year: number;
  month: number;
  isSelected: boolean;
  isPast: boolean;
  isToday: boolean;
  isWeekend: boolean;
  onClick: () => void;
}) {
  const date = new Date(year, month, day);
  const isoDate = date.toISOString().split('T')[0];

  return (
    <button
      onClick={onClick}
      disabled={isPast}
      className={`
        aspect-square p-2 rounded-lg transition-all
        flex items-center justify-center
        text-sm font-medium
        ${isToday ? 'ring-2 ring-coral-400 ring-offset-1' : ''}
        ${isPast
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : isSelected
          ? 'bg-ocean-500 text-white hover:bg-ocean-600 shadow-md'
          : isWeekend
          ? 'bg-sand-50 text-ocean-700 hover:bg-sand-100'
          : 'bg-white text-gray-600 hover:bg-ocean-50 hover:text-ocean-700'
        }
      `}
      aria-label={`${formatDateLabel(isoDate)}${isSelected ? ' (selected)' : ''}`}
    >
      {day}
    </button>
  );
});

function CalendarMonthView({
  dateOptions,
  onAddDate,
  onRemoveDate,
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Get the first day of the month and total days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Memoize calendar calculations
  const { calendarDays, selectedDatesSet, todayTimestamp, todayDate } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    // Generate array of dates for the calendar
    const days: (number | null)[] = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    // Create a set of selected dates for quick lookup
    const selectedSet = new Set(dateOptions.map(opt => opt.date));

    // Get today's timestamp for comparison (at midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    // Store today's full date info
    const todayInfo = {
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
    };

    return {
      calendarDays: days,
      selectedDatesSet: selectedSet,
      todayTimestamp: todayTs,
      todayDate: todayInfo
    };
  }, [year, month, dateOptions]);

  // Format current month display
  const monthYearDisplay = useMemo(
    () => currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
    [currentMonth]
  );

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Handle date click
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    const isoDate = clickedDate.toISOString().split('T')[0];

    if (selectedDatesSet.has(isoDate)) {
      // Find and remove the date
      const dateOption = dateOptions.find(opt => opt.date === isoDate);
      if (dateOption) {
        onRemoveDate(dateOption.id);
      }
    } else {
      // Add the date
      onAddDate(isoDate);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border-2 border-ocean-200 overflow-hidden">
      {/* Header with navigation */}
      <div className="bg-ocean-100 px-4 py-3 flex items-center justify-between border-b-2 border-ocean-200">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-ocean-200 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-ocean-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-ocean-800">{monthYearDisplay}</h3>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-ocean-200 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-ocean-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-ocean-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const date = new Date(year, month, day);
            const dateTimestamp = date.getTime();
            const isoDate = date.toISOString().split('T')[0];
            const isSelected = selectedDatesSet.has(isoDate);
            const isPastDate = dateTimestamp < todayTimestamp;
            const isTodayDate = todayDate.year === year && todayDate.month === month && todayDate.day === day;
            const dayOfWeek = date.getDay();
            const isWeekendDate = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

            return (
              <CalendarDay
                key={day}
                day={day}
                year={year}
                month={month}
                isSelected={isSelected}
                isPast={isPastDate}
                isToday={isTodayDate}
                isWeekend={isWeekendDate}
                onClick={() => handleDateClick(day)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(CalendarMonthView);
