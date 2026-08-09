import { tauriGitBackend } from './tauriGitBackend';
import { loadAIConfig } from './appStore';

export interface AICommitMessageRequest {
  repoPath: string;
  stagedFiles: Array<{
    path: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
}

export interface AICommitMessageResponse {
  message: string;
}

export async function generateAICommitMessage(
  request: AICommitMessageRequest
): Promise<AICommitMessageResponse> {
  const config = loadAIConfig();

  if (!config.enabled) {
    throw new Error('AI commit message generation is not enabled. Please configure it in Settings.');
  }

  if (!config.baseUrl || !config.apiKey) {
    throw new Error('AI configuration is incomplete. Please check Settings.');
  }

  // Get the staged diff from git
  const diff = await tauriGitBackend.getStagedDiff(request.repoPath);

  if (!diff || diff.trim().length === 0) {
    throw new Error('No staged changes found.');
  }

  // Prepare the prompt
  const filesSummary = request.stagedFiles
    .map(f => `${f.status} ${f.path} (+${f.additions} -${f.deletions})`)
    .join('\n');

  const prompt = `You are a helpful assistant that generates concise, conventional commit messages.

Given the following staged changes summary:
${filesSummary}

And the git diff:
${diff}

Generate a commit message following these rules:
- Use Conventional Commits format: <type>(<scope>): <subject>
- Types: feat, fix, docs, style, refactor, test, chore
- Subject line: max 50 characters, imperative mood, no period at end
- If needed, add a blank line then a body explaining what/why (not how)
- Body lines max 72 characters
- Return ONLY the commit message, no explanations

Commit message:`;

  // Call the OpenAI-compatible API
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Extract the message from the response
  const message = data.choices?.[0]?.message?.content?.trim();

  if (!message) {
    throw new Error('No commit message generated');
  }

  return { message };
}
