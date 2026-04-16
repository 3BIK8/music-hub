import { useContext, useRef, useEffect, useState } from "react";
import { PlayerContext } from "../../context/PlayerContext";

import Controls from "./Controls";
import ProgressBar from "./ProgressBar";
import Volume from "./Volume";

import "./Player.css";

export default function Player() {
  const { queue, currentIndex, setCurrentIndex, isPlaying, setIsPlaying } =
    useContext(PlayerContext);

  const audioRef = useRef(null);

  const [volume, setVolume] = useState(50);
  const [uiProgress, setUiProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const song = queue?.[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song?.audioUrl) return;

    if (audio.src !== song.audioUrl) {
      audio.src = song.audioUrl;
      audio.load();
      setUiProgress(0);
    }

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [song, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setUiProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);

    const onEnd = () => {
      setCurrentIndex((i) => (i < queue.length - 1 ? i + 1 : 0));
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [queue.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  if (!song) return null;

  return (
    <div className="player-container">
      <audio ref={audioRef} />

      <div className="player-title">{song.title}</div>

      <div className="player-controls">
        <Controls
          isPlaying={isPlaying}
          onPlayPause={() => {
            const audio = audioRef.current;
            if (!audio) return;

            setIsPlaying((p) => {
              if (p) audio.pause();
              else audio.play();
              return !p;
            });
          }}
          onNext={() =>
            setCurrentIndex((i) => (i < queue.length - 1 ? i + 1 : i))
          }
          onPrev={() => setCurrentIndex((i) => (i > 0 ? i - 1 : 0))}
        />
      </div>

      <div className="player-progress">
        <ProgressBar
          uiProgress={uiProgress}
          duration={duration}
          onSeek={(t) => {
            audioRef.current.currentTime = t;
            setUiProgress(t);
          }}
        />
      </div>

      <div className="player-volume">
        <Volume volume={volume} setVolume={setVolume} />
      </div>
    </div>
  );
}
