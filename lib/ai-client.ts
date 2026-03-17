import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3-lite';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export class AIClient {
  async embed(text: string): Promise<number[]> {
    try {
      const resp = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        { model: VOYAGE_MODEL, input: text },
        { headers: { Authorization: `Bearer ${VOYAGE_API_KEY}` } }
      );
      return resp.data?.data?.[0]?.embedding ?? [];
    } catch (err) {
      const e = err as any;
      console.error('Voyage embed error', e?.response?.data ?? e?.message ?? e);
      return [];
    }
  }

  async chat(userQuery: string, systemPrompt: string, context: string): Promise<string> {
    try {
      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `<documents>\n${context}\n</documents>\n\n<user_query>${userQuery}</user_query>`,
        }],
      });
      const block = message.content[0];
      return block.type === 'text' ? block.text : '';
    } catch (err) {
      const e = err as any;
      console.error('Claude chat error', e?.message ?? e);
      return '';
    }
  }
}

export const aiClient = new AIClient();
