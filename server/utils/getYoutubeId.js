export const getYoutubeId = (url) => {
  const cleanedUrl = String(url || "").trim();
  if (!cleanedUrl) return null;

  let normalizedUrl = cleanedUrl;
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;

    if (hostname.includes("youtu.be")) {
      return pathname.slice(1) || null;
    }

    if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtube-nocookie.com")
    ) {
      if (pathname.startsWith("/watch")) {
        return parsedUrl.searchParams.get("v") || null;
      }

      if (pathname.startsWith("/shorts/") || pathname.startsWith("/embed/")) {
        return pathname.split("/")[2] || null;
      }
    }
  } catch (error) {
    // Fall back to regex extraction for non-standard formats.
  }

  const fallbackRegExp =
    /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/i;
  const match = cleanedUrl.match(fallbackRegExp);

  return match ? match[1] : null;
};
