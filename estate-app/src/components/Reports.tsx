'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { egp, getUnitDisplayName, unitById, custById } from '@/utils';

const REPORT_DEFINITIONS = {
  'المالية': [
    {
      id: 'payments_monthly',
      title: 'مدفوعات شهرية',
      description: 'عرض إجمالي المدفوعات مجمعة حسب الشهر.',
      icon: '📅',
      filters: ['dateRange']
    },
    {
      id: 'cashflow',
      title: 'التدفقات النقدية العامة',
      description: 'كشف حساب يوضح كل الحركات المالية الداخلة والخارجة.',
      icon: '💰',
      filters: ['dateRange']
    }
  ],
  'الشركاء': [
    {
      id: 'partner_summary',
      title: 'ملخص أرباح الشركاء',
      description: 'عرض ملخص دخل ومصروفات وصافي ربح كل شريك.',
      icon: '👥',
      filters: ['dateRange']
    },
    {
      id: 'partner_profits',
      title: 'تفاصيل أرباح الشركاء',
      description: 'عرض تفصيلي لكل دفعة وكيف تم توزيعها كأرباح على الشركاء.',
      icon: '📊',
      filters: ['dateRange']
    },
    {
      id: 'partner_cashflow',
      title: 'ملخص تدفقات الشركاء',
      description: 'عرض شهري لحصة الأرباح الخاصة بشريك معين.',
      icon: '📈',
      filters: ['dateRange', 'partner']
    }
  ],
  'المتابعة': [
    {
      id: 'inst_due',
      title: 'كل الأقساط المستحقة',
      description: 'قائمة بكل الأقساط القادمة التي لم يتم سدادها بعد.',
      icon: '🔔',
      filters: ['dateRange']
    },
    {
      id: 'inst_overdue',
      title: 'الأقساط المتأخرة فقط',
      description: 'عرض الأقساط التي تجاوزت تاريخ استحقاقها ولم تسدد.',
      icon: '⚠️',
      filters: ['dateRange']
    },
    {
      id: 'cust_activity',
      title: 'نشاط العملاء',
      description: 'تقرير يوضح عدد الوحدات وإجمالي المدفوعات لكل عميل.',
      icon: '🧍',
      filters: ['dateRange']
    },
    {
      id: 'units_status',
      title: 'حالة الوحدات',
      description: 'ملخص لعدد الوحدات المتاحة، المباعة، والمحجوزة.',
      icon: '🏠',
      filters: []
    }
  ]
};

