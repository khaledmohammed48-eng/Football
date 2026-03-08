# إعداد مشروع أكاديمية كرة القدم

## المتطلبات
- Node.js 20+
- PostgreSQL (محلي أو Docker)
- npm 9+

---

## التشغيل المحلي

### 1. تثبيت المكتبات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example apps/web/.env
# عدّل القيم في apps/web/.env
```

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/football_academy
NEXTAUTH_SECRET=your-secret-here-run-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

### 3. إعداد قاعدة البيانات
```bash
cd apps/web
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. تشغيل الموقع
```bash
cd ../..
npm run dev
```

الموقع يعمل على: http://localhost:3000

### بيانات دخول المدير الافتراضية
- **البريد الإلكتروني:** admin@academy.com
- **كلمة المرور:** Admin@123456

> ⚠️ **غيّر كلمة مرور المدير بعد أول دخول**

---

## تشغيل التطبيق المحمول
```bash
cd apps/mobile
npx expo start
```
اسكن رمز QR بتطبيق Expo Go على هاتفك.

---

## النشر على السيرفر (VPS)

### 1. تثبيت Docker على السيرفر
```bash
curl -fsSL https://get.docker.com | sh
```

### 2. نسخ المشروع
```bash
git clone <repo-url> football-academy
cd football-academy
```

### 3. إنشاء ملف .env للإنتاج
```bash
cp .env.example .env
# عدّل القيم
```

```env
DB_USER=football_user
DB_PASSWORD=strong-password-here
NEXTAUTH_SECRET=run-openssl-rand-base64-32-here
DOMAIN=yourdomain.com
```

### 4. إعداد SSL
```bash
apt install certbot
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/key.pem
```

### 5. تشغيل Docker
```bash
cd docker
docker-compose up -d
```

### 6. تطبيق migrations وإنشاء المدير
```bash
docker-compose exec web npx prisma migrate deploy
docker-compose exec web npx prisma db seed
```

---

## هيكل المشروع

```
football-academy/
├── apps/
│   ├── web/          # Next.js 14 — الموقع والـ API
│   └── mobile/       # React Native — التطبيق المحمول
├── packages/
│   └── shared/       # أنواع TypeScript مشتركة وثوابت عربية
└── docker/           # إعداد Docker وNginx
```

## الأدوار والصلاحيات

| الدور | الصلاحيات |
|------|-----------|
| مدير (ADMIN) | إدارة كاملة: فرق، لاعبون، مدربون، حسابات |
| مدرب (COACH) | عرض فريقه، تقييم مهارات اللاعبين، إضافة ملاحظات |
| لاعب (PLAYER) | عرض ملفه الشخصي ومهاراته وملاحظات المدربين |

## API الرئيسية
- `POST /api/accounts` — إنشاء حسابات جديدة
- `GET/POST /api/teams` — إدارة الفرق
- `GET /api/players?teamId=&search=` — قائمة اللاعبين
- `GET /api/players/:id` — تفاصيل لاعب
- `PUT /api/players/:id/attributes` — تحديث المهارات
- `POST /api/players/:id/notes` — إضافة ملاحظة
