export function readAttachment(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string' || !result.includes(',')) {
        reject(new Error('Cannot read the attachment'))

        return
      }
      resolve(result.slice(result.indexOf(',') + 1))
    }

    reader.onerror = () => reject(new Error('Cannot read the attachment'))
    reader.readAsDataURL(file)
  })
}
