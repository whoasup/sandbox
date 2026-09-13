/** Trigger a browser download for a Blob without leaving a dangling URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Sanitize `{projectName}-{floorName}.{ext}` for download filenames. */
export function exportFilename(projectName: string, floorName: string, ext: string): string {
  const safe = (value: string) => value.replace(/[^\w\-а-яА-ЯёЁ]+/gi, '_').slice(0, 48) || 'export';
  const cleanedExt = ext.replace(/^\./, '');
  return `${safe(projectName)}-${safe(floorName)}.${cleanedExt}`;
}

/** `{project}-{floor}-360.png` for equirect / cubemap exports. */
export function export360Filename(projectName: string, floorName: string): string {
  const safe = (value: string) => value.replace(/[^\w\-а-яА-ЯёЁ]+/gi, '_').slice(0, 48) || 'export';
  return `${safe(projectName)}-${safe(floorName)}-360.png`;
}
