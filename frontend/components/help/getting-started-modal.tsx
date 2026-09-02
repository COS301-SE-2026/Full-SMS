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

            <h3 className="mb-4 mt-4" data-cy="step-tutorial-title">{steps[currentStep].title}</h3>
            <div className="space-y-4">
                {steps[currentStep].points.map((point, index) => (
                    <div className="flex gap-4" key={index}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? "bg-primary/10 border border-primary text-primary" : "bg-card border border-border text-foreground/50"
                        }`}>{index +1}</div>
                        <p className={index === 0 ? "text-foreground" : "text-foreground/60"}>{point}</p>
                    </div>
                ))}
            </div>

           <div className="flex justify-between mt-6">
            <span className="text-primary" data-cy="step-counter">Step {currentStep+1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
           </div>

           <div className="w-full bg-card h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{width: `${Math.round(((currentStep + 1) / steps.length) * 100)}%`}}></div>
           </div>

            <div className="flex gap-2 justify-end mt-4">
                <Button
                data-cy="back-button"
                variant={currentStep === 0 ? "secondary" : "primary"}
                onClick={() => setCurrentStep(currentStep > 0 ? currentStep - 1 : currentStep)}>Back</Button>
                <Button
                data-cy="next-button"
                onClick={() => {if(currentStep === max){onClose();}
                else{
                setCurrentStep(currentStep+1)}}}
                >{currentStep === max ? "Finish": "Next"}</Button>
            </div>
        </Modal>
        
    );
    
}