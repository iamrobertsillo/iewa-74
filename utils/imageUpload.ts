/**
 * Upload a tile image to the server
 * @param fileOrBlob - The image file or blob to upload
 * @param row - The row coordinate of the tile
 * @param col - The column coordinate of the tile
 * @returns The public URL of the uploaded image
 */
export async function uploadTileImage(
  fileOrBlob: File | Blob,
  row: number,
  col: number
): Promise<string> {
  const formData = new FormData();

  // Convert Blob to File if necessary
  if (fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)) {
    const file = new File([fileOrBlob], `tile_${row}_${col}.png`, { type: 'image/png' });
    formData.append('file', file);
  } else {
    formData.append('file', fileOrBlob);
  }

  formData.append('row', row.toString());
  formData.append('col', col.toString());

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.imageUrl;
}
