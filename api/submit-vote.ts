import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless API endpoint for submitting votes
 * This allows voters to submit without needing their own GitHub token
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gistId, encryptedData } = req.body;

    if (!gistId || !encryptedData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get GitHub token from environment variable
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('GITHUB_TOKEN environment variable not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Update the Gist with new vote data
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: {
          'seacalendar-event.enc': {
            content: encryptedData,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub API error:', error);
      return res.status(response.status).json({
        error: `GitHub API error: ${error.message || response.statusText}`,
      });
    }

    // Success!
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vote submission error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
