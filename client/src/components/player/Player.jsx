import { useContext, useState, useEffect, useRef } from "react";
import { PlayerContext } from "../../context/PlayerContext";
import Controls from "./Controls";
import Volume from "./Volume";
import ProgressBar from "./ProgressBar";
import "./Player.css";

export default function Player() {
  const { queue, currentIndex, setCurrentIndex, setIsPlaying, isPlaying } =
    useContext(PlayerContext);

  const [volume, setVolume] = useState(50);
  const [uiProgress, setUiProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const song = queue[currentIndex];

  useEffect(() => {
    if (!audioRef.current || !song) return;

    const audio = audioRef.current;

    if (audio.src !== song.audioUrl) {
      audio.src = song.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(() => {
        console.log("Autoplay prevented");
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [song, isPlaying, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setUiProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsPlaying(true);
      }
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
  }, [currentIndex, queue.length, setCurrentIndex, setIsPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
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
            if (isPlaying) {
              audioRef.current?.pause();
            } else {
              audioRef.current?.play();
            }
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
