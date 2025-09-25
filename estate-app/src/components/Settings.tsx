'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function Settings() {
  const { state, dispatch } = useApp();
  const [settings, setSettings] = useState(state.settings);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    setSettings(state.settings);
  }, [state.settings]);

  const handleSaveSettings = async () => {
    try {
      setSaveStatus('جاري الحفظ...');

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        dispatch({ type: 'SET_SETTINGS', payload: settings });
        setSaveStatus('تم حفظ الإعدادات بنجاح!');

        // تطبيق الإعدادات فوراً
        applySettings(settings);

        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        const error = await response.json();
        setSaveStatus(`فشل في حفظ الإعدادات: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('حدث خطأ في حفظ الإعدادات');
    }
  };

  const applySettings = (newSettings: typeof settings) => {
    // تطبيق الثيم
    document.documentElement.setAttribute('data-theme', newSettings.theme);

    // تطبيق حجم الخط
    document.documentElement.style.fontSize = newSettings.font + 'px';

    // إشعار للمطور لتطبيق الإعدادات الأخرى
    console.log('Settings applied:', newSettings);
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'dark',
      font: 16
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  return (
    <div className="settings">
      <div className="card">
        <h3>إعدادات النظام</h3>
        <p>تخصيص مظهر وإعدادات النظام</p>

        <div className="settings-sections">
          {/* إعدادات المظهر */}
          <div className="settings-section">
            <h4>المظهر والعرض</h4>

            <div className="setting-item">
              <div className="setting-info">
                <label>الثيم</label>
                <p>اختيار مظهر النظام</p>
              </div>
              <div className="setting-control">
                <div className="theme-options">
                  <button
                    className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                  >
                    <div className="theme-preview light">
                      <div className="preview-header"></div>
                      <div className="preview-content">
                        <div className="preview-row"></div>
                        <div className="preview-row"></div>
                        <div className="preview-row short"></div>
                      </div>
                    </div>
                    <span>فاتح</span>
                  </button>
                  <button
                    className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  >
                    <div className="theme-preview dark">
                      <div className="preview-header"></div>
                      <div className="preview-content">
                        <div className="preview-row"></div>
                        <div className="preview-row"></div>
                        <div className="preview-row short"></div>
                      </div>
                    </div>
                    <span>داكن</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>حجم الخط</label>
                <p>ضبط حجم الخط العام للنظام</p>
              </div>
              <div className="setting-control">
                <div className="font-size-control">
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={settings.font}
                    onChange={(e) => setSettings({ ...settings, font: parseInt(e.target.value) })}
                  />
                  <span className="font-size-value">{settings.font}px</span>
                </div>
              </div>
            </div>
          </div>

          {/* إعدادات النظام */}
          <div className="settings-section">
            <h4>إعدادات النظام</h4>

            <div className="setting-item">
              <div className="setting-info">
                <label>معلومات النظام</label>
                <p>عرض معلومات النظام والإصدار</p>
              </div>
              <div className="setting-control">
                <div className="system-info">
                  <div className="info-item">
                    <span className="info-label">الإصدار:</span>
                    <span className="info-value">1.0.0</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">قاعدة البيانات:</span>
                    <span className="info-value">PostgreSQL</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">التقنيات:</span>
                    <span className="info-value">Next.js, React, TypeScript</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">المطور:</span>
                    <span className="info-value">نظام إدارة العقارات</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* إعدادات متقدمة */}
          <div className="settings-section">
            <h4>إعدادات متقدمة</h4>

            <div className="setting-item">
              <div className="setting-info">
                <label>مسح البيانات المؤقتة</label>
                <p>مسح البيانات المؤقتة وإعادة تحميل النظام</p>
              </div>
              <div className="setting-control">
                <button
                  className="btn secondary"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                >
                  مسح البيانات المؤقتة
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>إعادة تعيين الإعدادات</label>
                <p>إعادة جميع الإعدادات إلى القيم الافتراضية</p>
              </div>
              <div className="setting-control">
                <button className="btn warn" onClick={resetSettings}>
                  إعادة تعيين
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار الحفظ والإلغاء */}
        <div className="settings-actions">
          <button className="btn secondary" onClick={resetSettings}>
            إعادة تعيين
          </button>
          <button className="btn" onClick={handleSaveSettings}>
            حفظ الإعدادات
          </button>
        </div>

        {saveStatus && (
          <div className={`status-message ${saveStatus.includes('بنجاح') ? 'success' : saveStatus.includes('فشل') ? 'error' : 'info'}`}>
            {saveStatus}
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-sections {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin: 24px 0;
        }

        .settings-section {
          padding: 20px;
          background: var(--panel);
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .settings-section h4 {
          margin: 0 0 16px 0;
          color: var(--text);
          font-size: 16px;
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .setting-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
        }

        .setting-info label {
          display: block;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text);
        }

        .setting-info p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
        }

        .setting-control {
          flex: 0 0 300px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .theme-options {
          display: flex;
          gap: 12px;
        }

        .theme-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .theme-option.active {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .theme-preview {
          width: 60px;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .theme-preview.light {
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .theme-preview.dark {
          background: #1e293b;
          border: 1px solid #334155;
        }

        .preview-header {
          height: 12px;
          background: var(--primary);
          opacity: 0.7;
        }

        .preview-content {
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .preview-row {
          height: 6px;
          background: var(--muted);
          opacity: 0.5;
          border-radius: 1px;
        }

        .preview-row.short {
          width: 70%;
        }

        .theme-option span {
          font-size: 12px;
          font-weight: 500;
        }

        .font-size-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .font-size-control input[type="range"] {
          flex: 1;
        }

        .font-size-value {
          min-width: 40px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }

        .system-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: 13px;
          color: var(--muted);
        }

        .info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .settings-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .status-message {
          margin-top: 16px;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          text-align: center;
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

        .btn {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 10px 20px;
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

        @media (max-width: 768px) {
          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .setting-control {
            width: 100%;
            justify-content: flex-start;
          }

          .theme-options {
            width: 100%;
            justify-content: center;
          }

          .settings-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}