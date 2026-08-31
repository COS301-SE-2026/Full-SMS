'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Loader } from "../ui"
import { get_access_token } from '@/services/cloudIntegrationServices';
import { OnedriveAcessToken } from '@/types/auth';
import { access } from 'fs';
interface PickerProps{
    onFilePicked: (fileID: string, filename: string)=>void;
    onCancel: ()=> void;
    baseURL?: string
}


export default function OneDrivePicker({onFilePicked, onCancel, baseURL="https://onedrive.live.com/picker"}:PickerProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string|null>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const portRef = useRef<MessagePort | null>(null)
    const tokenRef = useRef<string | null>(null)


    useEffect(()=>{
        let isMounted = true

        const initPicker = async ()=>{
        try{
            const { data } = await get_access_token()
            const accessToken = data.access_token
            tokenRef.current(accessToken)

            if(!isMounted) {
                return
            }

            const channelId = crypto.randomUUID()
            const options = {
                sdk: '8.0',
                entry: { oneDrive: { files: {} } },
                authentication: {},
                messaging: {
                origin: window.location.origin,
                channelId: channelId,
                },
                selection: {mode: 'single'},
                typesAndSources: {
                    mode: "files",
                    pivots: {oneDrive: true, recent: true},
                    filters: ['.h5', ".hdf5"]
                }
            }

            const iframe = iframeRef.current;
            if(!iframe || !iframe.contentWindow){
                return
            }


            const win = iframe.contentWindow
            const query = new URLSearchParams({
                filePicker: JSON.stringify(options)
            })
            const url = `${baseURL}/_layouts/15/FilePicker.aspx?${query}`

            const form = win.document.createElement('form')
            form.setAttribute('action', url)
            form.setAttribute('method', 'POST')
            
            const tokenInput = win.document.createElement('input')
            tokenInput.setAttribute('type', 'hidden');
            tokenInput.setAttribute('name', 'access_token')
            tokenInput.setAttribute('value', accessToken)
            
            form.appendChild(tokenInput)
            win.document.body.appendChild(form)
            form.submit()

            const handshakeListener = (event: MessageEvent) => {
                if (event.source === win && event.data.type === 'initialize' && event.data.channelId === channelId) {
                    const port = event.ports[0]
                    portRef.current = port

                    port.addEventListener('message', handlePickerCommand)
                    port.start()
                    port.postMessage({ type: 'activate' })
                    setLoading(false)
                }
            };

            window.addEventListener('message', handshakeListener)

            return () => {
            window.removeEventListener('message', handshakeListener)
            if (portRef.current) portRef.current.close()
            }

        }
        catch(err){
            console.error("Failed to start OneDrive file picker", err)
            setError("Failed to auhtenticate with Microsoft, please link your account again")
        }
        }

        initPicker();
        return () => {
            isMounted = false;
        };
    }, [baseURL])

    
// 5. Intercept Commands sent by Microsoft inside the iframe
  const handlePickerCommand = (event: MessageEvent) => {
    const message = event.data;
    const port = portRef.current;
    if (!port || message.type !== 'command') return;

    const commandData = message.data;
    port.postMessage({ type: 'acknowledge', id: message.id });

    switch (commandData.command) {
      case 'authenticate':
        // Microsoft requests the token verification
        port.postMessage({
          type: 'result',
          id: message.id,
          data: { result: 'token', token: tokenRef.current },
        });
        break;
        
      case 'pick':
        // The researcher selected their HDF5 file
        port.postMessage({
          type: 'result',
          id: message.id,
          data: { result: 'success' },
        });
        
        // Extract Microsoft's unique file ID and filename
        const selectedFile = commandData.items[0];
        onFilePicked(selectedFile.id, selectedFile.name);
        break;
        
      case 'close':
        onCancel();
        break;
        
      default:
        port.postMessage({
          result: 'error',
          error: { code: 'unsupportedCommand', message: commandData.command },
          isExpected: true,
        });
        break;
    }
  };

  if (error) {
    return <div className="text-destructive font-medium p-4">{error}</div>;
  }

  return (
    <div className="relative w-full h-[600px] bg-card border border-border rounded-md overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader size="lg" centered />
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        title="OneDrive File Picker"
      />
    </div>
  );
}
