import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <p className="text-gray-600 mb-6">غير مصرح لك بالوصول إلى هذه الصفحة</p>
        <Link
          href="/"
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
