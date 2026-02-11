import axios from 'axios';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

export class OllamaClient {
  host: string;
  model: string;
  embedModel: string;

  constructor({
    host = OLLAMA_HOST,
    model = OLLAMA_MODEL,
    embedModel = OLLAMA_EMBED_MODEL,
  } = {}) {
    this.host = host;
    this.model = model;
    this.embedModel = embedModel;
  }

  async embed(text: string): Promise<number[]> {
    const url = `${this.host}/api/embed`;
    try {
      const resp = await axios.post(url, {
        model: this.embedModel,
        input: text,
      });
      return resp.data?.embeddings?.[0] ?? [];
    } catch (err) {
      const e = err as any;
      console.error(
        'Ollama embed error',
        e?.response?.data ?? e?.message ?? e
      );
      return [];
    }
  }

  async chat(prompt: string): Promise<string> {
    const url = `${this.host}/api/chat`;
    try {
      const resp = await axios.post(url, {
        model: this.model,
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

export const ollamaClient = new OllamaClient();
