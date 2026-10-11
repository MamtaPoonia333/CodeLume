import type { AIProvider, ChatMessage, ProviderConfig } from './provider.interface.js';

export class OpenAICompatibleProvider implements AIProvider {
  async chat(messages: ChatMessage[], config: ProviderConfig): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}) },
        body: JSON.stringify({ model: config.model, messages, temperature: 0.2, max_tokens: 200, options: { num_ctx: 1024 } }),
        signal: AbortSignal.timeout(120_000)
      });
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new Error('AI provider request timed out');
      }
      throw error;
    }
    if (!response.ok) {
      const details = await response.text();
      let message = `AI provider returned ${response.status}`;
      try {
        const body = JSON.parse(details) as { error?: { message?: string } };
        if (body.error?.message) message = body.error.message;
      } catch {
        if (details.trim()) message = `${message}: ${details.trim()}`;
      }
      throw new Error(message);
    }
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider returned no message content');
    return content;
  }
}
