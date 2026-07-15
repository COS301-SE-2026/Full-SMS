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
            <h3>Save session</h3>
            <label htmlFor="sessionName">Session Name:</label>
            <input type="text" value ={name} onChange={(e) => setName(e.target.value)}/>
            <div>
                <Button onClick={controlClose}>Cancel</Button>
                <Button onClick={() => controlSave(name)}>Save</Button>
            </div>
        </Modal>
        
    );
    
}