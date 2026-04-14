export function formatDuration(iso) {
  const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);

  const minutes = parseInt(match[1] || 0);
  const seconds = parseInt(match[2] || 0);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
