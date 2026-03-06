import { useState, useEffect, useRef } from 'react';

export function useSSE(vmId) {
  const [steps, setSteps] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    if (!vmId) return;

    const es = new EventSource(`/api/vms/${vmId}/sse`, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSteps(prev => [...prev, data]);
        setStatus(data.status);
        if (data.status === 'ready' || data.status === 'error') {
          es.close();
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      setError('Connection lost');
      setStatus('error');
      es.close();
    };

    return () => {
      es.close();
    };
  }, [vmId]);

  return { steps, status, error };
}
