import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
const OPENAI_EMBED_MODEL =
  process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

export class OpenAIClient {
  private apiKey: string;
  private chatModel: string;
  private embedModel: string;

  constructor({
    apiKey = OPENAI_API_KEY,
    chatModel = OPENAI_CHAT_MODEL,
    embedModel = OPENAI_EMBED_MODEL,
  } = {}) {
    this.apiKey = apiKey;
    this.chatModel = chatModel;
    this.embedModel = embedModel;
  }

  async embed(text: string): Promise<number[]> {
    try {
      const resp = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: this.embedModel,
          input: text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return resp.data?.data?.[0]?.embedding ?? [];
    } catch (err) {
      const e = err as any;
      console.error(
        'OpenAI embed error',
        e?.response?.data ?? e?.message ?? e
      );
      return [];
    }
  }

  async chat(prompt: string): Promise<string> {
    try {
      const resp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.chatModel,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return resp.data?.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      const e = err as any;
      console.error(
        'OpenAI chat error',
        e?.response?.data ?? e?.message ?? e
      );
      return '';
    }
  }
}

export const openaiClient = new OpenAIClient();
