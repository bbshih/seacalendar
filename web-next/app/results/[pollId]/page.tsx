'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconChartBar, IconTrophy, IconCheck, IconAlertTriangle, IconLockOpen, IconBoxMultiple, IconHome, IconChecklist } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePoll } from '@/hooks/usePoll';
import { api } from '@/utils/api';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';

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

interface ResultsPageProps {
  params: Promise<{
    pollId: string;
  }>;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { pollId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { poll, loading: pollLoading, error: pollError } = usePoll(pollId);

  const [results, setResults] = useState<VoteResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  useEffect(() => {
    if (pollId) {
      loadResults();
    }
  }, [pollId]);

  const loadResults = async () => {
    if (!pollId) return;

    setResultsLoading(true);
    setResultsError('');

    try {
      const data = await api.get<{ success: boolean; data: { results: VoteResults } }>(`/polls/${pollId}/results`);
      setResults(data.data.results);
    } catch (error) {
      console.error('Failed to load results:', error);
      setResultsError(
        error instanceof Error ? error.message : 'Failed to load results'
      );
    } finally {
      setResultsLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!pollId) return;

    setIsReopening(true);

    try {
      await api.post(`/polls/${pollId}/reopen`, { days: 7 }, true);
      // Reload results
      await loadResults();
      window.location.reload(); // Force refresh to show updated poll status
    } catch (error) {
      console.error('Failed to reopen poll:', error);
      alert(error instanceof Error ? error.message : 'Failed to reopen poll');
    } finally {
      setIsReopening(false);
    }
  };

  const isLoading = pollLoading || resultsLoading;
  const loadError = pollError || resultsError;

  if (isLoading) {
    return <LoadingState message="Loading results..." />;
  }

  if (loadError || !poll || !results) {
    return (
      <ErrorState
        error={loadError || 'Results not found'}
        onGoHome={() => router.push('/')}
      />
    );
  }

  // Sort results by available count (descending)
  const sortedResults = [...results.optionResults].sort((a, b) =>
    b.availableCount - a.availableCount || b.maybeCount - a.maybeCount
  );

  const topOption = sortedResults[0];
  const isCreator = user && poll.creatorId === user.id;
  const canReopen = isCreator && (poll.status === 'FINALIZED' || poll.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 to-ocean-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-start gap-4">
            <IconChartBar size={48} className="text-ocean-600 flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-ocean-600 mb-2">{poll.title}</h1>
              {poll.description && (
                <p className="text-gray-600 mb-2">{poll.description}</p>
              )}
              <p className="text-sm text-gray-500">
                Created by {poll.creatorName}
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
                    <IconCheck size={16} className="inline mr-1" /> Finalized
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
              <IconTrophy size={32} className="text-seaweed-700" />
              <h2 className="text-xl font-bold text-seaweed-700">Top Choice</h2>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-semibold text-lg text-gray-800 mb-1">
                {topOption.label}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-seaweed-600 font-medium">
                  <IconCheck size={16} className="inline mr-1" /> {topOption.availableCount} available ({topOption.availablePercentage.toFixed(0)}%)
                </span>
                {topOption.maybeCount > 0 && (
                  <span className="text-coral-500">
                    <IconAlertTriangle size={16} className="inline mr-1" /> {topOption.maybeCount} maybe
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
              <IconBoxMultiple size={48} className="mx-auto mb-3 text-gray-400" />
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
                        {result.availableCount} <IconCheck size={16} className="inline" />
                      </div>
                      {result.maybeCount > 0 && (
                        <div className="text-sm text-coral-500">
                          {result.maybeCount} <IconAlertTriangle size={16} className="inline" />
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
              onClick={() => router.push(`/vote/${pollId}`)}
              variant="primary"
              className="flex-1"
            >
              <IconChecklist size={18} className="inline mr-1" /> Vote Now
            </Button>
          )}
          {canReopen && (
            <Button
              onClick={handleReopen}
              disabled={isReopening}
              variant="primary"
              className="flex-1"
            >
              <IconLockOpen size={18} className="inline mr-1" /> {isReopening ? 'Reopening...' : 'Reopen Voting'}
            </Button>
          )}
          <Button
            onClick={() => router.push('/')}
            variant="outline"
          >
            <IconHome size={18} className="inline mr-1" /> Home
          </Button>
        </div>
      </div>
    </div>
  );
}
