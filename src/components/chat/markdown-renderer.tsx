'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Syntax highlighting (tiny, dependency-free)                         */
/* ------------------------------------------------------------------ */

const KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|import|export|from|default|class|extends|new|await|async|try|catch|finally|throw|typeof|instanceof|interface|type|enum|implements|public|private|protected|readonly|static|null|undefined|true|false|this|super|switch|case|break|continue|do|in|of|as|yield|delete|void)\b/;

const KEYWORDS_RE = new RegExp(KEYWORDS.source, 'g');

type Token = { text: string; cls: string };

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let rest = line;

  // strings (single, double, backtick) / comments / keywords / numbers
  const pattern =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\\\\.*|\b\\d+(\\.\\d+)?\b)/;

  let guard = 0;
  while (rest.length > 0 && guard < 50) {
    guard += 1;
    const m = pattern.exec(rest);
    if (!m || m.index === undefined) {
      tokens.push({ text: rest, cls: '' });
      break;
    }
    if (m.index > 0) {
      tokens.push({ text: rest.slice(0, m.index), cls: '' });
    }
    const tok = m[0];
    let cls = 'text-amber-600'; // numbers
    if (tok.startsWith('//') || tok.startsWith('#')) {
      cls = 'text-gray-400 italic';
    } else if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith('`')) {
      cls = 'text-emerald-700';
    }
    tokens.push({ text: tok, cls });
    rest = rest.slice(m.index + tok.length);
  }

  // Keyword pass over plain segments
  return tokens.flatMap((t) => {
    if (t.cls) return [t];
    const parts: Token[] = [];
    let last = 0;
    for (const km of t.text.matchAll(KEYWORDS_RE)) {
      const idx = km.index ?? 0;
      if (idx > last) parts.push({ text: t.text.slice(last, idx), cls: '' });
      parts.push({ text: km[0], cls: 'text-violet-600 font-medium' });
      last = idx + km[0].length;
    }
    if (last < t.text.length) parts.push({ text: t.text.slice(last), cls: '' });
    return parts;
  });
}

/* ------------------------------------------------------------------ */
/* Inline markdown                                                     */
/* ------------------------------------------------------------------ */

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // **bold**, *italic*, `code`, [text](url)
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(pattern)) {
    const idx = m.index ?? 0;
    if (idx > last) nodes.push(text.slice(last, idx));
    const tok = m[0];
    key += 1;
    if (tok.startsWith('**')) {
      nodes.push(
        <strong key={`b-${key}`} className="font-semibold text-gray-900">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith('`')) {
      nodes.push(
        <code
          key={`c-${key}`}
          className="rounded-md bg-gray-100/80 border border-gray-200/60 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-700"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith('[')) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (linkMatch) {
        nodes.push(
          <a
            key={`a-${key}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 underline underline-offset-2 decoration-emerald-300 hover:text-emerald-700 hover:decoration-emerald-500 transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      }
    } else {
      nodes.push(
        <em key={`i-${key}`} className="italic text-gray-600">
          {tok.slice(1, -1)}
        </em>
      );
    }
    last = idx + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* ------------------------------------------------------------------ */
/* Block renderer                                                      */
/* ------------------------------------------------------------------ */

type Block =
  | { kind: 'code'; lang: string; content: string[] }
  | { kind: 'table'; rows: string[][]; header: string[] }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'hr' }
  | { kind: 'para'; text: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    const fence = /^```(\w*)/.exec(line.trim());
    if (fence) {
      const lang = fence[1] || 'text';
      const content: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        content.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      blocks.push({ kind: 'code', lang, content });
      continue;
    }

    // Table
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const parseRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
      const header = parseRow(lines[i]);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    // Heading
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push({ kind: 'hr' });
      i += 1;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        q.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ kind: 'quote', lines: q });
      continue;
    }

    // Lists
    const bullet = /^\s*[-*]\s+/;
    const ordered = /^\s*\d+\.\s+/;
    if (bullet.test(line) || ordered.test(line)) {
      const isOrdered = ordered.test(line);
      const items: string[] = [];
      while (i < lines.length && (isOrdered ? ordered.test(lines[i]) : bullet.test(lines[i]))) {
        items.push(lines[i].replace(isOrdered ? ordered : bullet, ''));
        i += 1;
      }
      blocks.push({ kind: 'list', ordered: isOrdered, items });
      continue;
    }

    // Blank
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Paragraph (consume until blank line)
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4}\s|```|\||>|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: 'para', text: para.join(' ') });
  }

  return blocks;
}

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={cn('space-y-3.5 text-sm leading-relaxed text-zinc-800', className)}>
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h2 key={idx} className="text-base sm:text-lg font-bold text-zinc-950 pt-3 pb-1.5 border-b border-zinc-100">
                  {renderInlineMarkdown(block.text)}
                </h2>
              );
            }
            if (block.level === 2) {
              return (
                <h3 key={idx} className="text-sm sm:text-base font-bold text-zinc-900 pt-3 pb-1">
                  {renderInlineMarkdown(block.text)}
                </h3>
              );
            }
            if (block.level === 3) {
              return (
                <h4 key={idx} className="text-xs sm:text-sm font-semibold text-zinc-900 pt-2">
                  {renderInlineMarkdown(block.text)}
                </h4>
              );
            }
            return (
              <h5 key={idx} className="text-xs font-semibold uppercase tracking-wider text-zinc-600 pt-1.5">
                {renderInlineMarkdown(block.text)}
              </h5>
            );
          }
          case 'hr':
            return <hr key={idx} className="border-zinc-200/70 my-3" />;
          case 'code': {
            return (
              <div key={idx} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/90 shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-1.5 bg-zinc-100/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                    {block.lang}
                  </span>
                </div>
                <div className="border-l-2 border-emerald-500">
                  <pre className="overflow-x-auto p-3 text-[11.5px] leading-relaxed font-mono">
                    <code className="text-zinc-800">
                      {block.content.map((line, li) => (
                        <span key={li} className="block">
                          {tokenizeLine(line).map((tok, ti) => (
                            <span key={ti} className={tok.cls || undefined}>
                              {tok.text}
                            </span>
                          ))}
                        </span>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>
            );
          }
          case 'table':
            return (
              <div key={idx} className="overflow-x-auto rounded-lg border border-zinc-200 shadow-2xs my-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-800">
                      {block.header.map((cell, ci) => (
                        <th key={ci} className="px-3.5 py-2.5 text-left font-semibold text-zinc-800">
                          {renderInlineMarkdown(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-zinc-100 last:border-0 even:bg-zinc-50/50">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3.5 py-2.5 text-zinc-700 align-top leading-normal">
                            {renderInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul';
            return (
              <ListTag
                key={idx}
                className={cn(
                  'space-y-1.5 pl-5 text-zinc-700 text-xs sm:text-sm',
                  block.ordered ? 'list-decimal' : 'list-disc',
                  '[&>li::marker]:text-emerald-600 font-normal leading-relaxed'
                )}
              >
                {block.items.map((item, ii) => (
                  <li key={ii}>{renderInlineMarkdown(item)}</li>
                ))}
              </ListTag>
            );
          }
          case 'quote':
            return (
              <blockquote
                key={idx}
                className="border-l-[3px] border-emerald-500 bg-emerald-50/40 px-3.5 py-2.5 text-zinc-800 rounded-r-md text-xs sm:text-sm leading-relaxed"
              >
                {block.lines.map((l, li) => (
                  <p key={li}>{renderInlineMarkdown(l)}</p>
                ))}
              </blockquote>
            );
          case 'para':
          default:
            return (
              <p key={idx} className="text-zinc-700 text-xs sm:text-sm leading-relaxed">
                {renderInlineMarkdown(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
