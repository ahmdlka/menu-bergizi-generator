import { Fragment, ReactNode } from "react";

// Lightweight markdown for chat replies.
// Supports: **bold**, *italic*, `code`, [link](url), bullet list (- / *), numbered list (1.),
// paragraphs (blank line), and single line breaks.

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text.trim());
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, i) => (
        <Fragment key={i}>{renderBlock(b)}</Fragment>
      ))}
    </div>
  );
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parseBlocks(src: string): Block[] {
  const lines = src.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", lines: para });
  }
  return blocks;
}

function renderBlock(b: Block): ReactNode {
  if (b.kind === "ul") {
    return (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        {b.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    );
  }
  if (b.kind === "ol") {
    return (
      <ol className="list-decimal pl-5 flex flex-col gap-1">
        {b.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ol>
    );
  }
  return (
    <p className="whitespace-pre-wrap">
      {b.lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(l)}
        </Fragment>
      ))}
    </p>
  );
}

// Inline parser — handles **bold**, *italic*, `code`, [text](url)
function renderInline(text: string): ReactNode {
  const tokens: ReactNode[] = [];
  // Order matters: bold before italic so ** doesn't get caught as *
  const regex =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) tokens.push(text.slice(last, m.index));
    if (m[1]) {
      tokens.push(<strong key={key++}>{m[2]}</strong>);
    } else if (m[3]) {
      tokens.push(<em key={key++}>{m[4]}</em>);
    } else if (m[5]) {
      tokens.push(
        <code key={key++} className="bg-[var(--mbg-bg)] px-1 rounded text-[0.85em]">
          {m[6]}
        </code>
      );
    } else if (m[7]) {
      tokens.push(
        <a
          key={key++}
          href={m[9]}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--mbg-primary)] underline"
        >
          {m[8]}
        </a>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) tokens.push(text.slice(last));
  return <>{tokens}</>;
}
