'use client'

import { Button, Card, CardContent, CardFooter, CardHeader, Toggle } from '@/components/ui'
import React, { useState } from 'react'

export default function FittingDialog() {
    const [background, setBackground] = useState<boolean>(true)
    const [detectEndpoint, setDetectEndpoint] = useState<boolean>(true)
    const [startMode, setStartMode] = useState<string>("(Close to) max")
    const [useIRF, setUseIRF] = useState<boolean>(true)
    const [useSimulatedIRF, setUseSimulatedIRF] = useState<boolean>(false)
    const [fitFWHM, setFitFWHM] = useState<boolean>(false)



  return (
    <Card className='flex flex-col content-center w-[40vw]'>
        <CardHeader className='border-b bg-primary/60'>Lifetime fitting</CardHeader>
        <CardContent>Fit Target</CardContent>
        <div className='p-4 border-b'>
            <select name='fit-target' className='border p-2 rounded-sm font-mono'>
                <option value="Measurement(full decay)">Measurement(full decay)</option>
                <option value="All levels">All levels</option>
            </select>
            <div className='flex felx-row mt-2'>
                <label htmlFor="Scope" className='mr-2 content-center'>Scope: </label>
                <select name='Scope' id='Scope' className='border p-2 rounded-sm font-mono'>
                    <option value="Current">Current</option>
                    <option value="Selected">Selected</option>
                    <option value="All">All</option>
                </select>
            </div>
        </div>
        <CardContent>Number of Exponentials</CardContent>
        <div className='p-4 border-b'>
            <select name='Number of exponentials' className='border p-2 rounded-sm w-[20vw] font-mono'>
                <option className='font-mono' value="1">1</option>
                <option className='font-mono' value="2">2</option>
                <option className='font-mono' value="3">3</option>
            </select>
        </div>
        <CardContent>Lifetime Parameters (tau, ns)</CardContent>
        <div className='p-4 border-b'>
            <div className='mb-2'>
                <label className='mr-2' htmlFor="tau1 init">tau1 init: </label>
                <input className='border rounded-sm p-1' type='number' name='tau1 init' min={0.001} max={Infinity} step={0.1}/>
            </div>
            <div>
                <p className='mb-2 font-bold'>Bounds: </p>
                <label htmlFor="min" className='mr-2'>min</label>
                <input className='border rounded-sm p-1 mr-4' type='number' name='min' min={-9999999980506447872.000} max={Infinity} step={0.1}/>
                <label htmlFor="max" className='mr-2'>max</label>
                <input className='border rounded-sm p-1' type='number' name='max' min={-9999999980506447872.000} max={Infinity} step={0.1}/>
            </div>
        </div>
        <CardContent>IRF Settings</CardContent>
        <div className='p-4 border-b'>
            <Toggle
            label="Use IRF"
            checked={useIRF}
            onCheckedChange={setUseIRF}
            />
            {
                useIRF && (
                    <div className='mt-2'>
                        <Toggle
                        label="Use Simulated IRF"
                        checked={useSimulatedIRF}
                        onCheckedChange={setUseSimulatedIRF}
                        />

                        {
                            useSimulatedIRF && (
                                <div className='mt-2'>
                                    <label htmlFor="FWHM (ns)" className='mr-2'>FWHM (ns)</label>
                                    <input className='border rounded-sm p-1 mr-4' type='number' name='FWHM (ns)' min={-9999999980506447872.000} max={Infinity} step={0.1}/>
                                    <Toggle
                                    label="Fit FWHM"
                                    checked={fitFWHM}
                                    onCheckedChange={setFitFWHM}
                                    />
                                    {
                                        fitFWHM && (
                                             <div className='mt-2'>
                                                <p>FWHM bounds:</p>
                                                <label htmlFor="fwhm-min" className='mr-2'>min</label>
                                                <input className='border rounded-sm p-1 mr-4' type='number' name='fwhm-min' min={-9999999980506447872.000} max={Infinity} step={0.1}/>
                                                <div className='mt-2'>
                                                    <label htmlFor="fwhm-max" className='mr-2'>max (ns)</label>
                                                    <input className='border rounded-sm p-1' type='number' name='fwhm-max' min={-9999999980506447872.000} max={Infinity} step={0.1}/>                                         
                                                </div>
                                            </div>
                                        )
                                    }                          
                                </div>
                            )
                        }
                        
                    </div>
                )
            }
            {
                useIRF && (
                    <div className='mt-2'>
                        <p>Shift:</p>
                        <label htmlFor="init-shift" className='mr-2'>init:</label>
                        <input className='border rounded-sm p-1 mr-4' type='number' name='FWHM (ns)' min={-9999999980506447872.000} max={Infinity} step={0.1}/>

                        <div className='mt-2'>
                            <p>Shift bounds:</p>
                            <label htmlFor="shift-min" className='mr-2'>min</label>
                            <input className='border rounded-sm p-1 mr-4' type='number' name='shift-min' min={-9999999980506447872.000} max={Infinity} step={0.1}/>
                            <label htmlFor="shift-max" className='mr-2'>max</label>
                            <input className='border rounded-sm p-1' type='number' name='shift-max' min={-9999999980506447872.000} max={Infinity} step={0.1}/>
                        </div>
                    </div>
                )
            }
        </div>
        <CardContent>Fit Range</CardContent>
        <div className='p-4 border-b'>
            <label htmlFor="Start Mode" className='mr-2'>Start Mode: </label>
            <select name='Start Mode'
                id='Start Mode'
                className='border p-2 rounded-sm w-[25vw] font-mono'
                value={startMode}
                onChange={(e) => setStartMode(e.target.value)}
              >
                <option className='font-mono' value="Manual">Manual</option>
                <option className='font-mono' value="(Close to) max">(Close to) max</option>
                <option className='font-mono' value="Rise middle">Rise middle</option>
                <option className='font-mono' value="Rise start">Rise start</option>
                <option className='font-mono' value="Safe rise start">Safe rise middle</option>
            </select>
            {
                startMode === "Manual" && (
                    <div className='mt-2 mb-2'>
                        <label htmlFor="Start Channel" className='mr-2'>Start channel: </label>
                        <input className='border rounded-sm p-1 mr-4' type='number' name='Start Channel' min={0} max={Infinity} step={1}/>  
                    </div>

                )
            }
            <Toggle
            label="Auto-detect Endpoint"
            checked={detectEndpoint}
            onCheckedChange={setDetectEndpoint}
            />
            {
                detectEndpoint && (
                    <div className='mt-2'>
                        <label htmlFor="End Channel" className='mr-2'>End channel: </label>
                        <input className='border rounded-sm p-1 mr-4' type='number' name='End Channel' min={0} max={Infinity} step={1}/>  
                    </div>
                )
            }
        </div>
        <CardContent>Background</CardContent>
        <div className='p-4 border-b'>
            <Toggle
            label="Auto-estimate background"
            checked={background}
            onCheckedChange={setBackground}
            />
        </div>
        <CardFooter className='flex flex-row'>
            <Button variant="primary" className='mr-2 px-10'>
                Fit
            </Button>
            <Button variant="outline">
                Cancel
            </Button>
        </CardFooter>
    </Card>
  )
}
