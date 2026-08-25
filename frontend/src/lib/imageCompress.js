export async function compressImage(file, { maxDim = 1024, quality = 0.8 } = {}) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  )
}

export function isValidImage(file) {
  if (!file) return false
  if (file.size > 5 * 1024 * 1024) return false
  if (!file.type.startsWith('image/')) return false
  return true
}
