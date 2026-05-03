import React from "react";

export function VersionWatermark() {
  return (
    <div className="fixed bottom-1 right-1 z-[9999] pointer-events-none select-none">
      <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/30">
        v{__APP_VERSION__}
      </p>
    </div>
  );
}
