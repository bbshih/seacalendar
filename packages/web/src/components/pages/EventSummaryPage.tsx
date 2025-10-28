import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Button from '../shared/Button';
import CopyButton from '../shared/CopyButton';
import type { Event } from '../../types';
import { fetchEventFromGist } from '../../utils/githubStorage';
import { downloadIcsFile } from '../../utils/icsGenerator';

export default function EventSummaryPage() {
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

  // Load event from Gist
  useEffect(() => {
    if (!gistId) {
      setLoadError('Invalid event link - missing event ID');
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
      const eventData = await fetchEventFromGist(
        gistId!,
        '',
        undefined,
        password,
        gistId ?? undefined
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

  const handleDownloadIcs = () => {
    if (!event) return;

    try {
      downloadIcsFile(event);
    } catch (error) {
      console.error('Failed to generate .ics file:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate calendar file');
    }
  };

  const generateEmailBody = (): string => {
    if (!event || !event.finalizedEvent) return '';

    const { venue, attendees, selectedDateId } = event.finalizedEvent;
    const selectedDate = event.dateOptions.find((d) => d.id === selectedDateId);

    if (!selectedDate) return '';

    const eventUrl = window.location.href;

    let emailBody = `Hey everyone!\n\n`;
    emailBody += `Our next hangout is confirmed:\n\n`;
    emailBody += `📅 ${selectedDate.label} at ${venue.time}\n`;
    emailBody += `📍 ${venue.name}\n`;
    emailBody += `${venue.address}\n\n`;

    if (venue.menuUrl) {
      emailBody += `Menu: ${venue.menuUrl}\n\n`;
    }

    if (venue.websiteUrl) {
      emailBody += `Website: ${venue.websiteUrl}\n\n`;
    }

    if (venue.notes) {
      emailBody += `Notes: ${venue.notes}\n\n`;
    }

    emailBody += `Please add this to your calendar - download the .ics file from the event page.\n`;
    emailBody += `Event details: ${eventUrl}\n\n`;
    emailBody += `Attendees: ${attendees.join(', ')}\n\n`;
    emailBody += `See you there!\n`;

    return emailBody;
  };

  const generateMailtoLink = (): string => {
    if (!event || !event.finalizedEvent) return '';

    const { venue, selectedDateId } = event.finalizedEvent;
    const selectedDate = event.dateOptions.find((d) => d.id === selectedDateId);

    if (!selectedDate) return '';

    const subject = encodeURIComponent(`${event.title} - ${selectedDate.label} at ${venue.name}`);
    const body = encodeURIComponent(generateEmailBody());

    return `mailto:?subject=${subject}&body=${body}`;
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
                This event requires a password to view details
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-ocean-200 rounded-lg focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-200"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}

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

  // Not finalized yet
  if (!event.finalizedEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-coral-400">
            <div className="text-center py-8">
              <p className="text-2xl mb-4">📋</p>
              <h2 className="text-xl font-bold text-ocean-600 mb-2">
                Event Not Finalized Yet
              </h2>
              <p className="text-gray-700 mb-4">
                This event hasn't been finalized with venue details yet.
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

  const { venue, attendees, selectedDateId } = event.finalizedEvent;
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
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const eventUrl = window.location.href;
  const mailtoLink = generateMailtoLink();

  // Main event summary UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50 to-ocean-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-ocean-600 mb-2">
            🎉 Your Crew is Ready to Set Sail!
          </h1>
          <p className="text-lg text-ocean-500">Event finalized - time to celebrate!</p>
        </div>

        {/* Event Details Card */}
        <Card className="mb-6 bg-gradient-to-br from-white to-ocean-50">
          <div className="space-y-6">
            {/* Event Title */}
            <div className="text-center pb-4 border-b border-ocean-200">
              <h2 className="text-3xl font-bold text-ocean-700 mb-2">
                {event.title}
              </h2>
              <p className="text-gray-600">Organized by {event.organizer}</p>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-4">
              <span className="text-3xl">📅</span>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  When
                </h3>
                <p className="text-xl text-ocean-700 font-semibold">
                  {selectedDate.label} at {venue.time}
                </p>
              </div>
            </div>

            {/* Venue */}
            <div className="flex items-start gap-4">
              <span className="text-3xl">📍</span>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Where
                </h3>
                <p className="text-xl text-ocean-700 font-semibold">
                  {venue.name}
                </p>
                <p className="text-gray-600 mt-1">{venue.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-ocean-600 hover:text-ocean-700 font-medium mt-2 text-sm"
                >
                  <span>View on Google Maps</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Website & Menu */}
            {(venue.websiteUrl || venue.menuUrl) && (
              <div className="flex items-start gap-4">
                <span className="text-3xl">🌐</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Links
                  </h3>
                  <div className="space-y-1">
                    {venue.websiteUrl && (
                      <a
                        href={venue.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-ocean-600 hover:text-ocean-700 font-medium"
                      >
                        Restaurant Website ↗
                      </a>
                    )}
                    {venue.menuUrl && (
                      <a
                        href={venue.menuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-ocean-600 hover:text-ocean-700 font-medium"
                      >
                        View Menu ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attendees */}
            <div className="flex items-start gap-4">
              <span className="text-3xl">👥</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Attendees ({attendees.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-ocean-100 text-ocean-800"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            {venue.notes && (
              <div className="flex items-start gap-4">
                <span className="text-3xl">📝</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Notes
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {venue.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Calendar Actions */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-ocean-700 mb-4">
            📲 Add to Calendar
          </h2>
          <p className="text-gray-600 mb-4">
            Download the calendar file to add this event to Google Calendar, Apple Calendar, Outlook, and more.
          </p>
          <Button
            onClick={handleDownloadIcs}
            variant="primary"
            size="lg"
            fullWidth
          >
            💾 Download Calendar File (.ics)
          </Button>
        </Card>

        {/* Share Options */}
        <Card>
          <h2 className="text-2xl font-bold text-ocean-700 mb-4">
            🔗 Share Event
          </h2>

          <div className="space-y-4">
            {/* Copy Event Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm font-mono"
                />
                <CopyButton textToCopy={eventUrl} variant="secondary" size="md" />
              </div>
            </div>

            {/* Email Share */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share via Email
              </label>
              <a href={mailtoLink}>
                <Button variant="outline" size="md" fullWidth>
                  📧 Open Email Template
                </Button>
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Opens your default email client with a pre-filled message
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            Create Another Event
          </Button>
        </div>
      </div>
    </div>
  );
}
