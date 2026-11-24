"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, MailCheck } from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackLink } from "@/components/public/BackLink";
import { ApiError } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth-api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestAccepted, setRequestAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setRequestAccepted(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 0
          ? "We could not reach the server. Check your connection and try again."
          : "We could not process your request right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col p-8 lg:p-14">
      <BackLink fallback="/login" className="mb-6" label="Back to sign in" />
      <MindoraLogo />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {requestAccepted ? (
          <div className="space-y-5" role="status" aria-live="polite">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mindora-purple-pale text-mindora-purple">
              <MailCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Check your inbox</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              If a MINDORA account matches <span className="font-semibold text-foreground">{email}</span>,
              a password reset link may be sent to that address. Check your inbox and spam folder.
            </p>
            <p className="text-sm text-muted-foreground">
              For your security, the link expires after 15 minutes and can only be used once.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/login">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <span className="mb-4 inline-flex w-fit items-center rounded-full bg-mindora-purple-pale px-3 py-1 text-xs font-medium text-mindora-purple">
              Account recovery
            </span>
            <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
            <p className="mt-2 text-muted-foreground">
              Enter the email address linked to your MINDORA account. We will send a secure reset link when an account matches it.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Sending request..." : "Send reset link"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Need help? Contact MINDORA support through the contact details on the official website.
      </p>
    </div>
  );
}
