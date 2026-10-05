export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ProviderConfig = { baseUrl: string; apiKey: string; model: string };
export interface AIProvider { chat(messages: ChatMessage[], config: ProviderConfig): Promise<string>; }
