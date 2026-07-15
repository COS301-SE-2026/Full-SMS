import {Modal} from '../ui/Modal'
import { Button } from '../ui';
import {useState} from 'react'

interface SaveSessionProps{
    open: boolean
    controlSave: (name: string) => void
    controlClose: () => void
}

export function SaveSessionModal({open, controlSave, controlClose}: SaveSessionProps){
    const[name,setName] = useState('')
    return(
        <Modal open={open} onClose={controlClose}>
           <div className="p-6 flex flex-col gap-4 w-80">
                <h3 className="text-lg font-normal">Save Session</h3>
                <div className="flex flex-col gap-1">
                    <label htmlFor="sessionName" className="text-sm text-foreground/70">Session Name:</label>
                    <input type="text"
                    value ={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-border rounded px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"/>
            </div>
            <div className="flex gap-2 justify-end">
                <Button onClick={controlClose} variant="secondary">Cancel</Button>
                <Button onClick={() => controlSave(name)} variant="primary">Save</Button>
            </div>
            </div>
        </Modal>
        
    );
    
}