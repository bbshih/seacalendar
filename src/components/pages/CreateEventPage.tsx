import { useState } from 'react';
import { v4 as uuidv4 } from '@lukeed/uuid';
import Card from '../shared/Card';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import CopyButton from '../shared/CopyButton';
import GitHubTokenSetup from '../shared/GitHubTokenSetup';
import type { Event, DateOption } from '../../types';
import { formatDateLabel, generateDatesInRange } from '../../utils/dateHelpers';
import { createEventGist, getGitHubToken, type CreateEventResult } from '../../utils/githubStorage';

export default function CreateEventPage() {
  const [eventTitle, setEventTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  // Password protection
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');

  // Quick add state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([5, 6]); // Fri, Sat by default

  // Manual add state
  const [manualDate, setManualDate] = useState('');

  // Modal state
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [eventResult, setEventResult] = useState<CreateEventResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

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

  const handleGenerateLinks = async () => {
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

    if (usePassword && !password.trim()) {
      alert('Please enter a password or disable password protection');
      return;
    }

    if (usePassword && password.length < 8) {
      alert('Password must be at least 8 characters for security');
      return;
    }

    const token = githubToken || getGitHubToken();
    if (!token) {
      alert('Please set up your GitHub token first');
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

    setIsCreating(true);
    setCreateError('');

    try {
      const result = await createEventGist(
        event,
        { token },
        usePassword ? password : undefined
      );
      setEventResult(result);
      setShowLinksModal(true);
    } catch (error) {
      console.error('Failed to create event:', error);
      setCreateError(
        error instanceof Error ? error.message : 'Failed to create event. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-ocean-600 mb-2">
            ⚓ Set Sail on a New Adventure ⛵
          </h1>
          <p className="text-lg text-ocean-500">
            Create an event and let your crew vote on dates 🗳️
          </p>
        </div>

        {/* GitHub Token Setup */}
        <div className="mb-6">
          <GitHubTokenSetup
            onTokenReady={setGithubToken}
            requireToken={false}
          />
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

            {/* Password Protection */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="use-password"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="w-4 h-4 text-ocean-600 border-ocean-300 rounded focus:ring-ocean-500"
              />
              <label htmlFor="use-password" className="text-ocean-700">
                Password protect event
              </label>
            </div>

            {usePassword && (
              <Input
                label="Event Password"
                type="password"
                placeholder="Choose a memorable password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />
            )}

            {/* Date Selection */}
            <div>
              <h2 className="text-2xl font-bold text-ocean-600 mb-4">
                📅 Add Date Options
              </h2>

              {/* Quick Add */}
              <div className="bg-ocean-50 p-6 rounded-xl mb-6">
                <h3 className="font-semibold text-ocean-700 mb-3">
                  Quick Add: Date Range
                </h3>

                {/* Quick Selection Buttons */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Select Range
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const today = new Date();
                        const oneMonthLater = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                        setStartDate(today.toISOString().split('T')[0]);
                        setEndDate(oneMonthLater.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1.5 text-sm bg-white border-2 border-ocean-300 text-ocean-700 rounded-lg hover:bg-ocean-50 transition-colors"
                    >
                      Next 1 Month
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const twoMonthsLater = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());
                        setStartDate(today.toISOString().split('T')[0]);
                        setEndDate(twoMonthsLater.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1.5 text-sm bg-white border-2 border-ocean-300 text-ocean-700 rounded-lg hover:bg-ocean-50 transition-colors"
                    >
                      Next 2 Months
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
                        setStartDate(today.toISOString().split('T')[0]);
                        setEndDate(threeMonthsLater.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1.5 text-sm bg-white border-2 border-ocean-300 text-ocean-700 rounded-lg hover:bg-ocean-50 transition-colors"
                    >
                      Next 3 Months
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Input
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      fullWidth
                    />
                    <button
                      onClick={() => {
                        const today = new Date();
                        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                        setStartDate(firstOfMonth.toISOString().split('T')[0]);
                      }}
                      className="mt-2 px-3 py-1.5 text-sm bg-white border-2 border-ocean-300 text-ocean-700 rounded-lg hover:bg-ocean-50 transition-colors"
                    >
                      First of Month
                    </button>
                  </div>
                  <div>
                    <Input
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      fullWidth
                    />
                    <button
                      onClick={() => {
                        const today = new Date();
                        const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        setEndDate(lastOfMonth.toISOString().split('T')[0]);
                      }}
                      className="mt-2 px-3 py-1.5 text-sm bg-white border-2 border-ocean-300 text-ocean-700 rounded-lg hover:bg-ocean-50 transition-colors"
                    >
                      End of Month
                    </button>
                  </div>
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
                  ✨ Generate Dates
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
                    ➕ Add Date
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
              {createError && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
                  {createError}
                </div>
              )}
              <Button
                onClick={handleGenerateLinks}
                variant="primary"
                size="lg"
                fullWidth
                disabled={isCreating || !githubToken}
              >
                {isCreating ? '🔄 Creating Event...' : '🚀 Generate Voting Link'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Links Modal */}
        <Modal
          isOpen={showLinksModal}
          onClose={() => setShowLinksModal(false)}
          title="🎉 Your Event is Ready!"
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-seaweed-50 border-2 border-seaweed-200 rounded-lg p-4">
              <p className="text-seaweed-800 font-medium">
                ✅ Event stored securely in private encrypted Gist
              </p>
              <p className="text-sm text-seaweed-700 mt-1">
                Share the voting link with your friends. Keep the results link for yourself!
              </p>
            </div>

            {usePassword ? (
              <div className="bg-seaweed-50 border-2 border-seaweed-400 rounded-lg p-4">
                <p className="text-seaweed-800 font-semibold mb-2">
                  🔒 Password Protected
                </p>
                <p className="text-sm text-seaweed-700 mb-2">
                  Your event is password-protected! The URLs below don't contain encryption keys.
                </p>
                <div className="bg-white rounded-lg p-3 mt-2">
                  <p className="text-sm font-semibold text-ocean-700 mb-1">Event Password:</p>
                  <code className="text-lg font-mono text-ocean-600 bg-ocean-50 px-3 py-1 rounded">
                    {password}
                  </code>
                </div>
                <p className="text-sm text-seaweed-600 mt-2">
                  Share this password with voters through a separate channel (text message, Signal, in-person, etc.)
                </p>
              </div>
            ) : (
              <div className="bg-coral-50 border-2 border-coral-400 rounded-lg p-4">
                <p className="text-coral-800 font-semibold mb-2">
                  ⚠️ Security Notice
                </p>
                <ul className="text-sm text-coral-700 space-y-1">
                  <li>• These URLs contain encryption keys - anyone with the URL can view/vote</li>
                  <li>• Don't share URLs in public channels (avoid Discord, Slack, public forums)</li>
                  <li>• URLs will be saved in browser history and may be logged by analytics</li>
                  <li>• For sensitive events, consider using password protection instead</li>
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voting Link (Share with friends)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventResult?.votingUrl || ''}
                  readOnly
                  className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm font-mono"
                />
                <CopyButton textToCopy={eventResult?.votingUrl || ''} variant="secondary" size="md" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results Link (For organizer only)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventResult?.resultsUrl || ''}
                  readOnly
                  className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-sand-100 text-sm font-mono"
                />
                <CopyButton textToCopy={eventResult?.resultsUrl || ''} variant="primary" size="md" />
              </div>
              <p className="mt-2 text-sm text-coral-500 font-medium">
                ⚠️ Important: Save this link to access results and finalize the event!
              </p>
            </div>

            <div className="bg-ocean-50 border-2 border-ocean-200 rounded-lg p-4">
              <h4 className="font-semibold text-ocean-800 mb-2">Privacy & Storage</h4>
              <ul className="text-sm text-ocean-700 space-y-1">
                <li>• Votes are encrypted before storage</li>
                <li>• Stored in a private GitHub Gist (not publicly listed)</li>
                <li>• You can delete the event data anytime from the results page</li>
                <li>• Gist ID: <code className="bg-white px-1 rounded text-xs">{eventResult?.gistId}</code></li>
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
