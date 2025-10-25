import { useState } from 'react';
import type { DateOption } from '../../types';
import { formatDateLabel } from '../../utils/dateHelpers';

interface CalendarMonthViewProps {
  dateOptions: DateOption[];
  onAddDate: (isoDate: string) => void;
  onRemoveDate: (dateId: string) => void;
}

export default function CalendarMonthView({
  dateOptions,
  onAddDate,
  onRemoveDate,
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Get the first day of the month and total days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Generate array of dates for the calendar
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before the month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add all days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Create a set of selected dates for quick lookup
  const selectedDatesSet = new Set(dateOptions.map(opt => opt.date));

  // Format current month display
  const monthYearDisplay = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

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

  // Check if a date is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Check if a date is in the past
  const isPast = (day: number): boolean => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if a date is a weekend
  const isWeekend = (day: number): boolean => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
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
            const isoDate = date.toISOString().split('T')[0];
            const isSelected = selectedDatesSet.has(isoDate);
            const isTodayDate = isToday(day);
            const isPastDate = isPast(day);
            const isWeekendDate = isWeekend(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isPastDate}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all
                  flex items-center justify-center
                  text-sm font-medium
                  ${isPastDate
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : isSelected
                    ? 'bg-ocean-500 text-white border-ocean-600 hover:bg-ocean-600 shadow-md scale-105'
                    : isWeekendDate
                    ? 'bg-sand-50 text-ocean-700 border-sand-200 hover:bg-sand-100 hover:border-ocean-300'
                    : 'bg-white text-ocean-700 border-ocean-200 hover:bg-ocean-50 hover:border-ocean-400'
                  }
                  ${isTodayDate && !isSelected ? 'ring-2 ring-coral-400 ring-offset-1' : ''}
                `}
                aria-label={`${formatDateLabel(isoDate)}${isSelected ? ' (selected)' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t-2 border-ocean-100 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-ocean-500 bg-ocean-500"></div>
            <span className="text-gray-700">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-coral-400 ring-2 ring-coral-400 ring-offset-1 bg-white"></div>
            <span className="text-gray-700">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-sand-200 bg-sand-50"></div>
            <span className="text-gray-700">Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-gray-200 bg-gray-100"></div>
            <span className="text-gray-700">Past</span>
          </div>
        </div>
      </div>
    </div>
  );
}
