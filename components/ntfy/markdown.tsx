'use client'

import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

import { openExternal } from '@/lib/tauri/ntfy'
import { safeLink } from '@/utils/safeLink'

type Props = {
  content: string
}

export function Markdown({ content }: Props) {
  return (
    <div className="wrap-anywhere text-[11px] leading-[1.8] text-muted-foreground [&_h1]:my-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_code]:font-mono [&_img]:my-2 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-md [&_img]:object-contain [&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_th]:border [&_th]:p-2 [&_td]:border [&_td]:p-2">
      <ReactMarkdown
        components={{
          a: ({ href, title, children }) =>
            safeLink(href) ? (
              <button
                className="cursor-pointer text-left text-primary underline underline-offset-2"
                onClick={() => void openExternal(href).catch((error) => toast.error(String(error)))}
                title={title}
                type="button"
              >
                {children}
              </button>
            ) : (
              <span>{children}</span>
            ),
        }}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml
        urlTransform={(url) => (safeLink(url) ? url : '')}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
