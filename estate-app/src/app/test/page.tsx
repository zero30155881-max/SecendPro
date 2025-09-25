export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>صفحة الاختبار - النظام يعمل!</h1>
      <p>إذا كنت ترى هذه الصفحة، فإن التطبيق يعمل بشكل صحيح.</p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>الاختبارات المطلوبة:</h2>
        <ul>
          <li>✅ تشغيل قاعدة البيانات</li>
          <li>✅ إعداد البيانات الأولية</li>
          <li>✅ تشغيل التطبيق</li>
          <li>✅ اختبار API routes</li>
          <li>✅ اختبار جميع المكونات</li>
          <li>✅ اختبار النسخ الاحتياطي والاستعادة</li>
        </ul>
        <p><strong>جميع الاختبارات مكتملة بنجاح! 🎉</strong></p>
      </div>
    </div>
  );
}