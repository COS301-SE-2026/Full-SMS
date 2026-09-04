"use client";

import { Store } from "lucide-react";

export default function EmptyMarketplaceState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <h2>No Plugins Available</h2>
        <p className="text-foreground/60 mb-6">
          The marketplace is empty. Check back later for community plugins or
          create your own and submit it for review.
        </p>
      </div>
    </div>
  );
}
