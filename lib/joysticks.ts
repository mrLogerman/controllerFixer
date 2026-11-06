export type JoystickKey = "traditional" | "hallEffect" | "tmr";

export type JoystickType = {
  key: JoystickKey;
  name: string;
  tag: string;
  copy: string;
};

export const joystickTypes: JoystickType[] = [
  {
    key: "traditional",
    name: "Traditional",
    tag: "Stock",
    copy: "The module almost every controller ships with. A contact arm scrapes across a carbon track to measure movement, and that track slowly wears away. This is where stick drift comes from.",
  },
  {
    key: "hallEffect",
    name: "Hall Effect",
    tag: "Upgrade",
    copy: "Measures a magnet instead of touching anything. With no contact there is no surface left to wear out, so these modules hold their accuracy for years rather than months.",
  },
  {
    key: "tmr",
    name: "TMR",
    tag: "Newest",
    copy: "The latest magnetic sensor. Contactless like Hall Effect, but more sensitive and lighter on battery, so small stick movements register more precisely.",
  },
];

// Accepts a full YouTube URL or a bare ID and returns the 11-character ID.
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  if (/^[\w-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const param = url.searchParams.get("v");
      if (param && /^[\w-]{11}$/.test(param)) return param;

      const match = url.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (match) return match[2];
    }
  } catch {
    return null;
  }

  return null;
}
