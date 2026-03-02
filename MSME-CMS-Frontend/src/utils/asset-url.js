export const resolveAssetUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  const base = (import.meta.env.VITE_DOCS_URL || '').replace(/\/$/, '');
  const assetPath = String(value).replace(/^\//, '');
  return base ? `${base}/${assetPath}` : `/${assetPath}`;
};
