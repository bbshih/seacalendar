import { useState } from 'react';
import { v4 as uuidv4 } from '@lukeed/uuid';
import Card from '../shared/Card';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import CopyButton from '../shared/CopyButton';
import type { Event, DateOption } from '../../types';
import { buildVotingUrl, buildResultsUrl } from '../../utils/urlState';
import { formatDateLabel, generateDatesInRange } from '../../utils/dateHelpers';

export default function CreateEventPage() {
  const [eventTitle, setEventTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);

  // Quick add state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([5, 6]); // Fri, Sat by default

  // Manual add state
  const [manualDate, setManualDate] = useState('');

  // Modal state
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [generatedEvent, setGeneratedEvent] = useState<Event | null>(null);

  const handleQuickAdd = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    const dates = generateDatesInRange(start, end, selectedDays);
    const newDateOptions: DateOption[] = dates.map((isoDate, index) => ({
      id: `date-${dateOptions.length + index}`,
      date: isoDate,
      label: formatDateLabel(isoDate),
    }));

    setDateOptions([...dateOptions, ...newDateOptions]);
    setStartDate('');
    setEndDate('');
  };

  const handleManualAdd = () => {
    if (!manualDate) {
      alert('Please select a date');
      return;
    }

    // Check for duplicates
    if (dateOptions.some(opt => opt.date === manualDate)) {
      alert('This date has already been added');
      return;
    }

    const newDateOption: DateOption = {
      id: `date-${dateOptions.length}`,
      date: manualDate,
      label: formatDateLabel(manualDate),
    };

    setDateOptions([...dateOptions, newDateOption]);
    setManualDate('');
  };

  const handleRemoveDate = (id: string) => {
    setDateOptions(dateOptions.filter(opt => opt.id !== id));
  };

  const handleGenerateLinks = () => {
    if (!eventTitle.trim()) {
      alert('Please enter an event title');
      return;
    }

    if (!organizerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (dateOptions.length === 0) {
      alert('Please add at least one date option');
      return;
    }

    // Sort dates chronologically
    const sortedDates = [...dateOptions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const event: Event = {
      id: uuidv4(),
      title: eventTitle.trim(),
      organizer: organizerName.trim(),
      dateOptions: sortedDates,
      votes: [],
      createdAt: new Date().toISOString(),
    };

    setGeneratedEvent(event);
    setShowLinksModal(true);
  };

  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const votingUrl = generatedEvent ? buildVotingUrl(generatedEvent) : '';
  const resultsUrl = generatedEvent ? buildResultsUrl(generatedEvent) : '';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-ocean-600 mb-2">
            Set Sail on a New Adventure
          </h1>
          <p className="text-lg text-ocean-500">
            Create an event and let your crew vote on dates
          </p>
        </div>

        <Card>
          {/* Event Details */}
          <div className="space-y-6">
            <Input
              label="Event Title"
              placeholder="Q1 2025 Hangouts"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              fullWidth
            />

            <Input
              label="Your Name (Organizer)"
              placeholder="Your name"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              fullWidth
            />

            {/* Date Selection */}
            <div>
              <h2 className="text-2xl font-bold text-ocean-600 mb-4">
                Add Date Options
              </h2>

              {/* Quick Add */}
              <div className="bg-ocean-50 p-6 rounded-xl mb-6">
                <h3 className="font-semibold text-ocean-700 mb-3">
                  Quick Add: Date Range
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    fullWidth
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => handleToggleDay(index)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedDays.includes(index)
                            ? 'bg-ocean-400 border-ocean-600 text-white'
                            : 'bg-white border-ocean-200 text-ocean-600 hover:border-ocean-400'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleQuickAdd} variant="secondary" size="sm">
                  Generate Dates
                </Button>
              </div>

              {/* Manual Add */}
              <div className="bg-sand-100 p-6 rounded-xl mb-6">
                <h3 className="font-semibold text-ocean-700 mb-3">
                  Manual Add: Single Date
                </h3>
                <div className="flex gap-3">
                  <Input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    fullWidth
                  />
                  <Button onClick={handleManualAdd} variant="outline" size="md">
                    Add Date
                  </Button>
                </div>
              </div>

              {/* Date List */}
              {dateOptions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-ocean-700 mb-3">
                    Selected Dates ({dateOptions.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dateOptions.map((option) => (
                      <div
                        key={option.id}
                        className="bg-white border-2 border-ocean-200 rounded-lg p-3 flex items-center justify-between"
                      >
                        <span className="text-ocean-700 font-medium">
                          {option.label}
                        </span>
                        <button
                          onClick={() => handleRemoveDate(option.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          aria-label="Remove date"
                        >
                          <svg
                            className="w-5 h-5"
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
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="pt-6 border-t-2 border-ocean-100">
              <Button
                onClick={handleGenerateLinks}
                variant="primary"
                size="lg"
                fullWidth
              >
                Generate Voting Link
              </Button>
            </div>
          </div>
        </Card>

        {/* Links Modal */}
        <Modal
          isOpen={showLinksModal}
          onClose={() => setShowLinksModal(false)}
          title="Your Event is Ready!"
          size="lg"
        >
          <div className="space-y-6">
            <p className="text-gray-700">
              Share the voting link with your friends, and use the results link to view
              votes and select the winning date.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voting Link (Share with friends)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={votingUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm"
                />
                <CopyButton textToCopy={votingUrl} variant="secondary" size="md" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results Link (For organizer only)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resultsUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-sand-100 text-sm"
                />
                <CopyButton textToCopy={resultsUrl} variant="primary" size="md" />
              </div>
              <p className="mt-2 text-sm text-coral-500">
                Important: Save this link to access results and finalize the event!
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
