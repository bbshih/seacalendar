import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import Button from '../shared/Button';

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

interface OptionResult {
  optionId: string;
  label: string;
  availableCount: number;
  maybeCount: number;
  availablePercentage: number;
  maybePercentage: number;
}

interface VoteResults {
  totalVoters: number;
  optionResults: OptionResult[];
}

export default function ResultsPageDb() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!pollId) {
      setLoadError('Invalid poll ID');
      setIsLoading(false);
      return;
    }

    loadPollAndResults();
  }, [pollId]);

  const loadPollAndResults = async () => {
    if (!pollId) return;

    setIsLoading(true);
    setLoadError('');

    try {
      // Load poll data
      const pollResponse = await fetch(`/api/polls/${pollId}`);
      const pollData = await pollResponse.json();

      if (!pollData.success) {
        throw new Error(pollData.message || 'Failed to load poll');
      }

      setPoll(pollData.data.poll);

      // Load results
      const resultsResponse = await fetch(`/api/polls/${pollId}/results`);
      const resultsData = await resultsResponse.json();

      if (!resultsData.success) {
        throw new Error(resultsData.message || 'Failed to load results');
      }

      setResults(resultsData.data.results);
    } catch (error) {
      console.error('Failed to load poll:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load poll'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="animate-wave text-4xl mb-4">🌊</div>
          <p className="text-gray-600">Loading results...</p>
        </Card>
      </div>
    );
  }

  if (loadError || !poll || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </Card>
      </div>
    );
  }

  // Sort results by available count (descending)
  const sortedResults = [...results.optionResults].sort((a, b) =>
    b.availableCount - a.availableCount || b.maybeCount - a.maybeCount
  );

  const topOption = sortedResults[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-float">📊</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-ocean-600 mb-2">{poll.title}</h1>
              {poll.description && (
                <p className="text-gray-600 mb-2">{poll.description}</p>
              )}
              <p className="text-sm text-gray-500">
                Created by {poll.creator.username}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="text-seaweed-600 font-medium">
                  {results.totalVoters} {results.totalVoters === 1 ? 'vote' : 'votes'}
                </span>
                {poll.status === 'VOTING' && (
                  <span className="text-coral-500">
                    Voting open
                  </span>
                )}
                {poll.status === 'FINALIZED' && (
                  <span className="text-ocean-600">
                    ✅ Finalized
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Winner card (if votes exist) */}
        {results.totalVoters > 0 && topOption && (
          <Card className="mb-6 bg-gradient-to-br from-seaweed-50 to-ocean-50 border-2 border-seaweed-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🏆</div>
              <h2 className="text-xl font-bold text-seaweed-700">Top Choice</h2>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-semibold text-lg text-gray-800 mb-1">
                {topOption.label}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-seaweed-600 font-medium">
                  ✅ {topOption.availableCount} available ({topOption.availablePercentage.toFixed(0)}%)
                </span>
                {topOption.maybeCount > 0 && (
                  <span className="text-coral-500">
                    ⚠️ {topOption.maybeCount} maybe
                  </span>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* All results */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">All Options</h2>

          {results.totalVoters === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-3">🗳️</div>
              <p>No votes yet. Be the first to vote!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedResults.map((result) => (
                <div
                  key={result.optionId}
                  className="border-2 border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{result.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-seaweed-600">
                        {result.availableCount} ✅
                      </div>
                      {result.maybeCount > 0 && (
                        <div className="text-sm text-coral-500">
                          {result.maybeCount} ⚠️
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-seaweed-500 h-full transition-all duration-300"
                          style={{ width: `${result.availablePercentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">
                        {result.availablePercentage.toFixed(0)}%
                      </span>
                    </div>
                    {result.maybeCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-coral-400 h-full transition-all duration-300"
                            style={{ width: `${result.maybePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {result.maybePercentage.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          {poll.status === 'VOTING' && (
            <Button
              onClick={() => navigate(`/vote/${pollId}`)}
              variant="primary"
              className="flex-1"
            >
              🗳️ Vote Now
            </Button>
          )}
          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            ← Home
          </Button>
        </div>
      </div>
    </div>
  );
}
