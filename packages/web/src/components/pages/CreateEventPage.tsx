import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../shared/Card';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import CopyButton from '../shared/CopyButton';
import CalendarMonthView from '../features/CalendarMonthView';
import type { DateOption } from '../../types';

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [eventTitle, setEventTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPoll, setCreatedPoll] = useState<any>(null);

  const handleAddDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const label = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const newOption: DateOption = {
      id: `temp-${Date.now()}-${Math.random()}`,
      date: isoDate,
      label,
    };
    setDateOptions([...dateOptions, newOption]);
  };

  const handleRemoveDate = (dateId: string) => {
    setDateOptions(dateOptions.filter(opt => opt.id !== dateId));
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      setCreateError('Please enter an event title');
      return;
    }

    if (dateOptions.length === 0) {
      setCreateError('Please select at least one date');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventTitle,
          description: description || undefined,
          type: 'EVENT',
          options: dateOptions.map((opt, i) => ({
            label: opt.label,
            date: opt.date,
            order: i,
          })),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create event');
      }

      setCreatedPoll(data.data.poll);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to create event:', error);
      setCreateError(
        error instanceof Error ? error.message : 'Failed to create event'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const votingUrl = createdPoll
    ? `${window.location.origin}/vote/${createdPoll.id}`
    : '';

  const resultsUrl = createdPoll
    ? `${window.location.origin}/results/${createdPoll.id}`
    : '';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-950 via-ocean-950 to-gray-950 relative overflow-hidden">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(14, 165, 233, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-block mb-4">
            <span className="font-mono text-cyan-500 text-sm block mb-2">&lt;Event.Create /&gt;</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-ocean-400 to-cyan-400"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(14, 165, 233, 0.3)',
            }}>
            ⚓ Create Event
          </h1>
          <p className="text-lg text-cyan-400 font-semibold animate-slide-up font-mono">
            [ Initialize hangout protocol ]
          </p>
        </div>

        {/* Event Details */}
        <div className="mb-6 animate-fade-in bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md border-2 border-cyan-500/30 rounded-lg p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
            <span className="font-mono text-cyan-500 text-sm">STEP_1</span>
            <span>📋 Event Details</span>
          </h2>

          <div className="space-y-4">
            <Input
              label="Event Title"
              placeholder="e.g., Weekend Dinner, Movie Night, Game Session"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              fullWidth
              required
            />

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-900/50 border-2 border-cyan-500/30 text-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 placeholder-cyan-700"
              />
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="mb-6 animate-fade-in bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md border-2 border-cyan-500/30 rounded-lg p-6 shadow-2xl" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
            <span className="font-mono text-cyan-500 text-sm">STEP_2</span>
            <span>📅 Pick Dates</span>
            <span className="ml-auto text-sm font-mono text-cyan-500">({dateOptions.length} selected)</span>
          </h2>

          <CalendarMonthView
            dateOptions={dateOptions}
            onAddDate={handleAddDate}
            onRemoveDate={handleRemoveDate}
          />

          {dateOptions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cyan-500/30">
              <h3 className="text-sm font-medium text-cyan-400 mb-2 font-mono">[ SELECTED_DATES ]:</h3>
              <div className="flex flex-wrap gap-2">
                {dateOptions.map((opt, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-sm font-medium"
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {createError && (
          <div className="mb-6 bg-red-950/90 border-2 border-red-500/50 rounded-lg p-4 animate-fade-in">
            <p className="text-red-400 font-mono text-sm">ERROR: {createError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/my-events')}
            className="flex-1 px-6 py-3 rounded-lg border-2 border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all duration-300 font-bold"
          >
            📋 My Events
          </button>
          <button
            onClick={handleCreateEvent}
            disabled={isCreating}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-ocean-500 to-ocean-600 text-white border-2 border-ocean-400 shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:shadow-[0_0_50px_rgba(14,165,233,0.8)] transition-all duration-500 hover:scale-105 font-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? '⏳ Creating...' : '🌊 Create Event'}
          </button>
        </div>

        {/* Success Modal */}
        {showSuccessModal && createdPoll && (
          <Modal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title="🎉 Event Created!"
          >
            <div className="space-y-4">
              <p className="text-gray-700">
                Your event <strong>{createdPoll.title}</strong> has been created!
              </p>

              {/* Voting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🗳️ Voting Link (Share with friends)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={votingUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <CopyButton
                    textToCopy={votingUrl}
                    variant="secondary"
                    size="md"
                  />
                </div>
              </div>

              {/* Results Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Results Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resultsUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <CopyButton
                    textToCopy={resultsUrl}
                    variant="secondary"
                    size="md"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/my-events');
                  }}
                  className="flex-1"
                >
                  View My Events
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/results/${createdPoll.id}`)}
                  className="flex-1"
                >
                  View Results
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
