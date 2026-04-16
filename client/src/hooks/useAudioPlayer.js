import { useRef, useEffect, useState } from "react";

export default function useAudioPlayer({ song, isPlaying, onEnd }) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioRef.current || !song) return;

    if (isPlaying) audioRef.current.play();
    else audioRef.current.pause();
  }, [isPlaying, song]);

  const handleTimeUpdate = () => {
    setProgress(audioRef.current.currentTime);
  };

  const handleLoaded = () => {
    setDuration(audioRef.current.duration);
  };

  return {
    audioRef,
    progress,
    duration,
    setProgress,
    handleTimeUpdate,
    handleLoaded,
  };
}
