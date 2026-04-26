import { useContext, useEffect, useRef, useState } from "react";
import { PlayerContext } from "../../context/PlayerContext";

import Controls from "./Controls";
import ProgressBar from "./ProgressBar";
import Volume from "./Volume";

import "./Player.css";

export default function Player() {
  const { currentSong, isPlaying, setIsPlaying, playNext, playPrev } =
    useContext(PlayerContext);

  const audioRef = useRef(null);

  const [volume, setVolume] = useState(50);
  const [uiProgress, setUiProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong?.audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setUiProgress(0);
      setDuration(0);
      if (isPlaying) setIsPlaying(false);
      return;
    }

    if (audio.src !== currentSong.audioUrl) {
      audio.src = currentSong.audioUrl;
      audio.load();
      setUiProgress(0);
      setDuration(0);
    }
  }, [currentSong?.songId, currentSong?.audioUrl, isPlaying, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audioUrl) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.songId, currentSong?.audioUrl, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setUiProgress(audio.currentTime || 0);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => playNext({ wrap: true });
    const onError = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [playNext, setIsPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, [volume]);

  if (!currentSong) return null;

  const canPlayCurrentSong = Boolean(currentSong.audioUrl);

  return (
    <div className="player-container">
      <audio ref={audioRef} />

      <div className="player-title">
        {currentSong.title}
        {!canPlayCurrentSong ? " (processing...)" : ""}
      </div>

      <div className="player-controls">
        <Controls
          isPlaying={isPlaying}
          onPlayPause={() => {
            if (!canPlayCurrentSong) return;

            const audio = audioRef.current;
            if (!audio) return;

            setIsPlaying((playing) => {
              if (playing) {
                audio.pause();
                return false;
              }

              audio.play().catch(() => setIsPlaying(false));
              return true;
            });
          }}
          onNext={() => playNext()}
          onPrev={() => playPrev()}
        />
      </div>

      <div className="player-progress">
        <ProgressBar
          uiProgress={uiProgress}
          duration={duration}
          onSeek={(time) => {
            if (!audioRef.current || !canPlayCurrentSong) return;
            audioRef.current.currentTime = time;
            setUiProgress(time);
          }}
        />
      </div>

      <div className="player-volume">
        <Volume volume={volume} setVolume={setVolume} />
      </div>
    </div>
  );
}
