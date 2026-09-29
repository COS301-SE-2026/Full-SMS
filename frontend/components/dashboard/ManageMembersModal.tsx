"use client"

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { workspaceService } from "@/services/workspaceServices";
import { useToast } from "@/contexts/toastContext/ToastContext";

interface WorkspaceMemberProfile{
    id: string;
    email: string;
    username: string | null;
    role: string;
}

interface ManageMembersModalProps{
    open: boolean;
    onClose: () => void;
    workspaceId: string;
    ownerId: string;
    members: WorkspaceMemberProfile[];
    onMembersChanged: () => void;
}

export function ManageMembersModal({
    open,
    onClose,
    workspaceId,
    ownerId,
    members,
    onMembersChanged,
}: ManageMembersModalProps){
    const[removingMemberId, setRemovingId] = useState<string | null>(null);
    const[errorMessage, setErrorMessage] = useState<string | null>(null);

    const [inviteInput, setInviteInput] = useState("");
    const [addProgress, setAddProgress] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const {successToast, errorToast} = useToast();
    
    const onAdd = async () => {
        if(!inviteInput.trim()) return;
        setAddProgress(true);
        setAddError(null);
        try{
            await workspaceService.addWorkspaceMember(workspaceId, inviteInput.trim());
            setInviteInput("");
            onMembersChanged();
            successToast("Member has been added successfully")
        }catch (error: any){
           errorToast("Failed to add member")
        }finally{
            setAddProgress(false);
        }
    }
    const controlRemove = async (memberId: string) => {
        setRemovingId(memberId);
        setErrorMessage(null);
        try{
            await workspaceService.removeWorkspaceMember(workspaceId, memberId);
            onMembersChanged();
            successToast("Member has been removed successfully")
        }catch(error:any){
            errorToast("Failed to remove member")
        }finally{
            setRemovingId(null);
        }
    };

    const getMemberLabel = (member: WorkspaceMemberProfile) =>
        member.username || member.email || "Unknown user";

    return(
        <Modal open={open} onClose={onClose}>
            <div className="p-4">
                <h2 className="mb-4 text-lg font-bold">Manage Members</h2>

                <div className="gap-2 mb-4 flex items-center">
                    <input 
                    type="email"
                    className="border border-cardBorder bg-transparent p-2 text-sm flex-1 rounded-md"
                    value={inviteInput}
                    placeholder="Workspace member's email"
                    onChange={(e) => setInviteInput(e.target.value)} />
                    <button
                    disabled={addProgress}
                    className="text-sm text-white disabled:opacity-50 rounded-md bg-primary-500 py-2"
                    onClick={onAdd}>
                        {addProgress ? "Adding in progress":"Add"}
                    </button>
                </div>

                
                <div className="space-y-2">
                    {members.map((member) => {
                        if(member.id === ownerId) return null;

                        return(
                            <div className="border border-cardBorder rounded-md p-2 flex items-center justify-between"
                                 key={member.id}>
                                <span className="text-sm">{getMemberLabel(member)}</span>
                                <button
                                    onClick={()=> controlRemove(member.id)}
                                    disabled={removingMemberId === member.id}
                                    className="text-sm hover:opacity-80 text-destructive disabled:opacity-50">
                                        {removingMemberId === member.id ? "Removing member": "Remove"}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </Modal>
    )
}