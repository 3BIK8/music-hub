import { useState } from "react";
import { formatTime } from "../../utils/formatTime";
import "./ProgressBar.css";

export default function ProgressBar({ uiProgress, duration, onSeek }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleSeek = (clientX, rect) => {
    if (!duration) return 0;

    const percent = Math.min(
      Math.max((clientX - rect.left) / rect.width, 0),
      1,
    );

    return percent * duration;
  };

  const percent = duration ? (uiProgress / duration) * 100 : 0;

  return (
    <>
      {/* TIME */}
      <div className="progress-time">
        {formatTime(uiProgress)} / {formatTime(duration)}
      </div>

      {/* BAR */}
      <div
        className="progress-container"
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setIsDragging(true);

          const move = (ev) => {
            const time = handleSeek(ev.clientX, rect);
            if (onSeek) onSeek(time);
          };

          const up = (ev) => {
            const time = handleSeek(ev.clientX, rect);
            if (onSeek) onSeek(time);
            setIsDragging(false);

            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
          };

          window.addEventListener("mousemove", move);
          window.addEventListener("mouseup", up);
        }}
      >
        {/* PROGRESS */}
        <div className="progress-fill" style={{ width: `${percent}%` }} />

        {/* HANDLE */}
        <div className="progress-handle" style={{ left: `${percent}%` }} />
      </div>
    </>
  );
}
