"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wizard } from "@/components/ui/wizard";
import { WelcomeStep, AccountStep, PhotoStep, CompleteStep } from "@/components/onboarding";

type InviteType = "COMPANY_ADMIN" | "COMPANY_MEMBER" | "MEMBER_ADMIN" | "MEMBER_CS";

interface InviteData {
  email: string;
  type: InviteType;
  company: { id: string; name: string } | null;
}

const steps = [
  { id: "welcome", title: "Boas-vindas" },
  { id: "account", title: "Sua conta" },
  { id: "photo", title: "Foto" },
  { id: "complete", title: "Pronto!" },
];

function ConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!token) {
      setValidationError("Token inválido ou não fornecido.");
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/invites/accept?token=${token}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setValidationError(data.error || "Convite inválido ou expirado.");
        return;
      }

      setInviteData(data.invite);
    } catch {
      setValidationError("Erro ao validar convite.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password, image }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Erro ao criar conta.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsComplete(true);
    } catch {
      setSubmitError("Erro ao criar conta. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push(inviteData?.type === "COMPANY_MEMBER" ? "/membro" : "/");
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipPhoto = () => {
    setImage(null);
    nextStep();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent" />
        </motion.div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />

        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-background/95 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-xl font-bold">Convite Inválido</h2>
              <p className="text-sm text-muted-foreground mt-2">{validationError}</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Ir para login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) return null;

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />

      <Card className="w-full max-w-lg relative z-10 shadow-2xl border-0 bg-background/95 backdrop-blur-xl overflow-hidden">
        <div className="p-4 sm:p-6 pb-0">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand shadow-md shadow-primary/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold">Vanguardia</span>
              <span className="block text-[10px] text-muted-foreground font-medium tracking-wide uppercase">360 Panel</span>
            </div>
          </div>

          {!isComplete && (
            <Wizard
              steps={steps}
              currentStep={currentStep}
              className="mb-6"
            />
          )}
        </div>

        <CardContent className="p-4 sm:p-6 pt-2">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <WelcomeStep
                key="welcome"
                type={inviteData.type}
                companyName={inviteData.company?.name}
                onNext={nextStep}
              />
            )}

            {currentStep === 1 && (
              <AccountStep
                key="account"
                email={inviteData.email}
                name={name}
                password={password}
                confirmPassword={confirmPassword}
                onNameChange={setName}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}

            {currentStep === 2 && (
              <PhotoStep
                key="photo"
                name={name}
                image={image}
                onImageChange={setImage}
                onNext={nextStep}
                onBack={prevStep}
                onSkip={skipPhoto}
              />
            )}

            {currentStep === 3 && (
              <CompleteStep
                key="complete"
                type={inviteData.type}
                name={name}
                email={inviteData.email}
                image={image}
                companyName={inviteData.company?.name}
                isSubmitting={isSubmitting}
                isComplete={isComplete}
                error={submitError}
                onSubmit={handleSubmit}
                onGoToLogin={handleGoToLogin}
              />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ConviteContent />
    </Suspense>
  );
}
