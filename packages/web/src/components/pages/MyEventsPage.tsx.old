import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Button from '../shared/Button';
import CopyButton from '../shared/CopyButton';
import { getMyEvents, removeMyEvent, type SavedEvent } from '../../utils/myEvents';

export default function MyEventsPage() {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    const myEvents = getMyEvents();
    setEvents(myEvents);
  };

  const handleRemove = (gistId: string) => {
    if (confirm('Remove this event from your list? (The event data will still exist on GitHub)')) {
      removeMyEvent(gistId);
      loadEvents();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-ocean-50 to-ocean-100">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-ocean-600 via-coral-500 to-ocean-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              📋 My Events
            </h1>
            <p className="text-lg text-ocean-700 font-semibold animate-slide-up">
              All your created events in one place
            </p>
          </div>

          {events.length === 0 ? (
            <Card hover3d={false} className="text-center py-12 animate-fade-in">
              <div className="text-6xl mb-4">🌊</div>
              <h2 className="text-2xl font-bold text-ocean-600 mb-2">
                No Events Yet
              </h2>
              <p className="text-ocean-500 mb-6">
                Create your first event to see it here!
              </p>
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate('/create')}
              >
                ⚓ Create Event
              </Button>
            </Card>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {events.map((event, index) => (
                <Card
                  key={event.gistId}
                  hover3d={false}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="space-y-4">
                    {/* Event Title and Date */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-ocean-700 mb-1">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Created {formatDate(event.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(event.gistId)}
                        className="text-coral-500 border-coral-400 hover:bg-coral-50"
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Voting Link */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🗳️ Voting Link (Share with friends)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={event.votingUrl}
                          readOnly
                          className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm font-mono"
                        />
                        <CopyButton
                          textToCopy={event.votingUrl}
                          variant="secondary"
                          size="md"
                        />
                      </div>
                    </div>

                    {/* Results Link */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📊 Results Link (Organizer only)
                      </label>
                      <div className="flex gap-2">
                        <a
                          href={event.resultsUrl}
                          className="flex-1 px-4 py-2 border-2 border-coral-200 rounded-lg bg-sand-100 text-sm font-mono hover:bg-sand-200 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.resultsUrl}
                        </a>
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => window.open(event.resultsUrl, '_blank')}
                        >
                          View Results
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
  );
}
