import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Input from '../shared/Input';
import Button from '../shared/Button';
import type { Event, VenueDetails } from '../../types';
import {
  fetchEventFromGist,
  updateEventGist,
  getGitHubToken,
} from '../../utils/githubStorage';

export default function VenueSelectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL params
  const gistId = searchParams.get('gist');
  const encryptionKey = searchParams.get('key');
  const organizerKey = searchParams.get('org');
  const selectedDateId = searchParams.get('dateId');

  // Event data
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Password for password-protected events
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Venue form data
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueTime, setVenueTime] = useState('7:00 PM');
  const [venueWebsiteUrl, setVenueWebsiteUrl] = useState('');
  const [venueMenuUrl, setVenueMenuUrl] = useState('');
  const [venueNotes, setVenueNotes] = useState('');

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Finalization state
  const [isSaving, setIsSaving] = useState(false);

  // Venue requirements checklist state
  const [showRequirements, setShowRequirements] = useState(false);

  // Load event from Gist
  useEffect(() => {
    if (!gistId) {
      setLoadError('Invalid venue link - missing event ID');
      setIsLoading(false);
      return;
    }

    if (!organizerKey) {
      setLoadError('You need the organizer link to select a venue');
      setIsLoading(false);
      return;
    }

    if (!selectedDateId) {
      setLoadError('No date selected - please select a date from results page');
      setIsLoading(false);
      return;
    }

    loadEvent();
  }, [gistId, organizerKey, selectedDateId]);

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!venueName.trim()) {
      errors.venueName = 'Venue name is required';
    }

    if (!venueAddress.trim()) {
      errors.venueAddress = 'Address is required';
    }

    if (!venueTime.trim()) {
      errors.venueTime = 'Time is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinalizeEvent = async () => {
    if (!event || !selectedDateId) return;

    if (!validateForm()) {
      return;
    }

    const token = getGitHubToken();
    if (!token) {
      alert('GitHub token not found. Please set up your GitHub token first.');
      return;
    }

    setIsSaving(true);

    try {
      // Get attendees for selected date
      const attendees = event.votes
        .filter((vote) => vote.selectedDates.includes(selectedDateId))
        .map((vote) => vote.voterName);

      // Create venue details
      const venue: VenueDetails = {
        name: venueName.trim(),
        address: venueAddress.trim(),
        time: venueTime.trim(),
        websiteUrl: venueWebsiteUrl.trim() || undefined,
        menuUrl: venueMenuUrl.trim() || undefined,
        notes: venueNotes.trim() || undefined,
      };

      // Update event with finalized data
      const updatedEvent: Event = {
        ...event,
        finalizedEvent: {
          selectedDateId,
          venue,
          attendees,
        },
      };

      // Save to Gist
      await updateEventGist(
        gistId!,
        updatedEvent,
        encryptionKey || '',
        { token },
        password || undefined
      );

      // Navigate to event summary page
      const params = new URLSearchParams();
      params.set('gist', gistId!);
      if (encryptionKey) {
        params.set('key', encryptionKey);
      }
      navigate(`/event?${params.toString()}`);
    } catch (error) {
      console.error('Failed to finalize event:', error);
      alert(error instanceof Error ? error.message : 'Failed to finalize event');
    } finally {
      setIsSaving(false);
    }
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
                This event requires a password to select a venue
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
                Cannot Load Event
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

  // Get selected date info
  const selectedDate = event.dateOptions.find((d) => d.id === selectedDateId);
  if (!selectedDate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-coral-400">
            <div className="text-center py-8">
              <p className="text-2xl mb-4">⚠️</p>
              <h2 className="text-xl font-bold text-coral-600 mb-2">
                Date Not Found
              </h2>
              <p className="text-gray-700 mb-4">
                The selected date could not be found in this event.
              </p>
              <Button onClick={() => navigate(-1)} variant="outline">
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Get attendees for selected date
  const attendees = event.votes
    .filter((vote) => vote.selectedDates.includes(selectedDateId!))
    .map((vote) => vote.voterName);

  // Main venue selection UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-ocean-600 mb-2">
            ⚓ Chart Your Course
          </h1>
          <p className="text-lg text-ocean-500">Select venue for your event</p>
        </div>

        {/* Selected Date Summary */}
        <Card className="mb-6 bg-seaweed-50 border-seaweed-400">
          <h2 className="text-2xl font-bold text-seaweed-700 mb-4">
            📅 Planning for {selectedDate.label}
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Event:</span> {event.title}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Attendees ({attendees.length}):</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {attendees.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-seaweed-100 text-seaweed-800"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Venue Requirements Helper */}
        <Card className="mb-6">
          <button
            onClick={() => setShowRequirements(!showRequirements)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-xl font-bold text-ocean-700">
              📋 Venue Requirements Checklist
            </h3>
            <span className="text-2xl text-ocean-400">
              {showRequirements ? '▼' : '▶'}
            </span>
          </button>

          {showRequirements && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-700 space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-ocean-500" />
                  <span>Seats {attendees.length} people comfortably</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-ocean-500" />
                  <span>Vegan options available</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-ocean-500" />
                  <span>Allergen-free options (no dairy/fruit)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-ocean-500" />
                  <span>Casual-upscale atmosphere</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-ocean-500" />
                  <span>Available on selected date</span>
                </label>
              </div>

              <div className="pt-3 border-t border-ocean-200">
                <a
                  href="https://www.opentable.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-medium"
                >
                  <span>🔍</span>
                  <span>Search on OpenTable</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          )}
        </Card>

        {/* Venue Details Form */}
        <Card>
          <h2 className="text-2xl font-bold text-ocean-700 mb-6">
            🏝️ Venue Details
          </h2>

          <div className="space-y-4">
            <Input
              label="Venue Name *"
              type="text"
              placeholder="The Ocean's Table"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              error={formErrors.venueName}
              fullWidth
            />

            <Input
              label="Address *"
              type="text"
              placeholder="123 Seaside Ave, Beach City, CA 90210"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              error={formErrors.venueAddress}
              fullWidth
            />

            <Input
              label="Time *"
              type="text"
              placeholder="7:00 PM"
              value={venueTime}
              onChange={(e) => setVenueTime(e.target.value)}
              error={formErrors.venueTime}
              fullWidth
              helperText="e.g., 7:00 PM or 19:00"
            />

            <Input
              label="Website URL (optional)"
              type="url"
              placeholder="https://example.com"
              value={venueWebsiteUrl}
              onChange={(e) => setVenueWebsiteUrl(e.target.value)}
              fullWidth
            />

            <Input
              label="Menu URL (optional)"
              type="url"
              placeholder="https://example.com/menu"
              value={venueMenuUrl}
              onChange={(e) => setVenueMenuUrl(e.target.value)}
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                placeholder="Any special instructions, dress code, parking info, etc."
                value={venueNotes}
                onChange={(e) => setVenueNotes(e.target.value)}
                className="w-full px-4 py-2 border-2 border-ocean-200 rounded-lg focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-200 transition-colors"
                rows={4}
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={handleFinalizeEvent}
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : '🎉 Finalize Event'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
