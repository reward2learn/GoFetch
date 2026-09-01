"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-primary mb-8">
          Welcome to GoFetch
        </h1>
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-muted mb-4">
            This is the Next.js frontend for the GoFetch platform.
          </p>
          <Button variant="primary" onClick={() => router.push("/login")}>
            Get Started
          </Button>
        </Card>
      </div>
    </main>
  );
}
