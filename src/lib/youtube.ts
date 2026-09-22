export function extractYouTubeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (/youtube\.com|youtu\.be/i.test(trimmed)) return trimmed;
  return null;
}

export interface OEmbedResult {
  title: string;
  authorName: string;
}

// Uses YouTube's public, key-less oEmbed endpoint to resolve a link's
// title/channel so we can match it against our local song library.
export async function resolveYouTubeTitle(
  url: string
): Promise<OEmbedResult | null> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      url
    )}&format=json`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title ?? "", authorName: data.author_name ?? "" };
  } catch {
    return null;
  }
}
