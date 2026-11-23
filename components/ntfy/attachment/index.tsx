'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { validAttachment } from '@/utils/validAttachment'

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

type Props = {
  disabled: boolean
  file: File | null
  onChange: (file: File | null) => void
  onError: (message: string) => void
}

export function Attachment({ disabled, file, onChange, onError }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const select = (next: File | undefined) => {
    if (!next) return

    if (!validAttachment(next)) {
      onChange(null)
      onError('Choose an image or video file')
      return
    }
    if (next.size === 0 || next.size > MAX_ATTACHMENT_BYTES) {
      onChange(null)
      onError('Attachments must be between 1 byte and 15 MB')
      return
    }
    onError('')
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium">Attachment</span>

      <input
        accept="image/*,video/*,.mov,.m4v"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          select(event.target.files?.[0])
          event.target.value = ''
        }}
        ref={input}
        type="file"
      />

      <button
        className={`flex min-h-25 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-3 text-center transition-colors ${dragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragging(false)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!disabled) select(event.dataTransfer.files[0])
        }}
        type="button"
      >
        <ImagePlus aria-hidden="true" className="size-5 text-muted-foreground" />
        <span className="text-[11px]">Drop an image or video here, or click to browse</span>
        <span className="text-[10px] text-muted-foreground">
          One file per message, maximum 15 MB
        </span>
      </button>

      {file && (
        <div className="flex items-center gap-3 rounded-md border border-border p-2 text-[11px]">
          {preview && file.type.startsWith('image/') && (
            // biome-ignore lint/performance/noImgElement: local object URL preview
            <img alt="Attachment preview" className="size-12 rounded object-cover" src={preview} />
          )}

          {preview && file.type.startsWith('video/') && (
            <video
              className="size-12 rounded object-cover"
              muted
              preload="metadata"
              src={preview}
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>

          <Button
            aria-label="Remove attachment"
            disabled={disabled}
            onClick={() => onChange(null)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
