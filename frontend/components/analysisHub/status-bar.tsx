export function StatusBar() {
  return (
    <div className="flex items-center h-6 px-3 border-t border-border bg-background text-xs text-foreground/70 gap-4 max-h-6">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-success" />
        <span>Ready</span>
      </div>
      <div className="ml-auto flex items-center gap-4 font-mono">
        <span>file: QD605_sample01.h5</span>
        <span>dur: 120.5s</span>
        <span>counts: 1,543,210</span>
        <span>batch: 1</span>
      </div>
    </div>
  );
}
