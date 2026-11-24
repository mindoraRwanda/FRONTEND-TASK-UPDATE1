"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/public/BackLink";
import { ApiError } from "@/lib/api";
import { resetPassword } from "@/lib/auth-api";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its security token. Request a new link to continue.");
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("Use at least 8 characters, including at least one letter and one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match. Check them and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setIsComplete(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError("This reset link is invalid, expired, or has already been used. Request a new link to continue.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("We could not reach the server. Check your connection and try again.");
      } else {
        setError("We could not update your password right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col p-8 lg:p-14">
      <BackLink fallback="/login" className="mb-6" label="Back to sign in" />
      <MindoraLogo />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {isComplete ? (
          <div className="space-y-5" role="status" aria-live="polite">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mindora-purple-pale text-mindora-purple">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Password updated</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Your MINDORA password has been changed. Sign in using your new password. Existing refresh sessions have been revoked for your protection.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/login">
                Continue to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : !token ? (
          <div className="space-y-5">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mindora-purple-pale text-mindora-purple">
              <LockKeyhole className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Reset link unavailable</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              This page needs the secure token from your MINDORA password reset email. Request a new reset link to continue.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
          <>
            <span className="mb-4 inline-flex w-fit items-center rounded-full bg-mindora-purple-pale px-3 py-1 text-xs font-medium text-mindora-purple">
              Secure account recovery
            </span>
            <h1 className="text-3xl font-bold tracking-tight">Create a new password</h1>
            <p className="mt-2 text-muted-foreground">
              Choose a password you have not used for your MINDORA account before.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  showStrength
                />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with at least one letter and one number.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm new password
                </label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Updating password..." : "Update password"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
