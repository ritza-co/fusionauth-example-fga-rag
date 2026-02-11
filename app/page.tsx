import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare, Shield, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">FusionAuth FGA& RAG Example</CardTitle>
          <CardDescription>
            Chat with Retrieval-Augmented Generation, featuring document access control via FusionAuth and FGA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Permission-aware document access</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>RAG-powered intelligent responses</span>
            </div>
          </div>
          <form
            action={async () => {
              'use server';
              await signIn('fusionauth');
            }}
          >
            <Button className="w-full" size="lg" type="submit">
              Sign in with FusionAuth
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
