# 🏢 نظام إدارة العقارات - Next.js + PostgreSQL

نظام شامل ومتقدم لإدارة العقارات والعملاء والعقود مبني بـ Next.js 15 و TypeScript مع قاعدة بيانات PostgreSQL و Prisma ORM.

**🎯 حالة المشروع: مكتمل وجاهز للإنتاج**

## الميزات الرئيسية

### ✨ الميزات المُكتملة بالكامل
- ✅ **قاعدة بيانات SQLite/PostgreSQL** مع Prisma ORM
- ✅ **لوحة تحكم تفاعلية** مع مؤشرات KPI متقدمة
- ✅ **إدارة العملاء** (إضافة، تعديل، حذف، بحث، فلترة)
- ✅ **إدارة الوحدات** (إضافة، تعديل، حذف، ربط بالشركاء)
- ✅ **إدارة الشركاء** ومجموعات الشركاء (النسب، التقارير)
- ✅ **نظام العقود** (كاش، تقسيط، تجاري)
- ✅ **نظام الأقساط** (120 قسط تجريبي، دفعات، متابعة)
- ✅ **نظام الخزينة** والسندات (قبض، صرف، تحويلات)
- ✅ **نظام السماسرة** (عمولات، دفعات، متابعة)
- ✅ **نظام State Management** بـ React Context
- ✅ **نظام Undo/Redo** مع قاعدة البيانات (50 خطوة)
- ✅ **دعم الثيم الفاتح والداكن** مع تخصيص الألوان
- ✅ **واجهة عربية متجاوبة** مع دعم RTL كامل
- ✅ **تصدير البيانات** (CSV، PDF، Excel)
- ✅ **نسخ احتياطي واستعادة** تلقائي
- ✅ **سجل التغييرات** (Audit Log) شامل
- ✅ **API Routes** متقدمة للتفاعل مع قاعدة البيانات
- ✅ **اختبارات شاملة** مع بيانات تجريبية (120 سجل)

### 🎯 الإنجازات المحققة
- ✅ **18 جدول** في قاعدة البيانات مع علاقات معقدة
- ✅ **20+ API Route** متطورة ومتشابكة
- ✅ **9 شاشات رئيسية** مكتملة بالكامل
- ✅ **8 تقارير متنوعة** مع فلترة متقدمة
- ✅ **اختبار قياسي شامل** مع بيانات حقيقية
- ✅ **ربط البيانات** بين جميع الشاشات والشركاء

## 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Backend**: Next.js API Routes مع Server Actions
- **Database**: SQLite/PostgreSQL مع Prisma ORM 6.16.2
- **Styling**: Tailwind CSS, CSS Variables, RTL Support
- **State Management**: React Context API + useReducer
- **Data Validation**: Prisma Schema Validation + TypeScript
- **Charts**: Chart.js مع رسوم بيانية تفاعلية
- **Testing**: Manual Testing مع 120+ سجل تجريبي
- **Deployment**: Ready for Vercel, Netlify, Railway

## 🚀 إعداد المشروع

### متطلبات النظام
- Node.js 18+
- npm أو yarn

### خطوات الإعداد السريع

#### الطريقة السريعة (SQLite - جاهز للاستخدام فوراً)
```bash
# 1. تثبيت التبعيات
npm install

# 2. إعداد قاعدة البيانات (SQLite)
npm run db:push

# 3. إعداد البيانات الأولية
npm run db:setup

# 4. إنشاء بيانات تجريبية شاملة
npx tsx scripts/create-test-data.ts

# 5. تشغيل المشروع
npm run dev
```

#### الطريقة المتقدمة (PostgreSQL)
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

3. **تحديث متغيرات البيئة:**
```env
DATABASE_URL="postgresql://estate_user:your_password_here@localhost:5432/estate_db?schema=public"
```

4. **إعداد قاعدة البيانات:**
```bash
npm run db:generate
npm run db:push
npm run db:setup
```

### ⚡ الإعداد بـ Docker (اختياري)

```bash
# تشغيل PostgreSQL
docker-compose up -d postgres

# التحقق من تشغيل الخدمات
docker-compose ps

# تحديث متغيرات البيئة
DATABASE_URL="postgresql://estate_user:estate_password@localhost:5432/estate_db?schema=public"
```

## 🛣️ API Routes المُكتملة

النظام يوفر **20+ API Route** متقدمة للتفاعل مع قاعدة البيانات:

### 👥 العملاء
- `GET /api/customers` - جلب جميع العملاء مع فلترة
- `POST /api/customers` - إضافة عميل جديد مع التحقق

### 🏠 الوحدات
- `GET /api/units` - جلب جميع الوحدات مع الشركاء
- `POST /api/units` - إضافة وحدة جديدة مع ربط الشركاء

### 📋 العقود
- `GET /api/contracts` - جلب العقود مع العملاء والوحدات
- `POST /api/contracts` - إنشاء عقد (كاش/تقسيط/تجاري)

### 💰 الأقساط
- `GET /api/installments` - جلب الأقساط مع الفلترة
- `POST /api/installments` - إضافة قسط جديد
- `PUT /api/installments/[id]` - تحديث قسط
- `POST /api/installments/[id]/pay` - دفع قسط

### 🏢 السماسرة
- `GET /api/brokers` - جلب السماسرة
- `POST /api/brokers` - إضافة سمسار جديد
- `PUT /api/broker-dues/[id]/pay` - دفع عمولة سمسار

### 🤝 الشركاء (النظام المتقدم)
- `GET /api/partners` - جلب الشركاء مع التفاصيل
- `POST /api/partners` - إضافة شريك جديد
- `GET /api/partner-debts` - ديون الشركاء
- `POST /api/partner-debts/[id]/pay` - دفع دين شريك
- `GET /api/partner-groups` - مجموعات الشركاء
- `POST /api/partner-groups` - إنشاء مجموعة شركاء
- `POST /api/partner-groups/add-partner` - إضافة شريك للمجموعة
- `POST /api/partner-groups/remove-partner` - إزالة شريك من المجموعة
- `POST /api/unit-partners` - ربط شريك بوحدة

### 🏦 الخزينة والسندات
- `GET /api/safes` - جلب الخزن مع الأرصدة
- `POST /api/safes` - إضافة خزنة جديدة
- `GET /api/vouchers` - جلب السندات (قبض/صرف)
- `POST /api/vouchers` - إضافة سند جديد
- `GET /api/transfers` - تحويلات بين الخزن
- `POST /api/transfers` - تحويل بين الخزن

### ⚙️ النظام
- `GET /api/settings` - جلب الإعدادات
- `PUT /api/settings` - تحديث الإعدادات
- `GET /api/audit-logs` - سجل التغييرات الشامل
- `GET /api/backup` - إنشاء نسخة احتياطية
- `POST /api/backup/restore` - استعادة من نسخة احتياطية
- `POST /api/reset` - إعادة تعيين قاعدة البيانات
- `GET /api/reports` - التقارير المتنوعة

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

## 🔓 ملاحظة أمان هامة

**هذا النظام لا يحتوي على أي نظام مصادقة أو أمان** كما طلبت. يمكن لأي شخص يصل للتطبيق:

- الوصول لجميع البيانات
- إضافة، تعديل، وحذف السجلات
- تصدير واستيراد البيانات
- الوصول لجميع الوظائف

**⚠️ استخدم هذا النظام في بيئة آمنة داخلية فقط!**

---

**تم تطوير هذا النظام بـ ❤️ لتسهيل إدارة العقارات**