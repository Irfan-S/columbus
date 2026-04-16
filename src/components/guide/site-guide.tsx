"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LS_KEY = "columbus_guide_seen";

export const guideOpenRef: { current: (() => void) | null } = { current: null };

type Step = {
  badge: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    badge: "Welcome",
    title: "The only platform for dive site similarity",
    description:
      "Divers ask \u201cwhat\u2019s a dive site similar to X?\u201d every day in forums and WhatsApp threads. Columbus gives that conversation a structured, searchable home.",
  },
  {
    badge: "The Map",
    title: "Browse the world, one pin at a time",
    description:
      "Click any pin on the globe to see a hero photo, comparison count, and a \u201cwould you dive here again?\u201d rating. Open the site page for the full view.",
  },
  {
    badge: "Site Pages",
    title: "Everything about a dive site",
    description:
      "Per-axis averages across all comparisons, a photo gallery, a ranked list of similar sites, and a thumbs up/down rating you can cast yourself.",
  },
  {
    badge: "Comparisons",
    title: "Rate any two sites in 3 steps",
    description:
      "Pick two sites, rate up to five optional axes \u2014 pelagic life, macro, landscape, currents, visibility \u2014 and add a short note. Permanent and searchable.",
  },
  {
    badge: "Get Started",
    title: "Explore now or join the community",
    description:
      "Guests can browse everything. To submit comparisons and upload photos, sign up with any dive cert (PADI, SSI, NAUI, BSAC, CMAS, SDI, TDI, RAID).",
  },
];

const MOBILE_QUERY = "(max-width: 639px)";

function subscribeMobile(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
}

export function SiteGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const isMobile = useIsMobile();

  const openGuide = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    guideOpenRef.current = openGuide;
    return () => {
      if (guideOpenRef.current === openGuide) guideOpenRef.current = null;
    };
  }, [openGuide]);

  useEffect(() => {
    let seen = "1";
    try {
      seen = window.localStorage.getItem(LS_KEY) ?? "";
    } catch {
      return;
    }
    if (seen) return;
    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      try {
        window.localStorage.setItem(LS_KEY, "1");
      } catch {
        // ignore
      }
      setStep(0);
    }
  }

  const close = () => handleOpenChange(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const badgeLine = (
    <Badge variant="secondary" className="self-start">
      Step {step + 1} of {STEPS.length} &middot; {current.badge}
    </Badge>
  );

  const progressDots = (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <span
          key={i}
          className={
            "h-1.5 w-1.5 rounded-full transition-colors " +
            (i === step ? "bg-primary" : "bg-muted-foreground/30")
          }
          aria-hidden
        />
      ))}
    </div>
  );

  const navButtons = (
    <div className="flex items-center gap-2">
      {step > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
      )}
      {isLast ? (
        <>
          <Link href="/auth/register" onClick={close}>
            <Button variant="outline" size="sm">Join free</Button>
          </Link>
          <Button size="sm" onClick={close}>Start exploring</Button>
        </>
      ) : (
        <Button
          size="sm"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        >
          Next
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="gap-3 rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="gap-3 pb-0">
            {badgeLine}
            <SheetTitle className="font-heading text-lg leading-tight">
              {current.title}
            </SheetTitle>
            <SheetDescription className="text-sm leading-relaxed">
              {current.description}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-2 flex-row items-center justify-between gap-2 border-t pt-3">
            {progressDots}
            {navButtons}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader className="gap-3">
          {badgeLine}
          <DialogTitle className="font-heading text-lg leading-tight">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {current.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {progressDots}
          {navButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
