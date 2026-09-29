"use client"

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { workspaceService } from "@/services/workspaceServices";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { Button } from "../ui";
import { X } from "lucide-react";

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
}: Readonly<ManageMembersModalProps>){
    const[removingMemberId, setRemovingMemberId] = useState<string | null>(null);

    const [inviteInput, setInviteInput] = useState("");
    const [addProgress, setAddProgress] = useState(false);
    const {successToast, errorToast} = useToast();
    
    const onAdd = async () => {
        if(!inviteInput.trim()) return;
        setAddProgress(true);
        try{
            const result = await workspaceService.addWorkspaceMember(workspaceId, inviteInput.trim());
            if(result.workspace.already_member){
                errorToast("This user is already a member");
            } else{
                setInviteInput("");
                onMembersChanged();
                successToast("Member has been added successfully")
            }
            
        }catch (error: any){
           errorToast(error.message || "Failed to add member")
        }finally{
            setAddProgress(false);
        }
    };
    
    const controlRemove = async (memberId: string) => {
        setRemovingMemberId(memberId);
        try{
            await workspaceService.removeWorkspaceMember(workspaceId, memberId);
            onMembersChanged();
            successToast("Member has been removed successfully")
        }catch(error:any){
            errorToast(error.message || "Failed to remove member")
        }finally{
            setRemovingMemberId(null);
        }
    };

    const getMemberLabel = (member: WorkspaceMemberProfile) =>
        member.username || member.email || "Unknown user";

    return(
        <Modal open={open} onClose={onClose}>
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="mb-4 text-lg font-bold">Manage Members</h2>
                    <Button onClick={onClose} variant="ghost" size="sm"><X className="w-6 h-6"/></Button>
                </div>
                <div className="gap-2 mb-4 flex items-center">
                    <input 
                    type="email"
                    className="border border-cardBorder bg-transparent p-2 text-sm flex-1 rounded-md"
                    value={inviteInput}
                    placeholder="Workspace member's email"
                    onChange={(e) => setInviteInput(e.target.value)} />
                    <Button
                    disabled={addProgress}
                    variant="primary"
                    onClick={onAdd}>
                        {addProgress ? "Adding in progress":"Add"}
                    </Button>
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