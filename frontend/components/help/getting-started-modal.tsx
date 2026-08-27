import { Modal } from "../ui/Modal";
import { Button } from '../ui';
import {useState} from 'react'

interface GettingStartedProps{
    readonly open: boolean
    readonly onClose: () => void
}

export function GettingStartedModal({open, onClose}: GettingStartedProps){
    const [currentStep, setCurrentStep] = useState<number>(0)
    const steps = [
        {
            title: "How to create a workspace",
            points: ["Sign up to create your FULLSMS account", "Login to your new account", "You will be led to the dashboard page where you can create a workspace, visit your profile or create a plugin","Select the Workspaces option on the side menu","Click the New Workspace button","Write the name of your Workspace and the description","Click the Create New Workspace button and a new workspace will be created"]
        },
        {
            title: "How to upload a file for analysis",
            points: ["Select any of the workspaces you have created","Click the Upload File button","Upload valid data files","Click the Open button to start preparing your file for an analysis session"]
        },
        {
            title: "How to navigate to the Analysis Hub Page",
            points: ["Click the Workspaces option in the side menu","Select the file you uploaded","You will be led to the Analysis Hub page","Select an analysis algorithm or any from your plugins","Provide necessary parameter values","Select your preferred type of measurements"]
        }
    ]
    const max = steps.length - 1
    return(
        <Modal open={open} onClose={onClose}>

            <h3>{steps[currentStep].title}</h3>
            <ul>
                {steps[currentStep].points.map((point, index) => (
                    <li key={index}>{point}</li>
                ))}
            </ul>
            <span>Step {currentStep+1} of {steps.length}</span>
            <div className="flex gap-2 justify-end">
                <Button
                onClick={() => setCurrentStep(currentStep > 0 ? currentStep - 1 : currentStep)}>Back</Button>
                <Button
                onClick={() => {if(currentStep === max){onClose();}
                else{
                setCurrentStep(currentStep+1)}}}
                >{currentStep === max ? "Finish": "Next"}</Button>
            </div>
        </Modal>
        
    );
    
}