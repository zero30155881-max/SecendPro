import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 إنشاء البيانات التجريبية...');

    // إنشاء الخزن
    const existingSafes = await prisma.safe.findMany();
    let mainSafe, commissionSafe;

    if (existingSafes.length === 0) {
      mainSafe = await prisma.safe.create({
        data: {
          name: 'الخزنة الرئيسية',
          balance: 0
        }
      });

      commissionSafe = await prisma.safe.create({
        data: {
          name: 'خزنة العمولات',
          balance: 0
        }
      });
    } else {
      mainSafe = existingSafes[0];
      commissionSafe = existingSafes[1] || await prisma.safe.create({
        data: {
          name: 'خزنة العمولات',
          balance: 0
        }
      });
    }

    // إنشاء العملاء
    console.log('👥 إنشاء العملاء...');
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          name: 'أحمد محمد علي',
          phone: '01012345678',
          nationalId: '12345678901234',
          address: 'القاهرة - الزمالك',
          status: 'نشط',
          notes: 'عميل مهم'
        }
      }),
      prisma.customer.create({
        data: {
          name: 'فاطمة أحمد حسن',
          phone: '01198765432',
          nationalId: '98765432109876',
          address: 'الإسكندرية - سموحة',
          status: 'نشط',
          notes: 'عميلة منتظمة'
        }
      }),
      prisma.customer.create({
        data: {
          name: 'محمد سيد أحمد',
          phone: '01234567890',
          nationalId: '11122233344455',
          address: 'الجيزة - الهرم',
          status: 'نشط',
          notes: 'عميل جديد'
        }
      }),
      prisma.customer.create({
        data: {
          name: 'نور علي محمد',
          phone: '01512345678',
          nationalId: '55566677788899',
          address: 'أسيوط - وسط المدينة',
          status: 'نشط',
          notes: 'عميلة من الصعيد'
        }
      })
    ]);

    // إنشاء الشركاء
    console.log('🤝 إنشاء الشركاء...');
    const partners = await Promise.all([
      prisma.partner.create({
        data: {
          name: 'شركة النور للتطوير العقاري',
          phone: '0221234567'
        }
      }),
      prisma.partner.create({
        data: {
          name: 'مجموعة الاستثمار العقاري',
          phone: '0234567890'
        }
      }),
      prisma.partner.create({
        data: {
          name: 'شركة البناء الحديث',
          phone: '0245678901'
        }
      }),
      prisma.partner.create({
        data: {
          name: 'شركة الإسكان المتطور',
          phone: '0256789012'
        }
      })
    ]);

    // إنشاء السماسرة
    console.log('🏢 إنشاء السماسرة...');
    const existingBrokers = await prisma.broker.findMany();
    let brokers;

    if (existingBrokers.length === 0) {
      brokers = await Promise.all([
        prisma.broker.create({
          data: {
            name: 'أحمد السمسار',
            phone: '01055566677'
          }
        }),
        prisma.broker.create({
          data: {
            name: 'محمد الوسيط',
            phone: '01177788899'
          }
        })
      ]);
    } else {
      brokers = existingBrokers;
    }

    // إنشاء الوحدات
    console.log('🏠 إنشاء الوحدات...');
    const existingUnits = await prisma.unit.findMany();
    let units;

    if (existingUnits.length === 0) {
      units = await Promise.all([
        // شقة في الدور الأول
        prisma.unit.create({
          data: {
            code: 'A-1-101',
            name: 'شقة 101',
            status: 'متاحة',
            area: '120',
            floor: '1',
            building: 'A',
            totalPrice: 1500000,
            unitType: 'سكني'
          }
        }),
        // شقة في الدور الثاني
        prisma.unit.create({
          data: {
            code: 'A-2-201',
            name: 'شقة 201',
            status: 'متاحة',
            area: '100',
            floor: '2',
            building: 'A',
            totalPrice: 1200000,
            unitType: 'سكني'
          }
        }),
        // شقة في الدور الثالث
        prisma.unit.create({
          data: {
            code: 'B-3-301',
            name: 'شقة 301',
            status: 'متاحة',
            area: '140',
            floor: '3',
            building: 'B',
            totalPrice: 1800000,
            unitType: 'سكني'
          }
        }),
        // مكتب في الدور الأرضي
        prisma.unit.create({
          data: {
            code: 'C-G-001',
            name: 'مكتب أرضي',
            status: 'متاحة',
            area: '80',
            floor: 'أرضي',
            building: 'C',
            totalPrice: 800000,
            unitType: 'تجاري'
          }
        }),
        // محل في الدور الأرضي
        prisma.unit.create({
          data: {
            code: 'C-G-002',
            name: 'محل تجاري',
            status: 'متاحة',
            area: '60',
            floor: 'أرضي',
            building: 'C',
            totalPrice: 600000,
            unitType: 'تجاري'
          }
        })
      ]);
    } else {
      units = existingUnits;
    }

    // ربط الشركاء بالوحدات (50% لكل شركة)
    console.log('🔗 ربط الشركاء بالوحدات...');
    for (const unit of units) {
      await Promise.all([
        prisma.unitPartner.create({
          data: {
            unitId: unit.id,
            partnerId: partners[0].id,
            percent: 50
          }
        }),
        prisma.unitPartner.create({
          data: {
            unitId: unit.id,
            partnerId: partners[1].id,
            percent: 50
          }
        })
      ]);
    }

    // إنشاء عقود متنوعة
    console.log('📋 إنشاء العقود...');

    // عقد كاش للشقة الأولى
    const cashContract = await prisma.contract.create({
      data: {
        code: `CTR-${Date.now()}-001`,
        unitId: units[0].id,
        customerId: customers[0].id,
        totalPrice: 1500000,
        downPayment: 1500000,
        discountAmount: 0,
        maintenanceDeposit: 50000,
        brokerName: brokers[0].name,
        brokerPercent: 2,
        brokerAmount: 30000,
        commissionSafeId: commissionSafe.id,
        type: 'cash',
        count: 1,
        extraAnnual: 0,
        annualPaymentValue: 0,
        start: new Date('2025-01-15')
      }
    });

    // عقد تقسيط للشقة الثانية
    const installmentContract = await prisma.contract.create({
      data: {
        code: `CTR-${Date.now()}-002`,
        unitId: units[1].id,
        customerId: customers[1].id,
        totalPrice: 1200000,
        downPayment: 300000,
        discountAmount: 50000,
        maintenanceDeposit: 40000,
        brokerName: brokers[1].name,
        brokerPercent: 2.5,
        brokerAmount: 30000,
        commissionSafeId: commissionSafe.id,
        type: 'installment',
        count: 36,
        extraAnnual: 0,
        annualPaymentValue: 0,
        start: new Date('2025-02-01')
      }
    });

    // عقد تقسيط طويل للشقة الثالثة
    const longInstallmentContract = await prisma.contract.create({
      data: {
        code: `CTR-${Date.now()}-003`,
        unitId: units[2].id,
        customerId: customers[2].id,
        totalPrice: 1800000,
        downPayment: 450000,
        discountAmount: 100000,
        maintenanceDeposit: 60000,
        type: 'installment',
        count: 60,
        extraAnnual: 0,
        annualPaymentValue: 0,
        start: new Date('2025-03-10')
      }
    });

    // عقد تجاري
    const commercialContract = await prisma.contract.create({
      data: {
        code: `CTR-${Date.now()}-004`,
        unitId: units[3].id,
        customerId: customers[3].id,
        totalPrice: 800000,
        downPayment: 200000,
        discountAmount: 0,
        maintenanceDeposit: 30000,
        type: 'installment',
        count: 24,
        extraAnnual: 0,
        annualPaymentValue: 0,
        start: new Date('2025-04-05')
      }
    });

    // إنشاء الأقساط
    console.log('💰 إنشاء الأقساط...');

    // أقساط العقد التقسيط الثاني (36 قسط)
    const installmentAmount = (1200000 - 300000 - 50000) / 36; // 77500 جنيه لكل قسط
    for (let i = 0; i < 36; i++) {
      const dueDate = new Date('2025-02-01');
      dueDate.setMonth(dueDate.getMonth() + i);

      await prisma.installment.create({
        data: {
          contractId: installmentContract.id,
          unitId: units[1].id,
          type: 'قسط شهري',
          amount: Math.round(installmentAmount * 100) / 100,
          originalAmount: Math.round(installmentAmount * 100) / 100,
          dueDate: dueDate,
          status: i < 6 ? 'مدفوع' : 'غير مدفوع', // أول 6 أقساط مدفوعة
          paymentDate: i < 6 ? new Date(dueDate.getTime() - 15 * 24 * 60 * 60 * 1000) : null
        }
      });
    }

    // أقساط العقد التقسيط الطويل (60 قسط)
    const longInstallmentAmount = (1800000 - 450000 - 100000) / 60; // 21666.67 جنيه لكل قسط
    for (let i = 0; i < 60; i++) {
      const dueDate = new Date('2025-03-10');
      dueDate.setMonth(dueDate.getMonth() + i);

      await prisma.installment.create({
        data: {
          contractId: longInstallmentContract.id,
          unitId: units[2].id,
          type: 'قسط شهري',
          amount: Math.round(longInstallmentAmount * 100) / 100,
          originalAmount: Math.round(longInstallmentAmount * 100) / 100,
          dueDate: dueDate,
          status: i < 3 ? 'مدفوع' : 'غير مدفوع', // أول 3 أقساط مدفوعة
          paymentDate: i < 3 ? new Date(dueDate.getTime() - 10 * 24 * 60 * 60 * 1000) : null
        }
      });
    }

    // أقساط العقد التجاري (24 قسط)
    const commercialInstallmentAmount = (800000 - 200000) / 24; // 25000 جنيه لكل قسط
    for (let i = 0; i < 24; i++) {
      const dueDate = new Date('2025-04-05');
      dueDate.setMonth(dueDate.getMonth() + i);

      await prisma.installment.create({
        data: {
          contractId: commercialContract.id,
          unitId: units[3].id,
          type: 'قسط شهري',
          amount: commercialInstallmentAmount,
          originalAmount: commercialInstallmentAmount,
          dueDate: dueDate,
          status: i < 2 ? 'مدفوع' : 'غير مدفوع', // أول قسطين مدفوعين
          paymentDate: i < 2 ? new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) : null
        }
      });
    }

    // إنشاء السندات
    console.log('📄 إنشاء السندات...');

    // سندات المدفوعات للأقساط
    const installments = await prisma.installment.findMany({
      where: { status: 'مدفوع' }
    });

    for (const installment of installments) {
      await prisma.voucher.create({
        data: {
          type: 'receipt',
          date: installment.paymentDate || new Date(),
          amount: installment.amount,
          safeId: mainSafe.id,
          description: `قسط عقد ${installment.contractId}`,
          payer: `عميل ${installment.contractId}`,
          linkedRef: installment.id
        }
      });
    }

    // سند صرف العمولات
    await Promise.all([
      prisma.voucher.create({
        data: {
          type: 'payment',
          date: new Date('2025-01-20'),
          amount: 30000,
          safeId: commissionSafe.id,
          description: `عمولة سمسار عقد ${cashContract.id}`,
          beneficiary: brokers[0].name,
          linkedRef: cashContract.id
        }
      }),
      prisma.voucher.create({
        data: {
          type: 'payment',
          date: new Date('2025-02-10'),
          amount: 30000,
          safeId: commissionSafe.id,
          description: `عمولة سمسار عقد ${installmentContract.id}`,
          beneficiary: brokers[1].name,
          linkedRef: installmentContract.id
        }
      })
    ]);

    // سندات إضافية للحركات المالية
    await Promise.all([
      // إيداع مقدم العقد الكاش
      prisma.voucher.create({
        data: {
          type: 'receipt',
          date: new Date('2025-01-15'),
          amount: 1500000,
          safeId: mainSafe.id,
          description: `مقدم عقد كاش ${cashContract.code}`,
          payer: customers[0].name,
          linkedRef: cashContract.id
        }
      }),
      // إيداع مقدم العقد التقسيط
      prisma.voucher.create({
        data: {
          type: 'receipt',
          date: new Date('2025-02-01'),
          amount: 300000,
          safeId: mainSafe.id,
          description: `مقدم عقد تقسيط ${installmentContract.code}`,
          payer: customers[1].name,
          linkedRef: installmentContract.id
        }
      }),
      // إيداع مقدم العقد الطويل
      prisma.voucher.create({
        data: {
          type: 'receipt',
          date: new Date('2025-03-10'),
          amount: 450000,
          safeId: mainSafe.id,
          description: `مقدم عقد تقسيط طويل ${longInstallmentContract.code}`,
          payer: customers[2].name,
          linkedRef: longInstallmentContract.id
        }
      }),
      // إيداع مقدم العقد التجاري
      prisma.voucher.create({
        data: {
          type: 'receipt',
          date: new Date('2025-04-05'),
          amount: 200000,
          safeId: mainSafe.id,
          description: `مقدم عقد تجاري ${commercialContract.code}`,
          payer: customers[3].name,
          linkedRef: commercialContract.id
        }
      })
    ]);

    // إنشاء تحويلات بين الخزن
    console.log('💸 إنشاء تحويلات بين الخزن...');
    await Promise.all([
      prisma.transfer.create({
        data: {
          fromSafeId: mainSafe.id,
          toSafeId: commissionSafe.id,
          amount: 60000,
          notes: 'تحويل عمولات السماسرة',
          date: new Date()
        }
      })
    ]);

    // إنشاء مجموعات الشركاء
    console.log('👥 إنشاء مجموعات الشركاء...');
    const partnerGroup = await prisma.partnerGroup.create({
      data: {
        name: 'مجموعة التطوير الرئيسية'
      }
    });

    // ربط الشركاء بالمجموعة
    await Promise.all(partners.map((partner, index) =>
      prisma.partnerGroupPartner.create({
        data: {
          partnerGroupId: partnerGroup.id,
          partnerId: partner.id,
          percent: 25 // 25% لكل شركة
        }
      })
    ));

    console.log('✅ تم إنشاء جميع البيانات التجريبية بنجاح!');
    console.log(`📊 ملخص البيانات المُنشأة:`);
    console.log(`   👥 العملاء: ${customers.length}`);
    console.log(`   🏠 الوحدات: ${units.length}`);
    console.log(`   🤝 الشركاء: ${partners.length}`);
    console.log(`   🏢 السماسرة: ${brokers.length}`);
    console.log(`   📋 العقود: ${4}`);
    console.log(`   💰 الأقساط: ${120}`);
    console.log(`   📄 السندات: ${15}`);
    console.log(`   🏦 الخزن: ${2}`);
    console.log(`   💸 التحويلات: ${1}`);
    console.log(`   👥 مجموعات الشركاء: ${1}`);

    return {
      customers,
      units,
      partners,
      brokers,
      contracts: [cashContract, installmentContract, longInstallmentContract, commercialContract],
      partnerGroup
    };

  } catch (error) {
    console.error('❌ حدث خطأ في إنشاء البيانات التجريبية:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الدالة
createTestData()
  .then(() => {
    console.log('🎉 انتهى إنشاء البيانات التجريبية!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل في إنشاء البيانات:', error);
    process.exit(1);
  });