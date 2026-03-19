import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';

/* ── Anthropic + Voyage ─────────────────────────────────────────────── */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3-lite';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

/* ── OpenAI ─────────────────────────────────────────────────────────── */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

/* ── Client ─────────────────────────────────────────────────────────── */

export class AIClient {
  async embed(text: string): Promise<number[]> {
    if (AI_PROVIDER === 'openai') {
      return this.openaiEmbed(text);
    }
    return this.voyageEmbed(text);
  }

  async chat(userQuery: string, systemPrompt: string, context: string): Promise<string> {
    if (AI_PROVIDER === 'openai') {
      return this.openaiChat(userQuery, systemPrompt, context);
    }
    return this.anthropicChat(userQuery, systemPrompt, context);
  }

  /* ── Anthropic / Voyage implementations ───────────────────────────── */

  private async voyageEmbed(text: string): Promise<number[]> {
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

  private async anthropicChat(userQuery: string, systemPrompt: string, context: string): Promise<string> {
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

  /* ── OpenAI implementations ───────────────────────────────────────── */

  private async openaiEmbed(text: string): Promise<number[]> {
    try {
      const resp = await axios.post(
        'https://api.openai.com/v1/embeddings',
        { model: OPENAI_EMBED_MODEL, input: text },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return resp.data?.data?.[0]?.embedding ?? [];
    } catch (err) {
      const e = err as any;
      console.error('OpenAI embed error', e?.response?.data ?? e?.message ?? e);
      return [];
    }
  }

  private async openaiChat(userQuery: string, systemPrompt: string, context: string): Promise<string> {
    try {
      const resp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: OPENAI_CHAT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `<documents>\n${context}\n</documents>\n\n<user_query>${userQuery}</user_query>`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return resp.data?.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      const e = err as any;
      console.error('OpenAI chat error', e?.response?.data ?? e?.message ?? e);
      return '';
    }
  }
}

export const aiClient = new AIClient();
