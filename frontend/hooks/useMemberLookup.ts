import { useEffect, useState } from "react";
import { WorkspaceMemberProfile } from "@/types/workspace";
import { workspaceService } from "@/services/workspaceServices";

export function useMemberLookup(workspaceId: string | null) {
    const [memberLookup, setMemberLookup] = useState<Record<string, WorkspaceMemberProfile>>({});

    useEffect(() => {
        if (!workspaceId) return;
        let stopped = false;

        workspaceService.getWorkspaceMembers(workspaceId)
            .then((res) => {
                if (stopped) return;
                const lookup: Record<string, WorkspaceMemberProfile> = {};
                for (const user of res.members) {
                    lookup[user.id] = user;
                }
                setMemberLookup(lookup);
            })
            .catch(() => {
                if (!stopped) setMemberLookup({});
            });

        return () => { stopped = true; };
    }, [workspaceId]);

    return memberLookup;
}
