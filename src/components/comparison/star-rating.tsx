"use client";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
}

export function StarRating({ value, onChange, label }: StarRatingProps) {
  function handleClick(star: number) {
    // Clicking the same star clears it
    onChange(value === star ? null : star);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            className="group p-0.5 focus:outline-none"
            aria-label={`Rate ${label} ${star} of 5`}
          >
            <div
              className={`h-6 w-6 rounded-full transition-colors ${
                value !== null && star <= value
                  ? "bg-primary"
                  : "bg-muted group-hover:bg-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      {value !== null && (
        <span className="text-xs text-muted-foreground">{value}/5</span>
      )}
    </div>
  );
}
