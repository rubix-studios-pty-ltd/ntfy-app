export function validAttachment(file: File): boolean {
  return /\.(png|jpe?g|gif|webp|avif|bmp|heic|heif|tiff?|mp4|webm|mov|m4v)$/i.test(file.name)
}
