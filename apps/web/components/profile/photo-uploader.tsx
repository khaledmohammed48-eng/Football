'use client';

import { useRef, useState } from 'react';

interface PhotoUploaderProps {
  currentPhotoUrl?: string | null;
  name?: string | null;
  /** Called after the photo is successfully saved */
  onPhotoUpdated?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A reusable photo uploader component.
 * Uploads to /api/upload then saves via PUT /api/profile/photo.
 * Works for all roles (ADMIN, COACH, PLAYER).
 */
export function PhotoUploader({ currentPhotoUrl, name, onPhotoUpdated, size = 'md' }: PhotoUploaderProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizes = {
    sm: { container: 'w-16 h-16', text: 'text-xl', btn: 'text-xs px-2 py-1' },
    md: { container: 'w-24 h-24', text: 'text-4xl', btn: 'text-xs px-3 py-1.5' },
    lg: { container: 'w-32 h-32', text: 'text-5xl', btn: 'text-sm px-4 py-2' },
  };
  const sz = sizes[size];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setMsg({ type: 'error', text: 'يرجى اختيار صورة JPEG أو PNG أو WebP فقط' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'حجم الصورة يجب أن يكون أقل من 5 ميغابايت' });
      return;
    }

    setUploading(true);
    setMsg(null);
    try {
      // Step 1: Upload file
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setMsg({ type: 'error', text: uploadData.error ?? 'فشل رفع الصورة' });
        return;
      }

      // Step 2: Save URL to profile
      const saveRes = await fetch('/api/profile/photo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: uploadData.url }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        setMsg({ type: 'error', text: saveData.error ?? 'فشل حفظ الصورة' });
        return;
      }

      setPhotoUrl(uploadData.url);
      setMsg({ type: 'success', text: 'تم تحديث الصورة الشخصية ✅' });
      onPhotoUpdated?.(uploadData.url);
    } catch {
      setMsg({ type: 'error', text: 'حدث خطأ غير متوقع' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('')
    : '👤';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar */}
      <div
        className={`${sz.container} rounded-full bg-green-100 flex items-center justify-center overflow-hidden border-2 border-green-200 cursor-pointer relative group`}
        onClick={() => !uploading && inputRef.current?.click()}
        title="اضغط لتغيير الصورة"
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name ?? 'صورة'} className="w-full h-full object-cover" />
        ) : (
          <span className={sz.text}>{initials.length > 1 ? initials : '👤'}</span>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-lg">📷</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`${sz.btn} bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg font-medium transition`}
      >
        {uploading ? 'جارٍ الرفع...' : photoUrl ? '🔄 تغيير الصورة' : '📷 رفع صورة'}
      </button>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Status message */}
      {msg && (
        <p className={`text-xs text-center max-w-[180px] ${msg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