export default function Reports() {
  const { state } = useApp();
  const [activeCategory, setActiveCategory] = useState('المالية');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    partnerId: '',
    customerId: '',
    unitId: '',
    safeId: ''
  });
  const [reportData, setReportData] = useState<any>(null);
  const [showChart, setShowChart] = useState(false);

  const handleReportClick = (report: any) => {
    setSelectedReport(report);
    setShowFilterScreen(true);
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          filters
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        setShowChart(data.hasChart || false);
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ في إنشاء التقرير');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('حدث خطأ في إنشاء التقرير');
    }
  };

  const handleExportReport = (format: 'csv' | 'pdf') => {
    if (!reportData) return;

    if (format === 'csv') {
      const headers = reportData.headers || [];
      const rows = reportData.rows || [];
      const csv = [headers.join(','), ...rows.map((row: any) =>
        row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport?.title || 'report'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // طباعة كـ PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8">
            <title>${selectedReport?.title || 'تقرير'}</title>
            <style>
              @page { size: A4; margin: 12mm }
              body { font-family: Arial, sans-serif; direction: rtl; margin: 0; padding: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .report-meta { margin-bottom: 20px; text-align: center; color: #666; }
            </style>
          </head>
          <body>
            <h1>${selectedReport?.title || 'تقرير'}</h1>
            <div class="report-meta">
              <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
              ${filters.dateFrom ? `<p>من تاريخ: ${filters.dateFrom}</p>` : ''}
              ${filters.dateTo ? `<p>إلى تاريخ: ${filters.dateTo}</p>` : ''}
            </div>
            ${reportData?.html || generateReportHTML()}
          </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      }
    }
  };

  const generateReportHTML = () => {
    if (!reportData || !selectedReport) return '';

    const headers = reportData.headers || [];
    const rows = reportData.rows || [];

    const tableHTML = `
      <table>
        <thead>
          <tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row: any) => `<tr>${row.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;

    return tableHTML;
  };

  const renderReportFilterScreen = () => {
    if (!selectedReport) return null;

    const report = selectedReport;

    return (
      <div className="card">
        <div className="header">
          <h3>فلترة تقرير: {report.title}</h3>
          <button className="btn secondary" onClick={() => setShowFilterScreen(false)}>
            ← العودة
          </button>
        </div>

        <div className="filters-container">
          {report.filters.includes('dateRange') && (
            <div className="filter-group">
              <label>الفترة الزمنية:</label>
              <div className="date-range">
                <input
                  type="date"
                  className="input"
                  placeholder="من تاريخ"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
                <span>إلى</span>
                <input
                  type="date"
                  className="input"
                  placeholder="إلى تاريخ"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          )}

          {report.filters.includes('partner') && (
            <div className="filter-group">
              <label>الشريك:</label>
              <select
                className="select"
                value={filters.partnerId}
                onChange={(e) => setFilters({ ...filters, partnerId: e.target.value })}
              >
                <option value="">جميع الشركاء</option>
                {state.partners.map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {report.filters.includes('customer') && (
            <div className="filter-group">
              <label>العميل:</label>
              <select
                className="select"
                value={filters.customerId}
                onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
              >
                <option value="">جميع العملاء</option>
                {state.customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="tools">
          <button className="btn" onClick={handleGenerateReport} style={{ flex: 1 }}>
            إنشاء التقرير
          </button>
        </div>

        {reportData && (
          <div className="report-output">
            <div className="report-actions">
              <button className="btn secondary" onClick={() => handleExportReport('csv')}>
                تصدير CSV
              </button>
              <button className="btn secondary" onClick={() => handleExportReport('pdf')}>
                تصدير PDF
              </button>
              {showChart && (
                <button className="btn secondary" onClick={() => setShowChart(!showChart)}>
                  {showChart ? 'إخفاء الرسم البياني' : 'عرض الرسم البياني'}
                </button>
              )}
            </div>

            {showChart && reportData.chartData && (
              <div className="chart-container">
                <canvas id="reportChart" width="400" height="200"></canvas>
              </div>
            )}

            <div className="report-content">
              <h4>{selectedReport.title}</h4>
              {reportData.html ? (
                <div dangerouslySetInnerHTML={{ __html: reportData.html }} />
              ) : (
                generateReportHTML() && <div dangerouslySetInnerHTML={{ __html: generateReportHTML() }} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportCards = (category: string) => {
    const reports = REPORT_DEFINITIONS[category as keyof typeof REPORT_DEFINITIONS] || [];

    return (
      <div className="reports-grid">
        {reports.map(report => (
          <div key={report.id} className="report-card" onClick={() => handleReportClick(report)}>
            <div className="report-icon">{report.icon}</div>
            <div className="report-content">
              <h4>{report.title}</h4>
              <p>{report.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (showFilterScreen && selectedReport) {
    return renderReportFilterScreen();
  }

  return (
    <div className="reports">
      <div className="reports-layout">
        <div className="reports-main">
          <div className="card">
            <h3>التقارير</h3>
            <p>اختر نوع التقرير المطلوب:</p>

            <div className="categories-nav">
              {Object.keys(REPORT_DEFINITIONS).map(category => (
                <button
                  key={category}
                  className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="reports-content">
              {renderReportCards(activeCategory)}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .reports-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .reports-main {
          flex: 1;
        }

        .categories-nav {
          display: flex;
          gap: 8px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .category-btn {
          background: var(--panel);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .category-btn:hover {
          background: var(--primary-light);
          color: var(--primary);
        }

        .category-btn.active {
          background: var(--primary);
          color: white;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .report-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .report-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .report-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-light);
          border-radius: 8px;
          flex-shrink: 0;
        }

        .report-content h4 {
          margin: 0 0 8px 0;
          color: var(--text);
        }

        .report-content p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.4;
        }

        .filters-container {
          margin: 20px 0;
          padding: 16px;
          background: var(--bg);
          border-radius: 8px;
        }

        .filter-group {
          margin-bottom: 16px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .date-range span {
          color: var(--muted);
          font-size: 14px;
        }

        .report-output {
          margin-top: 20px;
          padding: 16px;
          background: var(--bg);
          border-radius: 8px;
        }

        .report-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          justify-content: flex-end;
        }

        .chart-container {
          margin: 20px 0;
          height: 200px;
          background: white;
          border-radius: 8px;
          padding: 16px;
        }

        .report-content {
          flex: 1;
        }

        .input, .select {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--panel);
          color: var(--text);
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

        .tools {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .reports-layout {
            flex-direction: column;
          }

          .reports-grid {
            grid-template-columns: 1fr;
          }

          .report-card {
            flex-direction: column;
            text-align: center;
          }

          .categories-nav {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}