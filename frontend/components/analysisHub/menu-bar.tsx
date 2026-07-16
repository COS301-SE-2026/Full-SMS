import Link from "next/link";
import { SaveSessionModal } from "./save-session-modal";
import { useState } from "react";
import { saveSession } from "@/lib/api/sessions";
import { supabase } from "@/lib/supabase/supabaseConfig";
import { RecentSessionsModal } from "./recent-sessions";

interface MenuBarProps {
  onOpenFileUpload: () => void;
}

export function MenuBar({ onOpenFileUpload }: MenuBarProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const callSave = async (name: string) => {
    const {data: {user}} = await supabase.auth.getUser()
    await saveSession(user?.id || 'anonymous', {name: name, dataset_ref: '', parameters: {}, results: {}})
    setSaveModalOpen(false)
  }
  const [recentSessionsModalOpen, setRecentSessionsModalOpen] = useState(false)

  return (
    <>
    <div className="flex items-center h-7 px-2 border-b border-border bg-background">
      
        <button
          onClick={onOpenFileUpload}
          className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
        >
          File
        </button>

        <button
          onClick={() => setSaveModalOpen(true)}
          className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
        >
          Save
        </button>

        <button
          onClick={() => setRecentSessionsModalOpen(true)}
          className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
        >
          Sessions
        </button>

      <Link href="/profile">
          <button
            onClick={onOpenFileUpload}
            className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
          >
            Account
          </button>
      </Link>

    </div>
    <SaveSessionModal
        open={saveModalOpen}
        controlClose={() => setSaveModalOpen(false)}
        controlSave={callSave}
      />

      <RecentSessionsModal
        open={recentSessionsModalOpen}
        onClose={() => setRecentSessionsModalOpen(false)}
        />
    </>
  );
}
