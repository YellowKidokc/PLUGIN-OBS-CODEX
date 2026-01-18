import { Notice } from 'obsidian';
import { SemanticTaggerSettings } from './settings';

export class AIClient {
  constructor(private settings: SemanticTaggerSettings) {}

  updateSettings(settings: SemanticTaggerSettings): void {
    this.settings = settings;
  }

  async runPrompt(prompt: string): Promise<string> {
    switch (this.settings.aiProvider) {
      case 'ollama':
        return this.runOllama(prompt);
      case 'openai':
        return this.runOpenAI(prompt);
      case 'anthropic':
        return this.runAnthropic(prompt);
      default:
        throw new Error(`Unknown AI provider: ${this.settings.aiProvider}`);
    }
  }

  private async runOllama(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.settings.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.settings.model,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response ?? '';
    } catch (error) {
      new Notice(`Ollama connection failed. Is it running at ${this.settings.ollamaUrl}?`);
      throw error;
    }
  }

  private async runOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async runAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.settings.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text ?? '';
  }
}
