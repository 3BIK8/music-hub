import { useEffect, useRef, useState } from "react";

export default function useYouTubePlayer({
  song,
  setCurrentIndex,
  setIsPlaying,
  isPlaying,
  queueLength,
}) {
  const playerRef = useRef(null);
  const ytPlayer = useRef(null);
  const intervalRef = useRef(null);

  const [uiProgress, setUiProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const getId = (url) => url?.match(/v=([^&]+)/)?.[1];

  const loadYouTubeAPI = () =>
    new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => resolve();
    });

  useEffect(() => {
    let player;

    const init = async () => {
      await loadYouTubeAPI();

      player = new window.YT.Player(playerRef.current, {
        height: "1",
        width: "1",
        videoId: song ? getId(song.url) : "",
        playerVars: { playsinline: 1 },
        events: {
          onReady: (event) => {
            ytPlayer.current = event.target;

            intervalRef.current = setInterval(() => {
              if (!ytPlayer.current) return;

              const current = ytPlayer.current.getCurrentTime();
              const dur = ytPlayer.current.getDuration();

              setUiProgress(current);

              if (dur && current >= dur - 0.5) {
                setCurrentIndex((i) => (i < queueLength - 1 ? i + 1 : 0));
              }
            }, 250);
          },

          onStateChange: (event) => {
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) setIsPlaying(false);
          },
        },
      });
    };

    init();

    return () => {
      player?.destroy();
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ytPlayer.current || !song) return;

    const id = getId(song.url);
    const current = ytPlayer.current.getVideoData?.()?.video_id;

    if (id === current) return;

    if (isPlaying) {
      ytPlayer.current.loadVideoById(id);
      ytPlayer.current.playVideo();
    } else {
      ytPlayer.current.cueVideoById(id);
    }

    setUiProgress(0);

    const wait = setInterval(() => {
      const d = ytPlayer.current?.getDuration();
      if (d) {
        setDuration(d);
        clearInterval(wait);
      }
    }, 300);

    return () => clearInterval(wait);
  }, [song, isPlaying]);

  return {
    playerRef,
    ytPlayer,
    uiProgress,
    setUiProgress,
    duration,
  };
}
