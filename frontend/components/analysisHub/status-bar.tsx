import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";


export function StatusBar() {
  const {currentUploadName} = useHdf5Data()
  const fileName = currentUploadName
  return (
    <div className="flex items-center h-4 px-3 border-t border-border bg-background text-xs text-foreground/70 gap-4 max-h-6">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-success" />
        <span>Ready</span>
      </div>
      <div className="ml-auto flex items-center gap-4 font-mono">
        <span>{fileName || "*.h5"}</span>
      </div>
    </div>
  );
}
