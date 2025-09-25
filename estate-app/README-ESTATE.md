# نظام إدارة العقارات - Next.js + PostgreSQL

نظام شامل لإدارة العقارات والعملاء والعقود مبني بـ Next.js و TypeScript مع قاعدة بيانات PostgreSQL.

## الميزات الرئيسية

### ✨ الميزات المُكتملة
- ✅ قاعدة بيانات PostgreSQL مع Prisma ORM
- ✅ لوحة تحكم تفاعلية مع مؤشرات KPI
- ✅ إدارة العملاء (إضافة، تعديل، حذف، بحث)
- ✅ إدارة الوحدات (إضافة، تعديل، حذف، بحث)
- ✅ إدارة الشركاء ومجموعات الشركاء
- ✅ نظام الخزنة والسندات
- ✅ نظام state management بـ React Context
- ✅ نظام undo/redo مع قاعدة البيانات
- ✅ دعم الثيم الفاتح والداكن
- ✅ واجهة عربية متجاوبة
- ✅ تصدير البيانات (CSV)
- ✅ نسخ احتياطي واستعادة
- ✅ API routes للتفاعل مع قاعدة البيانات

### 🔄 الميزات قيد التطوير
- ⏳ إدارة العقود والأقساط
- ⏳ إدارة السماسرة
- ⏳ إدارة الشركاء والمجموعات
- ⏳ نظام الخزينة والسندات
- ⏳ التقارير والإحصائيات
- ⏳ النسخ الاحتياطي والاستعادة

## التقنيات المستخدمة

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL مع Prisma ORM
- **Styling**: Tailwind CSS, CSS Variables
- **Authentication**: JWT (قيد التطوير)
- **State Management**: React Context API
- **Data Validation**: Prisma Schema Validation
- **Icons**: Custom CSS (يمكن إضافة Lucide أو Heroicons لاحقاً)

## إعداد قاعدة البيانات

### متطلبات النظام
- PostgreSQL 12+
- Node.js 18+
- npm أو yarn

### خطوات الإعداد

1. **تثبيت PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# تشغيل الخدمة
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

2. **إنشاء قاعدة البيانات:**
```bash
# الدخول كمستخدم postgres
sudo -u postgres psql

# إنشاء قاعدة البيانات
CREATE DATABASE estate_db;
CREATE USER estate_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE estate_db TO estate_user;
\q
```

3. **إعداد متغيرات البيئة:**
```bash
# نسخ ملف البيئة
cp .env.example .env

# تحرير المتغيرات
nano .env
```

4. **تحديث .env:**
```env
DATABASE_URL="postgresql://estate_user:your_password_here@localhost:5432/estate_db?schema=public"
NEXTAUTH_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

5. **إعداد قاعدة البيانات:**
```bash
# إنشاء Prisma client
npm run db:generate

# إنشاء الجداول
npm run db:push

# إعداد البيانات الأولية
npm run db:setup
```

6. **تشغيل المشروع:**
```bash
npm run dev
```

### إعداد Docker (اختياري)

إذا كنت تريد استخدام Docker:

```bash
# تشغيل PostgreSQL و pgAdmin
docker-compose up -d

# التحقق من تشغيل الخدمات
docker-compose ps

# الوصول لـ pgAdmin
# http://localhost:5050
# البريد الإلكتروني: admin@estate.com
# كلمة المرور: admin
```

ثم قم بتحديث متغيرات البيئة لاستخدام Docker:

```env
DATABASE_URL="postgresql://estate_user:estate_password@localhost:5432/estate_db?schema=public"
```

## API Routes

النظام يوفر API routes للتفاعل مع قاعدة البيانات:

### العملاء
- `GET /api/customers` - جلب جميع العملاء
- `POST /api/customers` - إضافة عميل جديد

### الوحدات
- `GET /api/units` - جلب جميع الوحدات
- `POST /api/units` - إضافة وحدة جديدة

### العقود
- `GET /api/contracts` - جلب جميع العقود
- `POST /api/contracts` - إضافة عقد جديد

### الأقساط
- `GET /api/installments` - جلب جميع الأقساط
- `POST /api/installments` - إضافة قسط جديد
- `PUT /api/installments` - تحديث قسط

### السندات
- `GET /api/vouchers` - جلب جميع السندات
- `POST /api/vouchers` - إضافة سند جديد

### الخزن
- `GET /api/safes` - جلب جميع الخزن
- `POST /api/safes` - إضافة خزنة جديدة

### الشركاء
- `GET /api/partners` - جلب جميع الشركاء
- `POST /api/partners` - إضافة شريك جديد

### الإعدادات
- `GET /api/settings` - جلب الإعدادات
- `PUT /api/settings` - تحديث الإعدادات

### سجل التغييرات
- `GET /api/audit-logs` - جلب سجل التغييرات
- `POST /api/audit-logs` - إضافة سجل تغيير

## وظائف قاعدة البيانات

### النسخ الاحتياطي
```bash
# إنشاء نسخة احتياطية
npm run db:backup

