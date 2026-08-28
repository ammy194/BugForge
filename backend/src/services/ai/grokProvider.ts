import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class GrokProvider {
  private static apiKey = env.GROK_API_KEY;
  private static apiUrl = 'https://api.x.ai/v1/chat/completions';

  static isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Execute chat completion call to Grok (xAI)
   */
  static async complete(prompt: string, systemPrompt?: string): Promise<string | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content:
                systemPrompt ||
                'You are an expert developer triage AI for BugForge issue tracking platform. Output strictly valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        logger.warn(`Grok API error: HTTP ${response.status} ${response.statusText}`);
        return null;
      }

      const data = (await response.json()) as any;
      return data.choices?.[0]?.message?.content || null;
    } catch (err: any) {
      logger.warn(`Grok API network exception: ${err.message}`);
      return null;
    }
  }
}
