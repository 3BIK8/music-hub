import { useContext, useEffect, useRef, useState } from "react";
import { PlayerContext } from "../../context/PlayerContext";
import Controls from "./Controls";
import Volume from "./Volume";
import ProgressBar from "./ProgressBar";
import "./Player.css";

export default function Player() {
  const { queue, currentIndex, setCurrentIndex, setIsPlaying, isPlaying } =
    useContext(PlayerContext);

  const audioRef = useRef(null);

  const [volume, setVolume] = useState(50);
  const [uiProgress, setUiProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const song = queue[currentIndex];

  // 🎧 LOAD + PLAY / PAUSE
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;

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
  }, [song, isPlaying, setIsPlaying]);

  // ⏱ EVENTS
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setUiProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    const handleEnded = () => {
      setCurrentIndex((i) => (i < queue.length - 1 ? i + 1 : 0));
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [queue.length, setCurrentIndex, setIsPlaying]);

  // 🔊 VOLUME
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // 🎯 SEEK
  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setUiProgress(time);
    }
  };

  return (
    <div className="player-container">
      <div className="player-title">🎵 {song?.title || "No song selected"}</div>

      <audio ref={audioRef} crossOrigin="anonymous" />

      <div className="player-controls">
        <Controls
          isPlaying={isPlaying}
          onPrev={() => setCurrentIndex((i) => (i > 0 ? i - 1 : 0))}
          onPlayPause={() => {
            if (!audioRef.current) return;
            isPlaying ? audioRef.current.pause() : audioRef.current.play();
          }}
          onNext={() =>
            setCurrentIndex((i) => (i < queue.length - 1 ? i + 1 : i))
          }
        />
      </div>

      <div className="player-progress">
        <ProgressBar
          uiProgress={uiProgress}
          duration={duration}
          onSeek={handleSeek}
        />
      </div>

      <div className="player-volume">
        <Volume volume={volume} setVolume={setVolume} />
      </div>
    </div>
  );
}
