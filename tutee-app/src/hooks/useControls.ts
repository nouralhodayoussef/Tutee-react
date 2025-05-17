// useControls.ts
import { useState, useEffect } from 'react';

export const useControls = () => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    const mic = sessionStorage.getItem('micEnabled');
    const cam = sessionStorage.getItem('camEnabled');

    setMicOn(mic !== 'false');
    setCamOn(cam !== 'false');
  }, []);

  return { micOn, setMicOn, camOn, setCamOn };
};
