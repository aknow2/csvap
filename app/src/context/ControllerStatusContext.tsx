import React, { createContext, useEffect, useRef, useState } from 'react';
import type { VData } from './VDataContext';

type ControllerStatus = {
  state: 'loading' | 'available' | 'unavailable';
  settings: VData | null;
};

export const ControllerStatusContext = createContext<ControllerStatus>({
  state: 'loading',
  settings: null,
});

export const ControllerStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setControllerState] = useState<ControllerStatus['state']>('loading');
  const [settings, setSettings] = useState<VData | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestSettings = () => {
    setSettings(null);
    channelRef.current?.postMessage({ type: 'settings-request' });
    timeoutRef.current = setTimeout(() => {
      setControllerState('unavailable');
      setSettings(null);
    }, 500);
  };

  useEffect(() => {
    const channel = new BroadcastChannel('map-settings');
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === 'update-settings') {
        clearTimeout(timeoutRef.current!);
        setControllerState('available');
        setSettings(event.data.payload);
      }
    };
    requestSettings();

    return () => {
      channel.close();
    };
  }, []);


  return (
    <ControllerStatusContext.Provider value={{ state, settings }}>
      {children}
    </ControllerStatusContext.Provider>
  );
};

export const useControllerStatus = () => {
  const context = React.useContext(ControllerStatusContext);
  if (!context) {
    throw new Error('useControllerStatus must be used within a ControllerStatusProvider');
  }
  return context;
};
