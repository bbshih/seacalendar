import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../shared/Card';
import Button from '../shared/Button';
import CopyButton from '../shared/CopyButton';

interface Poll {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  votingDeadline?: string;
  createdAt: string;
  options: any[];
}

export default function MyEventsPageDb() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/polls/user/created', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load polls');
      }

      setPolls(data.data.polls);
    } catch (error) {
      console.error('Failed to load polls:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load polls'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VOTING':
        return <span className="px-2 py-1 bg-seaweed-100 text-seaweed-700 rounded text-xs font-medium">🟢 Voting Open</span>;
      case 'FINALIZED':
        return <span className="px-2 py-1 bg-ocean-100 text-ocean-700 rounded text-xs font-medium">✅ Finalized</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">❌ Cancelled</span>;
      case 'EXPIRED':
        return <span className="px-2 py-1 bg-coral-100 text-coral-700 rounded text-xs font-medium">⏰ Expired</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="animate-wave text-4xl mb-4">🌊</div>
          <p className="text-gray-600">Loading your events...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-ocean-50 to-ocean-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-down">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-ocean-600 via-coral-500 to-ocean-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_100%]"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              📋 My Events
            </h1>
            <p className="text-lg text-ocean-700 font-semibold">
              Welcome back, {user?.username}!
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        {loadError && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <p className="text-red-700">{loadError}</p>
          </Card>
        )}

        {polls.length === 0 ? (
          <Card hover3d={false} className="text-center py-12 animate-fade-in">
            <div className="text-6xl mb-4">🌊</div>
            <h2 className="text-2xl font-bold text-ocean-600 mb-2">
              No Events Yet
            </h2>
            <p className="text-ocean-500 mb-6">
              Create your first event in Discord using the <code className="bg-gray-200 px-2 py-1 rounded">/event</code> command!
            </p>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => window.open('https://discord.com', '_blank')}
            >
              🎮 Open Discord
            </Button>
          </Card>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {polls.map((poll, index) => {
              const votingUrl = `${window.location.origin}/vote/${poll.id}`;
              const resultsUrl = `${window.location.origin}/results/${poll.id}`;

              return (
                <Card
                  key={poll.id}
                  hover3d={false}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="space-y-4">
                    {/* Event Title and Status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-ocean-700 mb-1">
                          {poll.title}
                        </h3>
                        {poll.description && (
                          <p className="text-sm text-gray-600 mb-2">{poll.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>Created {formatDate(poll.createdAt)}</span>
                          <span>•</span>
                          <span>{poll.options.length} options</span>
                        </div>
                      </div>
                      {getStatusBadge(poll.status)}
                    </div>

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
                          className="flex-1 px-4 py-2 border-2 border-ocean-200 rounded-lg bg-ocean-50 text-sm font-mono"
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
                          className="flex-1 px-4 py-2 border-2 border-coral-200 rounded-lg bg-sand-100 text-sm font-mono"
                        />
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => navigate(`/results/${poll.id}`)}
                        >
                          View Results
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
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
