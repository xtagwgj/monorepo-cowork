import type { ChatCardType, ChatMessage } from "./types";

const TYPES: ChatCardType[] = ["text", "image", "file", "system", "todo", "quote"];

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomWords(rng: () => number, min: number, max: number): string {
  const pool = [
    "alpha", "beta", "gamma", "delta", "latency", "message", "stream", "render", "window", "virtual",
    "history", "token", "scroll", "observer", "anchor", "buffer", "card", "layout", "queue", "batch"
  ];
  const count = min + Math.floor(rng() * (max - min + 1));
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    parts.push(pool[Math.floor(rng() * pool.length)]);
  }
  return parts.join(" ");
}

export function createMockMessage(seq: number, seed = 2026): ChatMessage {
  const rng = mulberry32(seed + seq * 13);
  const type = TYPES[Math.floor(rng() * TYPES.length)] ?? "text";
  const timestamp = Date.now() - (600 - seq) * 30_000;

  if (type === "text") {
    return {
      id: `msg-${seq}`,
      seq,
      type,
      timestamp,
      payload: {
        title: `Text #${seq}`,
        body: randomWords(rng, 25, 140)
      }
    };
  }

  if (type === "image") {
    return {
      id: `msg-${seq}`,
      seq,
      type,
      timestamp,
      payload: {
        title: `Image #${seq}`,
        ratio: 0.55 + rng() * 0.7,
        caption: randomWords(rng, 10, 35)
      }
    };
  }

  if (type === "file") {
    return {
      id: `msg-${seq}`,
      seq,
      type,
      timestamp,
      payload: {
        fileName: `report-${seq}.pdf`,
        size: `${(0.4 + rng() * 19).toFixed(1)} MB`,
        desc: randomWords(rng, 8, 30)
      }
    };
  }

  if (type === "todo") {
    const count = 2 + Math.floor(rng() * 5);
    const items = Array.from({ length: count }, (_, i) => ({
      id: `${seq}-${i}`,
      done: rng() > 0.5,
      text: randomWords(rng, 3, 9)
    }));
    return {
      id: `msg-${seq}`,
      seq,
      type,
      timestamp,
      payload: {
        title: `Todo #${seq}`,
        items
      }
    };
  }

  if (type === "quote") {
    return {
      id: `msg-${seq}`,
      seq,
      type,
      timestamp,
      payload: {
        quote: randomWords(rng, 18, 55),
        author: `user-${Math.floor(rng() * 10_000)}`
      }
    };
  }

  return {
    id: `msg-${seq}`,
    seq,
    type: "system",
    timestamp,
    payload: {
      level: rng() > 0.5 ? "info" : "warning",
      content: randomWords(rng, 8, 24)
    }
  };
}

export function createMockRange(fromSeq: number, toSeq: number, seed = 2026): ChatMessage[] {
  const list: ChatMessage[] = [];
  for (let seq = fromSeq; seq <= toSeq; seq += 1) {
    list.push(createMockMessage(seq, seed));
  }
  return list;
}
