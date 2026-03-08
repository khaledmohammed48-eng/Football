'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Banner { url: string; title?: string; link?: string; }
interface Academy { id: string; name: string; logoUrl?: string | null; city?: string | null; location?: string | null; banners: Banner[]; }

export default function AcademyProfilePage() {
  const router = useRouter();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);

  // Logo state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingBannerIdx, setUploadingBannerIdx] = useState<number | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const pendingBannerIdx = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/my-academy')
      .then((r) => r.json())
      .then((d) => {
        setAcademy(d);
        setBanners(Array.isArray(d.banners) ? d.banners : []);
        setLoading(false);
      });
  }, []);

  // ── Logo ──────────────────────────────────────────────────────────────────
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { setLogoMsg({ type: 'error', text: uploadData.error ?? 'فشل رفع الصورة' }); return; }

      const saveRes = await fetch('/api/admin/my-academy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: uploadData.url }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) { setLogoMsg({ type: 'error', text: saveData.error ?? 'فشل الحفظ' }); return; }

      setAcademy((prev) => prev ? { ...prev, logoUrl: saveData.logoUrl } : prev);
      setLogoMsg({ type: 'success', text: 'تم تحديث الشعار ✅' });
      router.refresh(); // update sidebar logo
    } catch {
      setLogoMsg({ type: 'error', text: 'حدث خطأ أثناء الرفع، حاول مرة أخرى' });
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  // ── Banners ───────────────────────────────────────────────────────────────
  function addBanner() {
    setBanners((prev) => [...prev, { url: '', title: '', link: '' }]);
  }

  function removeBanner(idx: number) {
    setBanners((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateBanner(idx: number, field: keyof Banner, value: string) {
    setBanners((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  }

  async function handleBannerImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const idx = pendingBannerIdx.current;
    if (!file || idx === null) return;
    setUploadingBannerIdx(idx);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        updateBanner(idx, 'url', data.url);
      } else {
        setBannerMsg({ type: 'error', text: data.error ?? 'فشل رفع الصورة' });
      }
    } catch {
      setBannerMsg({ type: 'error', text: 'حدث خطأ أثناء رفع الصورة' });
    } finally {
      setUploadingBannerIdx(null);
      pendingBannerIdx.current = null;
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  }

  function triggerBannerUpload(idx: number) {
    pendingBannerIdx.current = idx;
    bannerInputRef.current?.click();
  }

  async function saveBanners() {
    const valid = banners.filter((b) => b.url.trim());
    if (valid.length !== banners.length) {
      setBannerMsg({ type: 'error', text: 'يرجى رفع صورة لكل بانر قبل الحفظ' });
      return;
    }
    setBannerSaving(true);
    setBannerMsg(null);
    try {
      const res = await fetch('/api/admin/my-academy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: valid }),
      });
      const data = await res.json();
      if (!res.ok) { setBannerMsg({ type: 'error', text: data.error ?? 'فشل الحفظ' }); return; }
      setBanners(data.banners);
      setBannerMsg({ type: 'success', text: 'تم حفظ البانرات ✅' });
      router.refresh();
    } catch {
      setBannerMsg({ type: 'error', text: 'حدث خطأ أثناء الحفظ، حاول مرة أخرى' });
    } finally {
      setBannerSaving(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;
  if (!academy) return <div className="text-center py-16 text-red-400">لا توجد أكاديمية مرتبطة بحسابك</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">ملف الأكاديمية</h1>

      {/* Academy info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
          {academy.logoUrl
            ? <img src={academy.logoUrl} alt={academy.name} className="w-14 h-14 object-cover rounded-full" />
            : '🏟️'}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-lg">{academy.name}</div>
          {academy.city && <div className="text-sm text-gray-500">{academy.city}{academy.location ? ` — ${academy.location}` : ''}</div>}
        </div>
      </div>

      {/* Logo upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">شعار الأكاديمية</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
            {academy.logoUrl
              ? <img src={academy.logoUrl} alt="الشعار" className="w-20 h-20 object-cover" />
              : <span className="text-3xl">🏟️</span>}
          </div>
          <div>
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {logoUploading ? 'جارٍ الرفع...' : 'رفع شعار جديد'}
            </button>
            <p className="text-xs text-gray-400 mt-1">PNG أو JPG أو WebP — بحد أقصى 5 ميغابايت</p>
          </div>
        </div>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        {logoMsg && (
          <div className={`mt-3 text-sm rounded-lg px-3 py-2 ${logoMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {logoMsg.text}
          </div>
        )}
      </div>

      {/* Banners */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-700">البانرات الإعلانية</h2>
            <p className="text-xs text-gray-400 mt-0.5">تظهر للاعبين والمدربين في لوحة التحكم</p>
          </div>
          <button onClick={addBanner} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition">
            + إضافة بانر
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="text-3xl mb-2">🖼️</div>
            <p className="text-sm">لا توجد بانرات بعد</p>
            <button onClick={addBanner} className="mt-3 text-sm text-green-600 hover:underline">+ أضف أول بانر</button>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  {/* Preview */}
                  <div className="w-24 h-16 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-300">
                    {banner.url
                      ? <img src={banner.url} alt="بانر" className="w-full h-full object-cover" />
                      : <span className="text-gray-400 text-xs text-center px-1">لا توجد صورة</span>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => triggerBannerUpload(idx)}
                        disabled={uploadingBannerIdx === idx}
                        className="text-xs bg-white border border-gray-300 hover:border-green-400 text-gray-600 px-3 py-1.5 rounded-lg transition"
                      >
                        {uploadingBannerIdx === idx ? 'جارٍ الرفع...' : banner.url ? '🔄 تغيير الصورة' : '📁 رفع صورة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBanner(idx)}
                        className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                      >
                        حذف
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="عنوان البانر (اختياري)"
                      value={banner.title ?? ''}
                      onChange={(e) => updateBanner(idx, 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="رابط عند النقر (اختياري)"
                      value={banner.link ?? ''}
                      onChange={(e) => updateBanner(idx, 'link', e.target.value)}
                      dir="ltr"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input for banner uploads */}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerImageChange} />

        {banners.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={saveBanners}
              disabled={bannerSaving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              {bannerSaving ? 'جارٍ الحفظ...' : 'حفظ البانرات'}
            </button>
          </div>
        )}

        {bannerMsg && (
          <div className={`mt-3 text-sm rounded-lg px-3 py-2 ${bannerMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {bannerMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}