# استعادة من نسخة احتياطية
npm run db:restore path/to/backup.json
```

### إدارة قاعدة البيانات
```bash
# إنشاء Prisma client
npm run db:generate

# دفع التغييرات لقاعدة البيانات
npm run db:push

# إنشاء migration
npm run db:migrate
```

## البنية المعمارية

```
src/
├── app/                    # صفحات Next.js
│   ├── layout.tsx         # Layout الرئيسي
│   ├── page.tsx           # الصفحة الرئيسية
│   └── globals.css        # التنسيقات العامة
├── components/            # المكونات المشتركة
│   ├── Navigation.tsx     # شريط التنقل
│   ├── Dashboard.tsx      # لوحة التحكم
│   ├── Customers.tsx      # إدارة العملاء
│   └── Units.tsx          # إدارة الوحدات
├── context/               # إدارة الحالة
│   └── AppContext.tsx     # Context الرئيسي
├── types/                 # تعريفات TypeScript
│   └── index.ts           # واجهات البيانات
└── utils/                 # الوظائف المساعدة
    └── index.ts           # الدوال المساعدة
```

## التشغيل

### متطلبات النظام
- Node.js 18+
- npm أو yarn

### تثبيت وتشغيل
```bash
# تثبيت التبعيات
npm install

# تشغيل في وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# تشغيل الإنتاج
npm start
```

## الوظائف المتاحة

### لوحة التحكم
- عرض مؤشرات KPI (المبيعات، المتحصلات، المديونية، المصروفات)
- فلترة البيانات حسب التاريخ
- عرض الأقساط القادمة
- عرض أحدث الحركات المالية
- رسوم بيانية للوحدات

### إدارة العملاء
- إضافة عميل جديد
- البحث والفلترة
- تعديل وحذف العملاء
- تصدير البيانات

### إدارة الوحدات
- إضافة وحدة جديدة
- البحث والفلترة
- تعديل وحذف الوحدات
- ربط الشركاء بالوحدات
- تصدير البيانات

## نظام الحفظ

### localStorage
- حفظ جميع البيانات في المتصفح
- دعم undo/redo (50 خطوة)
- حفظ تلقائي عند كل تغيير

### الميزات المستقبلية
- دعم قاعدة بيانات (IndexedDB)
- تصدير واستيراد البيانات
- نسخ احتياطي تلقائي

## التخصيص

### الثيمات
- دعم الثيم الفاتح والداكن
- تخصيص الألوان عبر CSS Variables
- إعدادات الخط وحجمه

### اللغة
- واجهة عربية كاملة
- دعم RTL (Right-to-Left)
- تنسيقات الأرقام والتواريخ المحلية

## الخطط المستقبلية

### المرحلة التالية
- [ ] إكمال نظام العقود والأقساط
- [ ] إضافة نظام التقارير
- [ ] تطوير نظام الخزينة
- [ ] إضافة نظام النسخ الاحتياطي

### التحسينات المستقبلية
- [ ] دعم قاعدة بيانات حقيقية
- [ ] إضافة API للمزامنة
- [ ] تطبيق موبايل
- [ ] تقارير متقدمة
- [ ] نظام إشعارات

## المساهمة

1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. تطبيق التغييرات
4. اختبار التغييرات
5. إرسال Pull Request

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام التجاري والشخصي.

## الدعم

للحصول على المساعدة أو الإبلاغ عن مشاكل، يرجى:
- فتح Issue في GitHub
- مراجعة التوثيق
- التحقق من الأسئلة الشائعة

---

**تم تطوير هذا النظام بـ ❤️ لتسهيل إدارة العقارات**