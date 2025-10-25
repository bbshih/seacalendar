import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Input from '../shared/Input';
import Button from '../shared/Button';
import CopyButton from '../shared/CopyButton';
import AnimatedBackground from '../shared/AnimatedBackground';
import type { Event } from '../../types';
import {
  fetchEventFromGist,
  deleteEventGist,
  getGitHubToken,
} from '../../utils/githubStorage';
import {
  calculateVoteTallies,
  getTotalVoters,
} from '../../utils/voteHelpers';

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL params
  const gistId = searchParams.get('gist');
  const encryptionKey = searchParams.get('key');
  const organizerKey = searchParams.get('org');

  // Event data
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Password for password-protected events
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete functionality
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load event from Gist
  useEffect(() => {
    if (!gistId) {
      setLoadError('Invalid results link - missing event ID');
      setIsLoading(false);
      return;
    }

    if (!organizerKey) {
      setLoadError('You need the organizer link to view results');
      setIsLoading(false);
      return;
    }

    loadEvent();
  }, [gistId, organizerKey]);

  const loadEvent = async () => {
    if (!gistId) return;

    setIsLoading(true);
    setLoadError('');

    try {
      // Check if we have an encryption key in the URL
      if (encryptionKey) {
        // Normal flow with key in URL
        const eventData = await fetchEventFromGist(gistId, encryptionKey);

        // Verify organizer key
        const expectedKey = btoa(eventData.id).substring(0, 8);
        if (organizerKey !== expectedKey) {
          setLoadError('Invalid organizer key - access denied');
          setIsLoading(false);
          return;
        }

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
      const eventData = await fetchEventFromGist(
        gistId!,
        '',
        undefined,
        password,
        gistId ?? undefined
      );

      // Verify organizer key
      const expectedKey = btoa(eventData.id).substring(0, 8);
      if (organizerKey !== expectedKey) {
        setPasswordError('Invalid organizer key - access denied');
        setIsLoading(false);
        return;
      }

      setEvent(eventData);
      setNeedsPassword(false);
    } catch (error) {
      console.error('Failed to decrypt event:', error);
      setPasswordError('Wrong password or corrupted data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!gistId) return;

    const token = getGitHubToken();
    if (!token) {
      alert('GitHub token not found. Cannot delete event.');
      return;
    }

    setIsDeleting(true);

    try {
      await deleteEventGist(gistId, { token });
      alert('Event deleted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to delete event'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8 flex items-center justify-center">
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto mb-4"></div>
            <p className="text-ocean-700">Loading results...</p>
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
                This event requires a password to view results
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
                Unlock Results
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
                Cannot View Results
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

  // Calculate vote tallies
  const tallies = calculateVoteTallies(event);
  const totalVoters = getTotalVoters(event);
  const maxVotes = tallies.length > 0 ? tallies[0].voteCount : 0;

  // Generate voting URL for sharing
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const votingUrl = encryptionKey
    ? `${baseUrl}#/vote?gist=${gistId}&key=${encodeURIComponent(encryptionKey)}`
    : `${baseUrl}#/vote?gist=${gistId}`;

  // Main results UI
  return (
    <AnimatedBackground variant="minimal">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-ocean-600 via-coral-500 to-ocean-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              🌊 {event.title} - Results
            </h1>
            <p className="text-lg text-ocean-700 font-semibold animate-slide-up">Organized by {event.organizer}</p>
            <p className="text-ocean-600 mt-2 font-bold animate-scale-in" style={{ animationDelay: '0.1s' }}>
              {totalVoters} {totalVoters === 1 ? 'person has' : 'people have'} voted 🎉
            </p>
          </div>

          {/* Voting Link Share */}
          <Card className="mb-6" hover3d={false}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Share Voting Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={votingUrl}
                readOnly
                className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm font-mono"
              />
              <CopyButton textToCopy={votingUrl} variant="secondary" size="md" />
            </div>
          </div>
        </Card>

        {/* Vote Results */}
        <Card hover3d={false}>
          <h2 className="text-2xl font-bold text-ocean-700 mb-6">
            📊 Vote Tallies
          </h2>

          {tallies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500 mb-2">No votes yet</p>
              <p className="text-gray-400">Share the voting link to collect votes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tallies.map((tally, index) => {
                const isTied = index > 0 && tally.voteCount === tallies[index - 1].voteCount;
                const isWinning = tally.voteCount === maxVotes;
                const percentage = maxVotes > 0 ? (tally.voteCount / maxVotes) * 100 : 0;

                return (
                  <div
                    key={tally.dateOption.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isWinning
                        ? 'bg-seaweed-50 border-seaweed-400'
                        : 'bg-white border-ocean-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Date Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-ocean-700">
                            {tally.dateOption.label}
                          </h3>
                          {isWinning && (
                            <span className="text-2xl" title="Most votes">
                              👑
                            </span>
                          )}
                          {isTied && (
                            <span className="text-sm bg-coral-100 text-coral-700 px-2 py-1 rounded">
                              Tied
                            </span>
                          )}
                        </div>

                        {/* Vote Count and Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {tally.voteCount} {tally.voteCount === 1 ? 'vote' : 'votes'}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({Math.round((tally.voteCount / totalVoters) * 100)}% of voters)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                isWinning ? 'bg-seaweed-500' : 'bg-ocean-400'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Attendees */}
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            Available:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {tally.voters.map((voter, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ocean-100 text-ocean-800"
                              >
                                {voter}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Select Date Button */}
                      <div className="md:ml-auto">
                        <Button
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set('gist', gistId!);
                            params.set('org', organizerKey!);
                            params.set('dateId', tally.dateOption.id);
                            if (encryptionKey) {
                              params.set('key', encryptionKey);
                            }
                            navigate(`/venue?${params.toString()}`);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          Select This Date
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ties Note */}
          {tallies.length > 1 && tallies[0].voteCount === tallies[1].voteCount && (
            <div className="mt-6 p-4 bg-coral-50 border-2 border-coral-200 rounded-lg">
              <p className="text-sm text-coral-800">
                💡 <strong>Tip:</strong> Multiple dates are tied! Consider who can attend when making your final decision.
              </p>
            </div>
          )}
        </Card>

        {/* Delete Event */}
        <Card className="mt-6 border-red-200">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🗑️ Delete Event Data
              </h3>
              <p className="text-sm text-gray-600">
                Permanently delete this event and all votes from GitHub. This cannot be undone.
              </p>
            </div>

            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
              >
                Delete Event
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-600">
                  Are you sure? This will permanently delete all event data.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDeleteEvent}
                    variant="outline"
                    size="sm"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
        </div>
      </div>
    </AnimatedBackground>
  );
}
