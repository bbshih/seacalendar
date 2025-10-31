import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

interface PollOption {
  id: string;
  label: string;
  description?: string;
  date?: string;
  timeStart?: string;
  timeEnd?: string;
  order: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  votingDeadline?: string;
  options: PollOption[];
  creator: {
    username: string;
  };
}

export default function VotingPageDb() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Voting state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [maybeOptions, setMaybeOptions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: { pathname: `/vote/${pollId}` } } });
    }
  }, [authLoading, user, navigate, pollId]);

  // Load poll data
  useEffect(() => {
    if (!pollId) {
      setLoadError('Invalid voting link - missing poll ID');
      setIsLoading(false);
      return;
    }

    if (user) {
      loadPoll();
    }
  }, [pollId, user]);

  const loadPoll = async () => {
    if (!pollId) return;

    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetch(`/api/polls/${pollId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load poll');
      }

      setPoll(data.data.poll);
    } catch (error) {
      console.error('Failed to load poll:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load poll'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!user) {
      setSubmitError('Please log in to vote');
      return;
    }

    if (selectedOptions.length === 0 && maybeOptions.length === 0) {
      setSubmitError('Please select at least one option');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          availableOptionIds: selectedOptions,
          maybeOptionIds: maybeOptions,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit vote');
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit vote'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOption = (optionId: string, type: 'available' | 'maybe') => {
    if (type === 'available') {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
      // Remove from maybe if adding to available
      setMaybeOptions(prev => prev.filter(id => id !== optionId));
    } else {
      setMaybeOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
      // Remove from available if adding to maybe
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="animate-wave text-4xl mb-4">🌊</div>
          <p className="text-gray-600">Loading poll...</p>
        </Card>
      </div>
    );
  }

  if (loadError || !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Poll</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </Card>
      </div>
    );
  }

  if (poll.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Poll Cancelled</h2>
          <p className="text-gray-600 mb-4">This poll has been cancelled by the organizer.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </Card>
      </div>
    );
  }

  const sortedOptions = [...poll.options].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-float">🗳️</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-ocean-600 mb-2">{poll.title}</h1>
              {poll.description && (
                <p className="text-gray-600 mb-2">{poll.description}</p>
              )}
              <p className="text-sm text-gray-500">
                Created by {poll.creator.username}
              </p>
              {poll.votingDeadline && (
                <p className="text-sm text-coral-500 mt-1">
                  Voting ends: {new Date(poll.votingDeadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Options */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Options</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click once for "Available" (green), twice for "Maybe" (yellow), three times to deselect
          </p>
          <div className="space-y-3">
            {sortedOptions.map((option) => {
              const isAvailable = selectedOptions.includes(option.id);
              const isMaybe = maybeOptions.includes(option.id);

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (!isAvailable && !isMaybe) {
                      toggleOption(option.id, 'available');
                    } else if (isAvailable) {
                      toggleOption(option.id, 'maybe');
                    } else {
                      setMaybeOptions(prev => prev.filter(id => id !== option.id));
                    }
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isAvailable
                      ? 'border-seaweed-500 bg-seaweed-50'
                      : isMaybe
                      ? 'border-coral-400 bg-coral-50'
                      : 'border-gray-200 hover:border-ocean-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      )}
                      {option.date && (
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(option.date).toLocaleDateString()}
                          {option.timeStart && ` at ${option.timeStart}`}
                          {option.timeEnd && ` - ${option.timeEnd}`}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl">
                      {isAvailable ? '✅' : isMaybe ? '⚠️' : '⬜'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional comments..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
          />
        </Card>

        {/* Submit */}
        {submitError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {submitError}
          </div>
        )}

        <Button
          onClick={handleSubmitVote}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </Button>

        {/* Success Modal */}
        {showSuccessModal && (
          <Modal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              navigate(`/results/${pollId}`);
            }}
            title="Vote Submitted!"
          >
            <div className="text-center">
              <div className="text-6xl mb-4 animate-wave">🎉</div>
              <p className="text-gray-700 mb-6">
                Your vote has been recorded successfully!
              </p>
              <Button onClick={() => navigate(`/results/${pollId}`)}>
                View Results
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
