'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@/components/ui';
import  axiosInstance  from '@/lib/api/axiosInstance';

interface OneDrivePickerProps {
  onFilePicked: (fileId: string, filename: string) => void;
  onCancel: () => void;
  baseUrl?: string; // user's SharePoint/OneDrive URL, e.g. "https://{tenant}-my.sharepoint.com"
}

export function OneDrivePicker({ onFilePicked, onCancel, baseUrl }: OneDrivePickerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const tokenRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePicker = async () => {
      try {
        const { data } = await axiosInstance.get('/api/py/onedrive/token');
        const accessToken = data.access_token;
        tokenRef.current = accessToken;

        if (!isMounted) return;

        const channelId = crypto.randomUUID();
        const pickerParams = {
          sdk: '8.0',
          entry: { oneDrive: { files: {} } },
          authentication: {},
          messaging: {
            origin: window.location.origin,
            channelId,
          },
          selection: { mode: 'single' },
          typesAndSources: {
            mode: 'files',
            pivots: { oneDrive: true, recent: true },
            filters: ['.h5', '.hdf5', '.pt3', '.csv'], // will need to implement furtther file checking beyond just file extension
          },
        };

        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;
        const win = iframe.contentWindow;

        const queryString = new URLSearchParams({
          filePicker: JSON.stringify(pickerParams),
        });
        const url = `${baseUrl}/_layouts/15/FilePicker.aspx?${queryString}`;

        // The picker endpoint expects the token in a POST body, not a header or
        // query param, so we build a throwaway form inside the iframe and submit
        // it there rather than just setting iframe.src.
        const form = win.document.createElement('form');
        form.setAttribute('action', url);
        form.setAttribute('method', 'POST');

        const tokenInput = win.document.createElement('input');
        tokenInput.setAttribute('type', 'hidden');
        tokenInput.setAttribute('name', 'access_token');
        tokenInput.setAttribute('value', accessToken);

        form.appendChild(tokenInput);
        win.document.body.appendChild(form);
        form.submit();

        // Once the picker's loaded it announces itself with an "initialize"
        // message and hands us a MessagePort — everything after this happens
        // over that port instead of window.postMessage.
        const handshakeListener = (event: MessageEvent) => {
          if (
            event.source === win &&
            event.data.type === 'initialize' &&
            event.data.channelId === channelId
          ) {
            const port = event.ports[0];
            portRef.current = port;

            port.addEventListener('message', handlePickerCommand);
            port.start();
            port.postMessage({ type: 'activate' });
            setLoading(false);
          }
        };

        window.addEventListener('message', handshakeListener);

        return () => {
          window.removeEventListener('message', handshakeListener);
          portRef.current?.close();
        };
      } catch (err) {
        console.error('Failed to initialize OneDrive Picker', err);
        setError('Failed to authenticate with OneDrive. Please refresh or relink your account.');
        setLoading(false);
      }
    };

    initializePicker();

    return () => {
      isMounted = false;
    };
  }, [baseUrl]);

  // Handles whatever the picker iframe asks for over the port — token
  // requests, the actual selection, or the user closing the dialog.
  const handlePickerCommand = (event: MessageEvent) => {
    const message = event.data;
    const port = portRef.current;
    if (!port || message.type !== 'command') return;

    const commandData = message.data;
    port.postMessage({ type: 'acknowledge', id: message.id });

    switch (commandData.command) {
      case 'authenticate':
        port.postMessage({
          type: 'result',
          id: message.id,
          data: { result: 'token', token: tokenRef.current },
        });
        break;

      case 'pick': {
        port.postMessage({
          type: 'result',
          id: message.id,
          data: { result: 'success' },
        });

        const selectedFile = commandData.items[0];
        onFilePicked(selectedFile.id, selectedFile.name);
        break;
      }

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