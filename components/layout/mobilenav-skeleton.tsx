"use client";

export function MobileNavSkeleton() {
  return (
    <>
      {/* Bottom nav placeholder */}
      <div className="fixed bottom-0 inset-x-0 h-16 bg-card border-t border-border flex items-center justify-around animate-pulse z-40">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-6 w-6 rounded-full bg-muted" />
        ))}
      </div>
    </>
  );
}
