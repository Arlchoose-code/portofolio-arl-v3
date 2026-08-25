/**
 * Client-Side HEIC/HEIF Image Conversion Utility
 * Converts Apple iOS HEIC/HEIF photos to high-quality JPEG before upload
 */

export async function ensureJpegIfHeic(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

  if (!isHeic) return file;

  try {
    const heic2anyModule = await import('heic2any');
    const heic2any = (heic2anyModule as any).default || heic2anyModule;

    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([singleBlob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('HEIC to JPEG conversion encountered an issue, passing original file:', err);
    return file;
  }
}
