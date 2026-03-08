'use client';

import { useState, useEffect, useCallback } from 'react';

interface Banner { url: string; title?: string; link?: string; }

export function BannersCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch('/api/academy/banners')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) setBanners(d);
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [banners.length, next]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  const inner = (
    <div className="relative w-full rounded-xl overflow-hidden bg-gray-900" style={{ aspectRatio: '4/1', minHeight: 80, maxHeight: 160 }}>
      <img src={banner.url} alt={banner.title ?? 'إعلان'} className="w-full h-full object-cover" />
      {banner.title && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-2">
          <p className="text-white text-sm font-medium truncate">{banner.title}</p>
        </div>
      )}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, i) => (
            <button key={i} onClick={(e) => { e.preventDefault(); setCurrent(i); }}
              className={`w-1.5 h-1.5 rounded-full transition ${i === current ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-6">
      {banner.link
        ? <a href={banner.link} target="_blank" rel="noopener noreferrer">{inner}</a>
        : inner}
    </div>
  );
}
