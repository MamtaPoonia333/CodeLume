import type { AIProvider, ChatMessage, ProviderConfig } from './provider.interface.js';

export class OpenAICompatibleProvider implements AIProvider {
  async chat(messages: ChatMessage[], config: ProviderConfig): Promise<string> {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}) }, body: JSON.stringify({ model: config.model, messages, temperature: 0.2 }), signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider returned no message content');
    return content;
  }
}
