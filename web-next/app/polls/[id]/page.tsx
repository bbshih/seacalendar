/**
 * Voting Page - Simplified Example
 * Full implementation would include:
 * - Authentication check
 * - Real-time updates via WebSocket
 * - Full UI from packages/web/src/components/pages/VotingPageDb.tsx
 *
 * This demonstrates the Next.js pattern for client components
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Poll {
  id: string;
  title: string;
  description?: string;
  status: string;
  options: Array<{
    id: string;
    label: string;
    order: number;
  }>;
}

export default function PollVotingPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  async function fetchPoll() {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/polls/${pollId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Failed to fetch poll');
      }

      const data = await res.json();
      setPoll(data.data.poll);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitVote() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          availableOptionIds: selectedOptions,
          maybeOptionIds: [],
          notes: '',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit vote');
      }

      // Redirect to results
      router.push(`/polls/${pollId}/results`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit vote');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading poll...</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Poll not found'}</p>
          <button onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600 mb-4">{poll.description}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Your Availability</h2>
          <div className="space-y-3">
            {poll.options
              .sort((a, b) => a.order - b.order)
              .map((option) => (
                <div
                  key={option.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedOptions.includes(option.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedOptions((prev) =>
                      prev.includes(option.id)
                        ? prev.filter((id) => id !== option.id)
                        : [...prev, option.id]
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {selectedOptions.includes(option.id) && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={handleSubmitVote}
          disabled={selectedOptions.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Submit Vote
        </button>
      </div>
    </div>
  );
}
