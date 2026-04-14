"use client";

import { useState } from "react";

interface Props {
  siteId: string;
  userRating: boolean | null; // null = not yet rated
  initialYes: number;
  initialNo: number;
  loggedIn: boolean;
}

function ThumbUp({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 transition-colors ${filled ? "fill-primary stroke-primary" : "fill-none stroke-current"}`}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function ThumbDown({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 transition-colors ${filled ? "fill-destructive stroke-destructive" : "fill-none stroke-current"}`}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}

export function DiveAgainRating({ siteId, userRating, initialYes, initialNo, loggedIn }: Props) {
  const [myRating, setMyRating] = useState<boolean | null>(userRating);
  const [yes, setYes] = useState(initialYes);
  const [no, setNo] = useState(initialNo);
  const [loading, setLoading] = useState(false);

  const total = yes + no;
  const pct = total > 0 ? Math.round((yes / total) * 100) : null;

  async function vote(value: boolean) {
    if (loading || !loggedIn) return;

    // Optimistic update
    const prev = myRating;
    const prevYes = yes;
    const prevNo = no;

    if (prev === value) return; // clicking same vote does nothing

    setMyRating(value);
    if (prev !== null) {
      // switching vote
      if (value) { setYes(yes + 1); setNo(no - 1); }
      else { setNo(no + 1); setYes(yes - 1); }
    } else {
      // first vote
      if (value) setYes(yes + 1);
      else setNo(no + 1);
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wouldDiveAgain: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setYes(data.yes);
        setNo(data.no);
      } else {
        // revert on error
        setMyRating(prev);
        setYes(prevYes);
        setNo(prevNo);
      }
    } catch {
      setMyRating(prev);
      setYes(prevYes);
      setNo(prevNo);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      {myRating === null && loggedIn ? (
        // Unrated — show prompt
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Would you dive here again?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => vote(true)}
              disabled={loading}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              aria-label="Yes"
            >
              <ThumbUp filled={false} />
              <span className="text-xs">Yes</span>
            </button>
            <button
              type="button"
              onClick={() => vote(false)}
              disabled={loading}
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              aria-label="No"
            >
              <ThumbDown filled={false} />
              <span className="text-xs">No</span>
            </button>
          </div>
        </div>
      ) : (
        // Rated or logged out — show aggregate + user's vote if applicable
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Would dive here again</p>
            {pct !== null && (
              <span className="text-lg font-bold text-primary">{pct}%</span>
            )}
          </div>

          {total > 0 && (
            <>
              {/* Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbUp filled={myRating === true} />
                  {yes} yes
                </span>
                <span className="text-xs text-muted-foreground">{total} rating{total !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1">
                  {no} no
                  <ThumbDown filled={myRating === false} />
                </span>
              </div>
            </>
          )}

          {/* Allow changing vote */}
          {loggedIn && myRating !== null && (
            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">
                Your vote: <span className={myRating ? "text-primary font-medium" : "text-destructive font-medium"}>{myRating ? "Yes" : "No"}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => vote(true)}
                  disabled={loading || myRating === true}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                    myRating === true
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  } disabled:opacity-60`}
                >
                  <ThumbUp filled={myRating === true} />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => vote(false)}
                  disabled={loading || myRating === false}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                    myRating === false
                      ? "bg-destructive/10 text-destructive font-medium"
                      : "text-muted-foreground hover:text-destructive"
                  } disabled:opacity-60`}
                >
                  <ThumbDown filled={myRating === false} />
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logged-out aggregate */}
      {!loggedIn && total === 0 && (
        <p className="text-sm text-muted-foreground">No ratings yet. Sign in to be the first.</p>
      )}
    </div>
  );
}
