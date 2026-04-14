"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CERT_AGENCIES = [
  { value: "PADI", label: "PADI" },
  { value: "SSI", label: "SSI" },
  { value: "NAUI", label: "NAUI" },
  { value: "BSAC", label: "BSAC" },
  { value: "CMAS", label: "CMAS" },
  { value: "SDI", label: "SDI" },
  { value: "TDI", label: "TDI" },
  { value: "RAID", label: "RAID" },
  { value: "OTHER", label: "Other" },
] as const;

const CERT_LEVELS = [
  "Open Water",
  "Advanced Open Water",
  "Rescue Diver",
  "Divemaster",
  "Instructor",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [certAgency, setCertAgency] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [certLevel, setCertLevel] = useState("");

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password || !displayName) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!certAgency || !certNumber || !certLevel) {
      setError("All certification details are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          certAgency,
          certNumber,
          certLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        router.push("/auth/login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Image
            src="/logo-text.png"
            alt="Columbus"
            width={180}
            height={80}
            className="mx-auto h-16 w-auto"
            priority
          />
          <div>
            <CardTitle className="text-2xl font-bold">Join Columbus</CardTitle>
            <CardDescription>
              {step === 1 ? "Create your account" : "Your diving certification"}
            </CardDescription>
          </div>
          <div className="flex justify-center gap-2">
            <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How other divers will see you" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
              </div>
              <Button type="submit" className="w-full">Continue</Button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="certAgency">Certification agency</Label>
                  <Tooltip>
                    <TooltipTrigger type="button" className="text-muted-foreground hover:text-foreground text-xs">(why?)</TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Columbus is for certified divers. Your cert details help us maintain a trusted community. We never share this data.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={certAgency} onValueChange={(v) => setCertAgency(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select your agency" /></SelectTrigger>
                  <SelectContent>
                    {CERT_AGENCIES.map((a) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="certNumber">Certification number</Label>
                <Input id="certNumber" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="Your diver certification number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certLevel">Certification level</Label>
                <Select value={certLevel} onValueChange={(v) => setCertLevel(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                  <SelectContent>
                    {CERT_LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
              </div>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
