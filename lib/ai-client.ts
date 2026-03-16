import axios from 'axios';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3-lite';

export class AIClient {
  ollamaHost: string;
  ollamaModel: string;

  constructor({
    host = OLLAMA_HOST,
    model = OLLAMA_MODEL,
  } = {}) {
    this.ollamaHost = host;
    this.ollamaModel = model;
  }

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
      console.error(
        'Voyage embed error',
        e?.response?.data ?? e?.message ?? e
      );
      return [];
    }
  }

  async chat(prompt: string): Promise<string> {
    const url = `${this.ollamaHost}/api/chat`;
    try {
      const resp = await axios.post(url, {
        model: this.ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      });
      return resp.data?.message?.content ?? '';
    } catch (err) {
      const e = err as any;
      console.error(
        'Ollama chat error',
        e?.response?.data ?? e?.message ?? e
      );
      return '';
    }
  }
}

export const aiClient = new AIClient();
