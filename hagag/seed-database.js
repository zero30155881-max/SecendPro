const { Pool } = require('pg')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function seedDatabase() {
  try {
    console.log('🔄 Seeding database with sample data...')
    
    // Sample customers
    const customers = [
      { name: 'أحمد محمد', phone: '0501234567', national_id: '1234567890', address: 'الرياض، حي النرجس' },
      { name: 'فاطمة علي', phone: '0502345678', national_id: '1234567891', address: 'جدة، حي الزهراء' },
      { name: 'محمد عبدالله', phone: '0503456789', national_id: '1234567892', address: 'الدمام، حي الفردوس' },
      { name: 'نورا سعد', phone: '0504567890', national_id: '1234567893', address: 'الرياض، حي الورود' },
      { name: 'خالد أحمد', phone: '0505678901', national_id: '1234567894', address: 'جدة، حي الروضة' }
    ]
    
    for (const customer of customers) {
      await pool.query(
        'INSERT INTO customers (name, phone, national_id, address) VALUES ($1, $2, $3, $4)',
        [customer.name, customer.phone, customer.national_id, customer.address]
      )
    }
    console.log('✅ Customers seeded')
    
    // Sample units
    const units = [
      { code: 'A101', name: 'شقة 101', unit_type: 'سكني', area: '120', floor: '1', building: 'مبنى أ', total_price: 500000 },
      { code: 'A102', name: 'شقة 102', unit_type: 'سكني', area: '120', floor: '1', building: 'مبنى أ', total_price: 500000 },
      { code: 'A201', name: 'شقة 201', unit_type: 'سكني', area: '150', floor: '2', building: 'مبنى أ', total_price: 600000 },
      { code: 'B101', name: 'محل 101', unit_type: 'تجاري', area: '80', floor: '1', building: 'مبنى ب', total_price: 800000 },
      { code: 'B102', name: 'محل 102', unit_type: 'تجاري', area: '80', floor: '1', building: 'مبنى ب', total_price: 800000 },
      { code: 'C101', name: 'مكتب 101', unit_type: 'مكتبي', area: '100', floor: '1', building: 'مبنى ج', total_price: 700000 }
    ]
    
    for (const unit of units) {
      await pool.query(
        'INSERT INTO units (code, name, unit_type, area, floor, building, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [unit.code, unit.name, unit.unit_type, unit.area, unit.floor, unit.building, unit.total_price]
      )
    }
    console.log('✅ Units seeded')
    
    // Sample safes
    const safes = [
      { name: 'الخزنة الرئيسية', balance: 1000000 },
      { name: 'خزنة المبيعات', balance: 500000 },
      { name: 'خزنة الإيجارات', balance: 300000 }
    ]
    
    for (const safe of safes) {
      await pool.query(
        'INSERT INTO safes (name, balance) VALUES ($1, $2)',
        [safe.name, safe.balance]
      )
    }
    console.log('✅ Safes seeded')
    
    // Sample partners
    const partners = [
      { name: 'شركة البناء المتقدم', phone: '0112345678' },
      { name: 'مؤسسة التطوير العقاري', phone: '0123456789' },
      { name: 'شركة الاستثمار العقاري', phone: '0134567890' }
    ]
    
    for (const partner of partners) {
      await pool.query(
        'INSERT INTO partners (name, phone) VALUES ($1, $2)',
        [partner.name, partner.phone]
      )
    }
    console.log('✅ Partners seeded')
    
    // Sample brokers
    const brokers = [
      { name: 'عبدالرحمن السعد', phone: '0501111111' },
      { name: 'سارة المطيري', phone: '0502222222' },
      { name: 'محمد القحطاني', phone: '0503333333' }
    ]
    
    for (const broker of brokers) {
      await pool.query(
        'INSERT INTO brokers (name, phone) VALUES ($1, $2)',
        [broker.name, broker.phone]
      )
    }
    console.log('✅ Brokers seeded')
    
    // Sample vouchers
    const vouchers = [
      { type: 'receipt', date: '2024-01-15', amount: 50000, safe_id: 1, description: 'دفعة مقدمة من العميل أحمد محمد', payer: 'أحمد محمد' },
      { type: 'receipt', date: '2024-01-16', amount: 30000, safe_id: 1, description: 'دفعة مقدمة من العميلة فاطمة علي', payer: 'فاطمة علي' },
      { type: 'payment', date: '2024-01-17', amount: 10000, safe_id: 1, description: 'دفع عمولة السمسار عبدالرحمن السعد', beneficiary: 'عبدالرحمن السعد' }
    ]
    
    for (const voucher of vouchers) {
      await pool.query(
        'INSERT INTO vouchers (type, date, amount, safe_id, description, payer, beneficiary) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [voucher.type, voucher.date, voucher.amount, voucher.safe_id, voucher.description, voucher.payer, voucher.beneficiary]
      )
    }
    console.log('✅ Vouchers seeded')
    
    console.log('🎉 Database seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seedDatabase()