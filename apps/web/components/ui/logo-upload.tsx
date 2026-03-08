'use client';

import { useRef, useState } from 'react';

interface LogoUploadProps {
  value: string;          // current logoUrl
  onChange: (url: string) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/uploads', { method: 'POST', body: fd });
    const data = await res.json();

    if (res.ok) {
      onChange(data.data.url);
    } else {
      setError(data.error ?? 'فشل رفع الصورة');
    }
    setUploading(false);
    // reset so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">شعار الأكاديمية</label>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
          {value ? (
            <img src={value} alt="شعار" className="w-16 h-16 object-cover rounded-full" />
          ) : (
            <span className="text-2xl">🏟️</span>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {uploading ? 'جارٍ الرفع...' : value ? '🔄 تغيير الشعار' : '📁 رفع صورة'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — أقل من 3 ميجابايت</p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-red-500 hover:text-red-700"
          >
            ✕ حذف
          </button>
        )}
      </div>
    </div>
  );
}
