import "./Volume.css";

export default function Volume({ volume, setVolume }) {
  return (
    <div className="volume-container">
      🔊
      <input
        type="range"
        min="0"
        max="100"
        className="volume-slider"
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
}
