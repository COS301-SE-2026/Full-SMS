'use client'

import { Button, Card, CardContent, CardFooter, Toggle } from '@/components/ui'
import React, { useState, useRef } from 'react'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import { LifetimeReq, StartpointMode } from '@/types/analysis'
import { getLifetimeData } from '@/services/analysisServices'
import { useHistoryRecorder } from '@/hooks/useHistoryRecorder'

export default function FittingDialog() {
    const [background, setBackground] = useState<boolean>(true)
    const [detectEndpoint, setDetectEndpoint] = useState<boolean>(true)
    const [startMode, setStartMode] = useState<string>("(Close to) max")
    const [useIRF, setUseIRF] = useState<boolean>(true)
    const [useSimulatedIRF, setUseSimulatedIRF] = useState<boolean>(false)
    const [fitFWHM, setFitFWHM] = useState<boolean>(false)
    const [scope, setScope] = useState<string>("Current")
    const [numExponents, setNumExponents] = useState<number>(1)
    
    // Multi-exponential lifetime initial guesses (defaults match Full-SMS desktop)
    const [tau1Init, setTau1Init] = useState<number>(5.000)
    const [tau2Init, setTau2Init] = useState<number>(1.000)
    const [tau3Init, setTau3Init] = useState<number>(0.100)

    const [boundsMin, setBoundsMin] = useState<number>(0.010)
    const [boundsMax, setBoundsMax] = useState<number>(100.000)
    const [fhwm, setFhwm] = useState<number>(0.100)
    const [fwhmBoundsMin, setFwhmBoundsMin] = useState<number>(0)
    const [fwhmBoundsMax, setFwhmBoundsMax] = useState<number>(2)
    const [shiftInit, setShiftInit] = useState<number>(0)
    const [shiftBoundsMin, setShiftBoundsMin] = useState<number>(-2000)
    const [shiftBoundsMax, setShiftBoundsMax] = useState<number>(2000)
    const [startChannel, setStartChannel] = useState<number>(0)
    const [endChannel, setEndChannel] = useState<number>(4096)
    const [backgroundValue, setBackgroundValue] = useState<number>(0)
    
    const { setFittingDialogOpen, decayCounts, decayTimes, setFitResult } = useAnalysisTab()
    const { currentMeasurement, currentUpload, currentChannel, currentMappedIrf, currentWorkspaceId } = useHdf5Data()

    const recordHist = useHistoryRecorder(currentWorkspaceId, currentUpload, "lifetime")

    const initialSettings = useRef({
        numExponents, tau1Init, tau2Init, tau3Init, boundsMin, boundsMax, background, detectEndpoint, useIRF, useSimulatedIRF, fitFWHM, fhwm, fwhmBoundsMin, fwhmBoundsMax,
    })

    const fetchLifetimeFitting = async () => {
        const mapStartMode = (mode: string): StartpointMode => {
            switch(mode) {
                case "Manual": return StartpointMode.MANUAL;
                case "Rise middle": return StartpointMode.RISE_MIDDLE;
                case "Rise start": return StartpointMode.RISE_START;
                case "Safe rise start": return StartpointMode.SAFE_RISE_START;
                default: return StartpointMode.CLOSE_TO_MAX;
            }
        };

        const tauInitArray = numExponents === 1 
            ? [tau1Init] 
            : numExponents === 2 
            ? [tau1Init, tau2Init] 
            : [tau1Init, tau2Init, tau3Init];

        const request: LifetimeReq = {
            upload_id: currentUpload,
            measurement_id: currentMeasurement,
            channel: currentChannel,
            use_irf: useIRF,
            times: decayTimes,
            counts: decayCounts,
            num_exponentials: numExponents,
            tau_init: tauInitArray,
            tau_bounds: [boundsMin, boundsMax],
            autostart: mapStartMode(startMode),
            autoend: detectEndpoint,
            
            // Send start/end channels only if manual mode is active
            start: startMode === "Manual" ? startChannel : null,
            end: !detectEndpoint ? endChannel : null,

            // Send background only if auto-estimate is toggled off
            background: !background ? backgroundValue : null,

            // Send Shift parameters
            shift_init: shiftInit,
            shift_bounds: [shiftBoundsMin, shiftBoundsMax],

            // IRF / FWHM
            fit_irf_fwhm: useIRF && useSimulatedIRF && fitFWHM,
            irf_fwhm_init: useIRF && useSimulatedIRF && fitFWHM ? fhwm : null,
            irf_fwhm_bounds: useIRF && useSimulatedIRF && fitFWHM ? [fwhmBoundsMin, fwhmBoundsMax] : null,
        }
        
        const response = await getLifetimeData(request);
        setFitResult(response)
    }

    const handleFit = () => {
        const newSettings = {
            numExponents, tau1Init, tau2Init, tau3Init, boundsMin, boundsMax, background, detectEndpoint, useIRF, useSimulatedIRF, fitFWHM, fhwm, fwhmBoundsMin, fwhmBoundsMax,
        };
        recordHist("fit_settings", initialSettings.current, newSettings);
        initialSettings.current = newSettings;
        fetchLifetimeFitting();
        setFittingDialogOpen(false);
    }

    return (
        <Card className='flex flex-col h-[80vh] w-full text-xs border-0 overflow-y-auto'>
            <CardContent className='border-t font-semibold'>Fit Target</CardContent>
            <div className='p-4 border-b'>
                <select name='fit-target' className='border p-2 rounded-sm font-mono bg-card'>
                    <option value="Measurement(full decay)">Measurement(full decay)</option>
                    <option value="All levels">All levels</option>
                </select>

                <div className='flex flex-row mt-2 items-center'>
                    <label htmlFor="Scope" className='mr-2'>Scope: </label>
                    <select 
                        name='Scope' 
                        id='Scope' 
                        className='border p-2 rounded-sm font-mono bg-card'
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                    >
                        <option value="Current">Current</option>
                        <option value="Selected">Selected</option>
                        <option value="All">All</option>
                    </select>
                </div>
            </div>

            <CardContent className='font-semibold'>Number of Exponentials</CardContent>
            <div className='p-4 border-b'>
                <select 
                    name='Number of exponentials' 
                    className='border p-2 rounded-sm w-48 font-mono bg-card'
                    value={numExponents}
                    onChange={(e) => setNumExponents(Number(e.target.value))}
                >
                    <option className='font-mono' value={1}>1 (Single Exponential)</option>
                    <option className='font-mono' value={2}>2 (Double Exponential)</option>
                    <option className='font-mono' value={3}>3 (Triple Exponential)</option>
                </select>
            </div>

            <CardContent className='font-semibold'>Lifetime Parameters (tau, ns)</CardContent>
            <div className='p-4 border-b flex flex-col gap-2'>
                <div className='flex items-center'>
                    <label className='w-20' htmlFor="tau1 init">&tau;<sub>1</sub> init: </label>
                    <input 
                        className='border rounded-sm p-1 bg-card' 
                        type='number' 
                        name='tau1 init' 
                        min={0.001} 
                        step={0.1}
                        value={tau1Init}
                        onChange={(e) => setTau1Init(Number(e.target.value))}
                    />
                </div>

                {numExponents >= 2 && (
                    <div className='flex items-center'>
                        <label className='w-20' htmlFor="tau2 init">&tau;<sub>2</sub> init: </label>
                        <input 
                            className='border rounded-sm p-1 bg-card' 
                            type='number' 
                            name='tau2 init' 
                            min={0.001} 
                            step={0.1}
                            value={tau2Init}
                            onChange={(e) => setTau2Init(Number(e.target.value))}
                        />
                    </div>
                )}

                {numExponents >= 3 && (
                    <div className='flex items-center'>
                        <label className='w-20' htmlFor="tau3 init">&tau;<sub>3</sub> init: </label>
                        <input 
                            className='border rounded-sm p-1 bg-card' 
                            type='number' 
                            name='tau3 init' 
                            min={0.001} 
                            step={0.1}
                            value={tau3Init}
                            onChange={(e) => setTau3Init(Number(e.target.value))}
                        />
                    </div>
                )}

                <div className='mt-2'>
                    <p className='mb-2 font-bold'>Bounds (ns): </p>
                    <div className='flex items-center gap-4'>
                        <label htmlFor="min" className='mr-1'>min:</label>
                        <input 
                            className='border rounded-sm p-1 w-24 bg-card' 
                            type='number' 
                            name='min' 
                            min={0.001} 
                            step={0.01} 
                            value={boundsMin}
                            onChange={(e) => setBoundsMin(Number(e.target.value))}
                        />
                        <label htmlFor="max" className='mr-1'>max:</label>
                        <input 
                            className='border rounded-sm p-1 w-24 bg-card' 
                            type='number' 
                            name='max' 
                            min={0.01} 
                            step={1} 
                            value={boundsMax}
                            onChange={(e) => setBoundsMax(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <CardContent className='font-semibold'>IRF Settings</CardContent>
            <div className='p-4 border-b'>
                {currentMappedIrf && (
                    <p className='font-bold mb-2 text-primary'>Active Mapped IRF: {currentMappedIrf.name}</p>
                )}
                <Toggle
                    label="Use IRF"
                    checked={useIRF}
                    onCheckedChange={setUseIRF}
                />
                {useIRF && (
                    <div className='mt-2 pl-4 border-l-2 border-border'>
                        <Toggle
                            label="Use Simulated IRF"
                            checked={useSimulatedIRF}
                            onCheckedChange={setUseSimulatedIRF}
                        />

                        {useSimulatedIRF && (
                            <div className='mt-2'>
                                <div className='flex items-center mb-2'>
                                    <label htmlFor="FWHM (ns)" className='mr-2'>FWHM (ns):</label>
                                    <input 
                                        className='border rounded-sm p-1 bg-card w-24' 
                                        type='number' 
                                        name='FWHM (ns)' 
                                        min={0.001} 
                                        step={0.05}
                                        value={fhwm}
                                        onChange={(e) => setFhwm(Number(e.target.value))}
                                    />
                                </div>
                                <Toggle
                                    label="Fit FWHM"
                                    checked={fitFWHM}
                                    onCheckedChange={setFitFWHM}
                                />
                                {fitFWHM && (
                                    <div className='mt-2 pl-4'>
                                        <p className='font-medium'>FWHM bounds:</p>
                                        <div className='flex items-center gap-4 mt-1'>
                                            <label htmlFor="fwhm-min">min:</label>
                                            <input 
                                                className='border rounded-sm p-1 w-20 bg-card' 
                                                type='number' 
                                                name='fwhm-min' 
                                                min={0} 
                                                step={0.05}
                                                value={fwhmBoundsMin}
                                                onChange={(e) => setFwhmBoundsMin(Number(e.target.value))}
                                            />
                                            <label htmlFor="fwhm-max">max:</label>
                                            <input 
                                                className='border rounded-sm p-1 w-20 bg-card' 
                                                type='number' 
                                                name='fwhm-max' 
                                                min={0.01} 
                                                step={0.1}
                                                value={fwhmBoundsMax}
                                                onChange={(e) => setFwhmBoundsMax(Number(e.target.value))}
                                            />                                         
                                        </div>
                                    </div>
                                )}                          
                            </div>
                        )}
                        
                        <div className='mt-4'>
                            <p className='font-medium'>Shift (channels):</p>
                            <div className='flex items-center gap-2 mt-1'>
                                <label htmlFor="init-shift">init:</label>
                                <input 
                                    className='border rounded-sm p-1 w-24 bg-card' 
                                    type='number' 
                                    name='shift-init' 
                                    step={1}
                                    value={shiftInit}
                                    onChange={(e) => setShiftInit(Number(e.target.value))}
                                />
                            </div>

                            <div className='flex items-center gap-4 mt-2'>
                                <label htmlFor="shift-min">min:</label>
                                <input 
                                    className='border rounded-sm p-1 w-24 bg-card' 
                                    type='number' 
                                    name='shift-min'
                                    step={10}
                                    value={shiftBoundsMin}
                                    onChange={(e) => setShiftBoundsMin(Number(e.target.value))}
                                />
                                <label htmlFor="shift-max">max:</label>
                                <input 
                                    className='border rounded-sm p-1 w-24 bg-card' 
                                    type='number' 
                                    name='shift-max' 
                                    step={10}
                                    value={shiftBoundsMax}
                                    onChange={(e) => setShiftBoundsMax(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CardContent className='font-semibold'>Fit Range</CardContent>
            <div className='p-4 border-b'>
                <div className='flex items-center gap-2 mb-2'>
                    <label htmlFor="Start Mode">Start Mode: </label>
                    <select 
                        name='Start Mode'
                        id='Start Mode'
                        className='border p-2 rounded-sm font-mono bg-card'
                        value={startMode}
                        onChange={(e) => setStartMode(e.target.value)}
                    >
                        <option className='font-mono' value="Manual">Manual</option>
                        <option className='font-mono' value="(Close to) max">(Close to) max</option>
                        <option className='font-mono' value="Rise middle">Rise middle</option>
                        <option className='font-mono' value="Rise start">Rise start</option>
                        <option className='font-mono' value="Safe rise start">Safe rise start</option>
                    </select>
                </div>

                {startMode === "Manual" && (
                    <div className='mt-2 mb-2 flex items-center'>
                        <label htmlFor="Start Channel" className='mr-2'>Start channel: </label>
                        <input 
                            className='border rounded-sm p-1 w-24 bg-card' 
                            type='number' 
                            name='Start Channel' 
                            min={0} 
                            step={1}
                            value={startChannel}
                            onChange={(e) => setStartChannel(Number(e.target.value))}
                        />  
                    </div>
                )}

                <Toggle
                    label="Auto-detect Endpoint"
                    checked={detectEndpoint}
                    onCheckedChange={setDetectEndpoint}
                />

                {!detectEndpoint && (
                    <div className='mt-2 flex items-center'>
                        <label htmlFor="End Channel" className='mr-2'>End channel: </label>
                        <input 
                            className='border rounded-sm p-1 w-24 bg-card' 
                            type='number' 
                            name='End Channel' 
                            min={0} 
                            step={1}
                            value={endChannel}
                            onChange={(e) => setEndChannel(Number(e.target.value))}
                        />  
                    </div>
                )}
            </div>

            <CardContent className='font-semibold'>Background</CardContent>
            <div className='p-4 border-b'>
                <Toggle
                    label="Auto-estimate background"
                    checked={background}
                    onCheckedChange={setBackground}
                />
                {!background && (
                    <div className='mt-2 flex items-center'>
                        <label htmlFor="Background value" className='mr-2'>Background value: </label>
                        <input 
                            className='border rounded-sm p-1 w-24 bg-card' 
                            type='number' 
                            name='Background value' 
                            min={0} 
                            step={0.1}
                            value={backgroundValue}
                            onChange={(e) => setBackgroundValue(Number(e.target.value))}
                        /> 
                    </div>
                )}
            </div>

            <CardFooter className='flex flex-row mt-4 pt-2'>
                <Button variant="primary" className='mr-2 px-10' onClick={handleFit}> 
                    Fit
                </Button>
                <Button variant="outline" onClick={() => setFittingDialogOpen(false)}>
                    Cancel
                </Button>
            </CardFooter>
        </Card>
    )
}