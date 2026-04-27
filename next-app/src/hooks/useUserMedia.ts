'use client';

import { useState, useEffect } from 'react';

export const useUserMedia = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let internalStream: MediaStream | null = null;
    let isActive = true;

    async function enableStream() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if (!isActive) {
           // If the component unmounted before the promise resolved, kill the tracks.
           s.getTracks().forEach(t => t.stop());
           return;
        }

        internalStream = s;
        setStream(s);
        setError(null);
      } catch (err: any) {
        console.error("Camera access denied:", err);
        setError("Camera and Microphone access denied. Check your browser permissions.");
      } finally {
        if (isActive) setIsInitializing(false);
      }
    }
    
    enableStream();
    
    return () => {
      isActive = false;
      if (internalStream) {
        internalStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return { stream, error, isInitializing };
};
