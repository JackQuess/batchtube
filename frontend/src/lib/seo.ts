interface SeoMeta {
  title: string;
  description: string;
}

function upsertMetaTag(name: string, content: string) {
  const existing = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (existing) {
    existing.content = content;
    return;
  }
  const tag = document.createElement('meta');
  tag.name = name;
  tag.content = content;
  document.head.appendChild(tag);
}

export function applySeoMeta(meta: SeoMeta) {
  document.title = meta.title;
  upsertMetaTag('description', meta.description);
}

