'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Upload, Loader2 } from 'lucide-react';

type Document = {
  id: string;
  contentPreview: string;
  owner: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docId, setDocId] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setUploading(true);
    setMessage(null);

    try {
      const body: Record<string, string> = { content: content.trim() };
      if (docId.trim()) {
        body.documentId = docId.trim();
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Document "${data.documentId}" uploaded successfully.` });
        setDocId('');
        setContent('');
        await fetchDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            View your accessible documents and upload new ones.
          </p>
        </div>

        {/* Upload form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="docId" className="text-sm font-medium">
                  Document ID{' '}
                  <span className="font-normal text-muted-foreground">(optional, auto-generated if empty)</span>
                </label>
                <Input
                  id="docId"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  placeholder="e.g. quarterly-report-q1"
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste document content here..."
                  disabled={uploading}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              {message && (
                <p
                  className={`text-sm ${
                    message.type === 'success'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {message.text}
                </p>
              )}
              <Button
                type="submit"
                disabled={uploading || !content.trim()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Document list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Your Documents
              <Badge variant="secondary" className="ml-2">
                {documents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No documents accessible. Upload one above or ask an admin to add
                you to the organization.
              </p>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.id}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          owner: {doc.owner}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {doc.contentPreview}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
