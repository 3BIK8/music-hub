import { useContext } from "react";
import { PlayerContext } from "../../context/PlayerContextV2";
import "./QueueView.css";

export default function QueueView() {
  const { queue, currentSongId, playSongBySongId, getId } = useContext(PlayerContext);
  return (
    <div className="QueView">
      <h3 style={{ marginBottom: 10 }}>Queue</h3>
      {queue.map((song, index) => {
        const id = getId(song);
        return (
          <div key={id} onClick={() => playSongBySongId(id)} style={{
            padding: "8px", marginBottom: "5px", cursor: "pointer",
            background: id === currentSongId ? "#1db954" : "#1a1a1a", borderRadius: "6px",
          }}>
            <div style={{ fontSize: "13px" }}>{index + 1}. {song.title}</div>
          </div>
        );
      })}
    </div>
  );
}
