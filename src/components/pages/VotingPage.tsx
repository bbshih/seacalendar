import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import CopyButton from '../shared/CopyButton';
import DateCalendarView from '../features/DateCalendarView';
import AnimatedBackground from '../shared/AnimatedBackground';
import type { Event, Vote } from '../../types';
import {
  fetchEventFromGist,
} from '../../utils/githubStorage';
import { hasVoterVoted } from '../../utils/voteHelpers';
import { encryptData, deriveKeyFromPassword } from '../../utils/encryption';

export default function VotingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL params
  const gistId = searchParams.get('gist');
  const encryptionKey = searchParams.get('key');

  // Event data
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Password for password-protected events
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Voting state
  const [voterName, setVoterName] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Post-submit state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [voteUrl, setVoteUrl] = useState('');

  // Load event from Gist
  useEffect(() => {
    if (!gistId) {
      setLoadError('Invalid voting link - missing event ID');
      setIsLoading(false);
      return;
    }

    loadEvent();
  }, [gistId]);

  const loadEvent = async () => {
    if (!gistId) return;

    setIsLoading(true);
    setLoadError('');

    try {
      // Check if we have an encryption key in the URL
      if (encryptionKey) {
        // Normal flow with key in URL
        const eventData = await fetchEventFromGist(gistId, encryptionKey);
        setEvent(eventData);
      } else {
        // Password-protected event - need password
        setNeedsPassword(true);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load event'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter the event password');
      return;
    }

    setIsLoading(true);
    setPasswordError('');

    try {
      // For password-protected events, we need to try decrypting
      // We don't know the eventId yet, so we'll use the gistId as a placeholder
      // The actual eventId will be in the decrypted data
      const eventData = await fetchEventFromGist(
        gistId!,
        '', // Empty key - will be derived from password
        undefined,
        password,
        gistId ?? undefined // Use gistId as salt temporarily - this is a limitation
      );
      setEvent(eventData);
      setNeedsPassword(false);
    } catch (error) {
      console.error('Failed to decrypt event:', error);
      setPasswordError('Wrong password or corrupted data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDate = (dateId: string) => {
    if (selectedDates.includes(dateId)) {
      setSelectedDates(selectedDates.filter((id) => id !== dateId));
    } else {
      setSelectedDates([...selectedDates, dateId]);
    }
  };

  const handleSubmitVote = async () => {
    if (!event || !gistId) return;

    if (!voterName.trim()) {
      setSubmitError('Please enter your name');
      return;
    }

    if (selectedDates.length === 0) {
      setSubmitError('Please select at least one date');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Check if voter already voted
      const existingVote = hasVoterVoted(event, voterName.trim());

      if (existingVote) {
        const confirmReplace = confirm(
          `Someone already voted as "${voterName.trim()}". Replace their vote?`
        );
        if (!confirmReplace) {
          setIsSubmitting(false);
          return;
        }
      }

      // Create new vote
      const newVote: Vote = {
        voterName: voterName.trim(),
        selectedDates: selectedDates,
        timestamp: new Date().toISOString(),
      };

      // Update event with new vote
      const updatedEvent: Event = {
        ...event,
        votes: existingVote
          ? event.votes.map((v) =>
              v.voterName.toLowerCase() === voterName.trim().toLowerCase()
                ? newVote
                : v
            )
          : [...event.votes, newVote],
      };

      // Save vote via serverless API
      // This allows voting without a GitHub token
      const actualKey = needsPassword && password
        ? await deriveKeyFromPassword(password, event.id)
        : encryptionKey || '';

      const encrypted = await encryptData(
        JSON.stringify(updatedEvent),
        actualKey
      );

      // Submit to serverless API
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:5173/api/submit-vote'
        : '/api/submit-vote';

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gistId,
          encryptedData: encrypted,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      // Success! Update local state and show success modal
      setEvent(updatedEvent);
      setShowSuccessModal(true);

      // Generate URL with updated event (for bookmarking)
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const updatedUrl = encryptionKey
        ? `${baseUrl}#/vote?gist=${gistId}&key=${encodeURIComponent(encryptionKey)}`
        : `${baseUrl}#/vote?gist=${gistId}`;
      setVoteUrl(updatedUrl);
    } catch (error) {
      console.error('Failed to submit vote:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit vote'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteAgain = () => {
    setShowSuccessModal(false);
    setVoterName('');
    setSelectedDates([]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8 flex items-center justify-center">
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto mb-4"></div>
            <p className="text-ocean-700">Loading event...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Password prompt
  if (needsPassword && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
        <div className="max-w-md mx-auto mt-12">
          <Card>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-ocean-600 mb-2">
                🔒 Password Protected Event
              </h1>
              <p className="text-ocean-700">
                This event requires a password to view
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Event Password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                fullWidth
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />

              <Button
                onClick={handlePasswordSubmit}
                variant="primary"
                size="lg"
                fullWidth
              >
                Unlock Event
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-coral-400">
            <div className="text-center py-8">
              <p className="text-2xl mb-4">⚠️</p>
              <h2 className="text-xl font-bold text-coral-600 mb-2">
                Failed to Load Event
              </h2>
              <p className="text-gray-700 mb-4">
                {loadError || 'Something went wrong'}
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main voting UI
  return (
    <AnimatedBackground variant="minimal">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-ocean-600 via-coral-500 to-ocean-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              🌊 {event.title}
            </h1>
            <p className="text-lg text-ocean-700 font-semibold animate-slide-up">Organized by {event.organizer}</p>
            <p className="text-ocean-600 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Select all dates you're available 📅
            </p>
          </div>

          <Card>
          <div className="space-y-6">
            {/* Voter Name */}
            <Input
              label="Your Name"
              placeholder="Enter your name"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              error={submitError && !voterName.trim() ? submitError : ''}
              fullWidth
            />

            {/* Date Selection */}
            <div>
              <label className="block text-lg font-semibold text-ocean-700 mb-4">
                Select Your Available Dates
              </label>
              <DateCalendarView
                dateOptions={event.dateOptions}
                selectedDates={selectedDates}
                onToggleDate={handleToggleDate}
              />
            </div>

            {/* Error message */}
            {submitError && (
              <div className="p-4 bg-coral-50 border-2 border-coral-400 rounded-lg text-coral-700">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmitVote}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting || !voterName.trim() || selectedDates.length === 0}
            >
              {isSubmitting ? '⚓ Submitting...' : '⚓ Submit Vote'}
            </Button>
          </div>
        </Card>

        {/* Success Modal */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="🎉 Vote Submitted!"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-seaweed-50 border-2 border-seaweed-200 rounded-lg p-4">
              <p className="text-seaweed-800 font-medium">
                Thanks for voting, {voterName}!
              </p>
              <p className="text-sm text-seaweed-700 mt-1">
                Your vote has been recorded.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bookmark this link to change your vote later:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voteUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm font-mono"
                />
                <CopyButton textToCopy={voteUrl} variant="secondary" size="md" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleVoteAgain}
                variant="outline"
                size="md"
                fullWidth
              >
                Vote as Someone Else
              </Button>
              <Button
                onClick={() => setShowSuccessModal(false)}
                variant="primary"
                size="md"
                fullWidth
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
    </AnimatedBackground>
  );
}
