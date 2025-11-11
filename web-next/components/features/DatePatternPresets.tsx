import {
  generateQuarterlyWeekends,
  generateNextWeekends,
  generateThisWeekend,
} from '@seacalendar/shared';

export interface DatePatternPresetsProps {
  onDatesSelected: (dates: string[]) => void;
}

export default function DatePatternPresets({ onDatesSelected }: DatePatternPresetsProps) {
  const presets = [
    {
      label: 'Quarterly Weekends',
      description: 'Fri-Sun for current + next 2 months',
      onClick: () => onDatesSelected(generateQuarterlyWeekends()),
    },
    {
      label: 'Next 4 Weekends',
      description: 'Fri-Sun for the next 4 weekends',
      onClick: () => onDatesSelected(generateNextWeekends(4, true)),
    },
    {
      label: 'This Weekend',
      description: 'Fri-Sun for the upcoming weekend',
      onClick: () => onDatesSelected(generateThisWeekend(true)),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-ocean-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h3 className="font-semibold text-ocean-800">Quick Patterns</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={preset.onClick}
            className="group relative p-4 rounded-lg border-2 border-ocean-200 bg-white hover:border-ocean-400 hover:bg-ocean-50 transition-all duration-200 text-left hover:shadow-md cursor-pointer"
          >
            <div className="flex flex-col gap-1">
              <div className="font-medium text-ocean-800 group-hover:text-ocean-900">
                {preset.label}
              </div>
              <div className="text-xs text-gray-600">{preset.description}</div>
            </div>

            {/* Wave animation on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ocean-400 to-coral-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
          </button>
        ))}
      </div>
    </div>
  );
}
