'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Backup() {
  const { state } = useApp();
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [showRestoreForm, setShowRestoreForm] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [confirmReset, setConfirmReset] = useState('');

  const handleBackup = async (type: 'json' | 'excel') => {
    try {
      setBackupStatus('جاري إنشاء النسخة الاحتياطية...');

      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().slice(0, 10)}.${type === 'json' ? 'json' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setBackupStatus('تم إنشاء النسخة الاحتياطية بنجاح!');
      } else {
        const error = await response.json();
        setBackupStatus(`فشل في إنشاء النسخة الاحتياطية: ${error.error}`);
      }
    } catch (error) {
      console.error('Backup error:', error);
      setBackupStatus('حدث خطأ في إنشاء النسخة الاحتياطية');
    }
  };

  const handleRestore = async () => {
    if (!backupFile) {
      alert('الرجاء اختيار ملف النسخة الاحتياطية');
      return;
    }

    if (!confirm('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
      return;
    }

    try {
      setRestoreStatus('جاري استعادة البيانات...');

      const formData = new FormData();
      formData.append('backup', backupFile);

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setRestoreStatus('تم استعادة البيانات بنجاح! سيتم إعادة تحميل الصفحة...');

        // إعادة تحميل الصفحة بعد 2 ثانية
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const error = await response.json();
        setRestoreStatus(`فشل في استعادة البيانات: ${error.error}`);
      }
    } catch (error) {
      console.error('Restore error:', error);
      setRestoreStatus('حدث خطأ في استعادة البيانات');
    }
  };

  const handleReset = async () => {
    if (confirmReset !== 'مسح') {
      alert('الرجاء كتابة "مسح" في حقل التأكيد');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا لا يمكن التراجع عنه!')) {
      return;
    }

    try {
      setRestoreStatus('جاري حذف جميع البيانات...');

      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      });

      if (response.ok) {
        setRestoreStatus('تم حذف جميع البيانات! سيتم إعادة تحميل الصفحة...');

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const error = await response.json();
        setRestoreStatus(`فشل في حذف البيانات: ${error.error}`);
      }
    } catch (error) {
      console.error('Reset error:', error);
      setRestoreStatus('حدث خطأ في حذف البيانات');
    }
  };

  const getDatabaseStats = () => {
    return {
      customers: state.customers.length,
      units: state.units.length,
      partners: state.partners.length,
      contracts: state.contracts.length,
      installments: state.installments.length,
      safes: state.safes.length,
      vouchers: state.vouchers.length,
      brokers: state.brokers.length,
      partnerDebts: state.partnerDebts.length,
      totalRecords: state.customers.length + state.units.length + state.partners.length +
                   state.contracts.length + state.installments.length + state.safes.length +
                   state.vouchers.length + state.brokers.length + state.partnerDebts.length
    };
  };

  const stats = getDatabaseStats();

  return (
    <div className="backup">
      <div className="card">
        <h3>النسخة الاحتياطية</h3>
        <p>إدارة البيانات والنسخ الاحتياطية للنظام</p>

        {/* إحصائيات قاعدة البيانات */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.customers}</div>
            <div className="stat-label">العميل</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.units}</div>
            <div className="stat-label">الوحدة</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.contracts}</div>
            <div className="stat-label">العقد</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.installments}</div>
            <div className="stat-label">القسط</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.safes}</div>
            <div className="stat-label">الخزنة</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.vouchers}</div>
            <div className="stat-label">السند</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.partners}</div>
            <div className="stat-label">الشريك</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalRecords}</div>
            <div className="stat-label">إجمالي السجلات</div>
          </div>
        </div>

        <div className="backup-actions">
          <div className="action-card">
            <h4>إنشاء نسخة احتياطية</h4>
            <p>قم بإنشاء نسخة احتياطية من جميع بيانات النظام</p>
            <div className="action-buttons">
              <button
                className="btn"
                onClick={() => handleBackup('json')}
                disabled={backupStatus.includes('جاري')}
              >
                تنزيل JSON
              </button>
              <button
                className="btn secondary"
                onClick={() => handleBackup('excel')}
                disabled={backupStatus.includes('جاري')}
              >
                تنزيل Excel
              </button>
            </div>
            {backupStatus && (
              <div className={`status-message ${backupStatus.includes('بنجاح') ? 'success' : backupStatus.includes('فشل') ? 'error' : 'info'}`}>
                {backupStatus}
              </div>
            )}
          </div>

          <div className="action-card">
            <h4>استعادة البيانات</h4>
            <p>استعادة البيانات من ملف نسخة احتياطية</p>
            <div className="action-buttons">
              <button
                className="btn"
                onClick={() => setShowRestoreForm(!showRestoreForm)}
              >
                {showRestoreForm ? 'إلغاء' : 'استعادة من ملف'}
              </button>
            </div>

            {showRestoreForm && (
              <div className="restore-form">
                <div className="form-group">
                  <label>اختر ملف النسخة الاحتياطية:</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                  />
                </div>
                <button
                  className="btn warn"
                  onClick={handleRestore}
                  disabled={!backupFile || restoreStatus.includes('جاري')}
                >
                  استعادة البيانات
                </button>
              </div>
            )}

            {restoreStatus && (
              <div className={`status-message ${restoreStatus.includes('بنجاح') ? 'success' : restoreStatus.includes('فشل') ? 'error' : 'info'}`}>
                {restoreStatus}
              </div>
            )}
          </div>

          <div className="action-card danger">
            <h4>مسح جميع البيانات</h4>
            <p>حذف جميع البيانات من النظام بشكل نهائي</p>
            <div className="form-group">
              <label>اكتب "مسح" للتأكيد:</label>
              <input
                type="text"
                className="input"
                value={confirmReset}
                onChange={(e) => setConfirmReset(e.target.value)}
                placeholder="مسح"
              />
            </div>
            <button
              className="btn warn"
              onClick={handleReset}
              disabled={confirmReset !== 'مسح'}
            >
              مسح جميع البيانات
            </button>
          </div>
        </div>

        <div className="backup-info">
          <h4>معلومات مهمة:</h4>
          <ul>
            <li>يتم حفظ النسخ الاحتياطية بصيغة JSON و Excel</li>
            <li>تتضمن النسخة الاحتياطية جميع البيانات والإعدادات</li>
            <li>عند الاستعادة سيتم حذف جميع البيانات الحالية</li>
            <li>تأكد من أخذ نسخة احتياطية قبل الاستعادة</li>
            <li>مسح البيانات عملية لا يمكن التراجع عنها</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin: 20px 0;
        }

        .stat-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: var(--muted);
        }

        .backup-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .action-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
        }

        .action-card.danger {
          border-color: var(--error);
          background: rgba(239, 68, 68, 0.05);
        }

        .action-card h4 {
          margin: 0 0 12px 0;
          color: var(--text);
        }

        .action-card p {
          margin: 0 0 16px 0;
          color: var(--muted);
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .restore-form {
          margin-top: 16px;
          padding: 16px;
          background: var(--bg);
          border-radius: 8px;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .status-message {
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .status-message.success {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
          border: 1px solid var(--success);
        }

        .status-message.error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          border: 1px solid var(--error);
        }

        .status-message.info {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary);
          border: 1px solid var(--primary);
        }

        .backup-info {
          margin-top: 20px;
          padding: 16px;
          background: var(--bg);
          border-radius: 8px;
          border-left: 4px solid var(--info);
        }

        .backup-info h4 {
          margin: 0 0 12px 0;
          color: var(--text);
        }

        .backup-info ul {
          margin: 0;
          padding-right: 20px;
        }

        .backup-info li {
          margin-bottom: 8px;
          color: var(--muted);
          font-size: 14px;
        }

        .btn {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .btn:hover {
          background-color: var(--primary-light);
        }

        .btn.secondary {
          background-color: var(--secondary);
        }

        .btn.secondary:hover {
          background-color: #475569;
        }

        .btn.warn {
          background-color: var(--error);
        }

        .btn.warn:hover {
          background-color: #dc2626;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background-color: var(--bg);
          color: var(--text);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .backup-actions {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}