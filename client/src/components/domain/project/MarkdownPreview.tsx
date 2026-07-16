import { type ReactNode, createElement, useMemo } from 'react';

// A small dependency-free markdown renderer. Covers the subset most notes use:
// ATX headings, unordered/ordered lists, fenced + inline code, blockquotes,
// bold/italic/links, and paragraphs. It renders to React elements (never raw
// HTML) so there is no injection surface.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Order matters: code spans first so their contents aren't re-parsed.
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('[')) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else {
      // single * or _ → emphasis
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'p'; text: string };

function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const body: string[] = [];
      i++;
      while (
        i < lines.length &&
        !(lines[i] ?? '').trimStart().startsWith('```')
      ) {
        body.push(lines[i] ?? '');
        i++;
      }
      i++; // consume closing fence
      blocks.push({ kind: 'code', text: body.join('\n') });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({
        kind: 'heading',
        level: heading[1]?.length ?? 1,
        text: heading[2] ?? '',
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('>')) {
        body.push((lines[i] ?? '').replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ kind: 'quote', text: body.join('\n') });
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Paragraph — gather consecutive non-blank, non-special lines
    const body: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i] ?? '') &&
      !(lines[i] ?? '').startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i] ?? '') &&
      !/^\s*\d+\.\s+/.test(lines[i] ?? '') &&
      !(lines[i] ?? '').trimStart().startsWith('```')
    ) {
      body.push(lines[i] ?? '');
      i++;
    }
    blocks.push({ kind: 'p', text: body.join(' ') });
  }

  return blocks;
}

const HEADING_CLASSES: Record<number, string> = {
  1: 'text-2xl font-bold mt-4 mb-2',
  2: 'text-xl font-bold mt-4 mb-2',
  3: 'text-lg font-semibold mt-3 mb-1.5',
  4: 'text-base font-semibold mt-3 mb-1.5',
  5: 'text-sm font-semibold mt-2 mb-1',
  6: 'text-sm font-semibold mt-2 mb-1',
};

export function MarkdownPreview({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  if (content.trim() === '') {
    return <p className="text-sm text-muted-foreground">Nothing to preview.</p>;
  }

  return (
    <div className="text-sm leading-relaxed text-foreground">
      {blocks.map((block, idx) => {
        const key = `b${idx}`;
        switch (block.kind) {
          case 'heading':
            return createElement(
              `h${block.level}`,
              { key, className: HEADING_CLASSES[block.level] },
              renderInline(block.text, key),
            );
          case 'code':
            return (
              <pre
                key={key}
                className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs"
              >
                <code>{block.text}</code>
              </pre>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                className="my-2 border-l-2 border-border pl-3 text-muted-foreground italic"
              >
                {renderInline(block.text, key)}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={key} className="my-2 list-disc space-y-0.5 pl-5">
                {block.items.map((item, j) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: list items are positional and may repeat
                  <li key={`${key}-${j}`}>
                    {renderInline(item, `${key}-${j}`)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="my-2 list-decimal space-y-0.5 pl-5">
                {block.items.map((item, j) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: list items are positional and may repeat
                  <li key={`${key}-${j}`}>
                    {renderInline(item, `${key}-${j}`)}
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={key} className="my-2">
                {renderInline(block.text, key)}
              </p>
            );
        }
      })}
    </div>
  );
}
