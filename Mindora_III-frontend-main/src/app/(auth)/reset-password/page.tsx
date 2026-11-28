import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { LoginBrandingPanel } from "@/components/auth/LoginBrandingPanel";

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <ResetPasswordForm />
      </Suspense>
      <LoginBrandingPanel />
    </div>
  );
}
