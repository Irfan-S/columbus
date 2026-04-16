"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiteGuide, guideOpenRef } from "@/components/guide/site-guide";
import type { Profile } from "@/db/schema";

export function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5">
          <Image
            src="/logo.png"
            alt="Columbus"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="text-lg font-bold text-primary hidden sm:inline">Columbus</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/search">
            <Button variant="ghost" size="sm">Search</Button>
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open guide"
            onClick={() => guideOpenRef.current?.()}
          >
            <CircleHelp />
          </Button>

          {profile ? (
            <>
              <Link href="/compare">
                <Button variant="ghost" size="sm">Compare</Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {profile.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground">{profile.certAgency} {profile.certLevel}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>My Comparisons</DropdownMenuItem>
                  {(profile.role === "pro" || profile.role === "admin") && (
                    <DropdownMenuItem onClick={() => router.push("/pro/dashboard")}>Pro Dashboard</DropdownMenuItem>
                  )}
                  {profile.role === "admin" && (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>Admin Panel</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/auth/register"><Button size="sm">Join</Button></Link>
            </>
          )}
        </nav>
      </div>
      <SiteGuide />
    </header>
  );
}
