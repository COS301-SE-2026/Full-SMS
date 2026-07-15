import {
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react'
import { ClusteringReq, ClusteringRes } from '@/types/analysis'
import axiosInstance from '@/lib/api/axiosInstance'

interface UseCeleryPollingOpts<ClusteringRes>{
    interval_ms?: number
    onSuccess?: (data: ClusteringRes)=>void
    onError?: (error: string) => void
}

export function UseCeleryPolling<RequestType, ResultType>(
    initUrl: string, getStatusUrl: (job_id: string) =>string, options: UseCeleryPollingOpts<ClusteringRes> = {}
){
    const [job_id, setJob_id] = useState<string|null>(null)
    const [error, setError] = useState<string|null>(null)
    const [result, setResult] = useState<ResultType| null>(null)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)

    //using a ref to keep the interval ID incase of a rerender or refresh
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const clearPolling = useCallback(() => {
    if (!pollIntervalRef.current) return; // nothing running, return
    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = null;
    }, []);

    // starts  the grouping/clustering analysis on the backend
    const execute = useCallback(async (payload: ClusteringReq) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
    const response = await axiosInstance.post(initUrl, payload)
    const data = response.data

    if (!data.task_id) {
        throw new Error('No task_id returned from api');
    }

    setJob_id(data.task_id); // useEffect below picks this up and starts polling the AHCA job

    } catch (err: any) {
        setError(err.message);
        setIsProcessing(false);
        options.onError?.(err.message);
        }
    }, [initUrl, options]);

    // polling loop - checks on the task until the AHCA is done and we get data back, failed, or give up waiting
    useEffect(() => {
    if (!job_id || !isProcessing) return;

    const checkStatus = async () => {
        try {
            const response = await axiosInstance.get(getStatusUrl(job_id))
            const data = response.data

        if (data.status === 'completed') {
            setResult(data.result);
            setIsProcessing(false);
            clearPolling();
            options.onSuccess?.(data.result);
        } else if (data.status === 'failed') {
        const message = data.error || 'Task failed during processing';
            setError(message);
            setIsProcessing(false);
            clearPolling();
            options.onError?.(message);
        }
        // still processing - just wait for the next tick
        } catch (err: any) {
            setError(err.message);
            setIsProcessing(false);
            clearPolling();
            options.onError?.(err.message);
        }
        };

    pollIntervalRef.current = setInterval(checkStatus, options.interval_ms || 3000);

    // don't leave the interval running if its unmounted during polling
    return () => clearPolling();
    }, [job_id, isProcessing, getStatusUrl, options, clearPolling]);

    return { execute, isProcessing, result, error, job_id };
}