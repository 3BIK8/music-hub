import { useContext } from "react";
import { PlayerContext } from "../../context/PlayerContext";
import "./QueueView.css";

export default function QueueView() {
  const { queue, currentIndex, setCurrentIndex, setIsPlaying } =
    useContext(PlayerContext);

  return (
    <div className="QueView">
      <h3 style={{ marginBottom: 10 }}>Queue</h3>

      {queue.map((song, index) => (
        <div
          key={song._id}
          onClick={() => {
            setCurrentIndex(index);
            setIsPlaying(true);
          }}
          style={{
            padding: "8px",
            marginBottom: "5px",
            cursor: "pointer",
            background: index === currentIndex ? "#1db954" : "#1a1a1a",
            borderRadius: "6px",
          }}
        >
          <div style={{ fontSize: "13px" }}>
            {index + 1}. {song.title}
          </div>
        </div>
      ))}
    </div>
  );
}
