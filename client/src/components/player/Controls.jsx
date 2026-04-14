import "./Controls.css";

export default function Controls({ isPlaying, onPrev, onPlayPause, onNext }) {
  return (
    <div className="controls-container">
      <button className="controls-btn" onClick={onPrev}>
        ⏮
      </button>
      <button className="controls-btn" onClick={onPlayPause}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button className="controls-btn" onClick={onNext}>
        ⏭
      </button>
    </div>
  );
}
