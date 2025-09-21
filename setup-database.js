const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...')
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'database-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute schema
    await pool.query(schema)
    
    console.log('✅ Database schema created successfully!')
    
    // Test connection
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connection test successful:', result.rows[0].now)
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupDatabase()