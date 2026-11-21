import { type ReactNode } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

import { openExternal } from '@/lib/tauri/ntfy'
import { safeLink } from '@/utils/safeLink'

type Props = { content: string }

const inlinePattern =
  /(!?\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*\n]+)\*|_([^_\n]+)_|~~([^~]+)~~)/g

function inline(text: string, prefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const matches = new RegExp(inlinePattern.source, 'g')

  let cursor = 0
  let match = matches.exec(text)

  while (match !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))
    const key = `${prefix}-${match.index}`

    if (match[2] != null && match[3] != null) {
      const url = match[3]

      if (!safeLink(url)) {
        nodes.push(match[0])
      } else if (match[0].startsWith('!')) {
        nodes.push(
          <Image
            alt={match[2]}
            className="my-2 max-h-72 max-w-full rounded-md object-contain"
            key={key}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={url}
          />
        )
      } else {
        nodes.push(
          <button
            className="cursor-pointer break-all text-left text-primary underline underline-offset-2"
            key={key}
            onClick={() => void openExternal(url).catch((error) => toast.error(String(error)))}
            type="button"
          >
            {match[2]}
          </button>
        )
      }
    } else if (match[4] != null || match[5] != null) {
      nodes.push(<strong key={key}>{inline(match[4] ?? match[5], key)}</strong>)
    } else if (match[6] != null) {
      nodes.push(
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]" key={key}>
          {match[6]}
        </code>
      )
    } else if (match[7] != null || match[8] != null) {
      nodes.push(<em key={key}>{inline(match[7] ?? match[8], key)}</em>)
    } else if (match[9] != null) {
      nodes.push(<del key={key}>{inline(match[9], key)}</del>)
    }

    cursor = matches.lastIndex
    match = matches.exec(text)
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

export function Markdown({ content }: Props) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const nodes: ReactNode[] = []

  for (let i = 0; i < lines.length; ) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }

    if (/^\s*```/.test(line)) {
      const code: string[] = []
      const key = i++
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++])
      if (i < lines.length) i++
      nodes.push(
        <pre
          className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-[10px]"
          key={key}
        >
          <code>{code.join('\n')}</code>
        </pre>
      )
      continue
    }

    if (/^\s*([-*_]\s*){3,}$/.test(line)) {
      nodes.push(<hr className="my-3 border-border" key={i++} />)
      continue
    }

    if (
      i + 1 < lines.length &&
      line.includes('|') &&
      /^\s*\|?\s*:?-{3,}:?(\s*\|\s*:?-{3,}:?)*\s*\|?\s*$/.test(lines[i + 1])
    ) {
      const start = i
      const split = (value: string) =>
        value
          .replace(/^\s*\||\|\s*$/g, '')
          .split('|')
          .map((cell) => cell.trim())
      const headings = split(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim() && lines[i].includes('|'))
        rows.push(split(lines[i++]))
      nodes.push(
        <div className="my-2 overflow-x-auto" key={start}>
          <table className="w-full border-collapse text-left text-[10px]">
            <thead>
              <tr>
                {headings.map((cell, col) => (
                  <th className="border border-border p-1.5" key={col}>
                    {inline(cell, `th-${start}-${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {headings.map((_, col) => (
                    <td className="border border-border p-1.5" key={col}>
                      {inline(row[col] ?? '', `td-${start}-${index}-${col}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line)

    if (heading) {
      nodes.push(
        <div className="mb-1 mt-2 font-semibold text-foreground" key={i++}>
          {inline(heading[2], `h${i}`)}
        </div>
      )
      continue
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: ReactNode[] = []
      const start = i
      const pattern = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/

      while (i < lines.length) {
        const item = pattern.exec(lines[i])
        if (!item) break

        items.push(<li key={i}>{inline(item[1], `li${i}`)}</li>)
        i++
      }
      nodes.push(
        ordered ? (
          <ol className="my-2 list-decimal space-y-1 pl-5" key={start}>
            {items}
          </ol>
        ) : (
          <ul className="my-2 list-disc space-y-1 pl-5" key={start}>
            {items}
          </ul>
        )
      )
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const quoted: string[] = []
      const start = i

      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoted.push(lines[i++].replace(/^\s*>\s?/, ''))
      }

      nodes.push(
        <blockquote className="my-2 border-l-2 border-border pl-3 italic" key={start}>
          {quoted.map((text, index) => (
            <p key={index}>{inline(text, `quote-${start}-${index}`)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    const paragraph: string[] = []
    const start = i

    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s+|\s*```|\s*[-*+]\s+|\s*\d+\.\s+|\s*>\s?)/.test(lines[i])
    ) {
      paragraph.push(lines[i++])
    }

    if (paragraph.length === 0) {
      paragraph.push(lines[i++])
    }

    nodes.push(
      <p className="my-1 whitespace-pre-wrap" key={start}>
        {inline(paragraph.join('\n'), `p${start}`)}
      </p>
    )
  }

  return (
    <div className="mt-1.5 text-[11px] leading-[1.8] wrap-anywhere text-muted-foreground">
      {nodes}
    </div>
  )
}
