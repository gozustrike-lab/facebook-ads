// scripts/db-push.js
// Ejecuta prisma db push usando la conexión DIRECTA (no el pooler)
// El pooler (pgbouncer) NO soporta CREATE TABLE / DDL
// Este script se ejecuta durante el build de Vercel

const { execSync } = require('child_process')

const directUrl = process.env.DIRECT_URL
const dbUrl = process.env.DATABASE_URL

console.log('🔧 DB Push Script — Creando tablas en PostgreSQL')
console.log(`   DIRECT_URL set: ${!!directUrl}`)
console.log(`   DATABASE_URL set: ${!!dbUrl}`)

if (!directUrl && !dbUrl) {
  console.log('⚠️ Ni DIRECT_URL ni DATABASE_URL están configuradas. Saltando db push.')
  process.exit(0)
}

// Para prisma db push, necesitamos la conexión DIRECTA (no el pooler)
// porque pgbouncer NO soporta DDL (CREATE TABLE, ALTER TABLE, etc.)
const urlForPush = directUrl || dbUrl

console.log(`   Usando URL para db push: ${urlForPush.replace(/:[^:@]+@/, ':****@')}`)

try {
  console.log('📦 Ejecutando prisma db push...')
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    env: { ...process.env, DATABASE_URL: urlForPush },
    stdio: 'inherit',
    timeout: 60000,
  })
  console.log('✅ Tablas creadas exitosamente')
} catch (err) {
  console.log('⚠️ prisma db push falló. Las tablas se crearán via /api/setup en runtime.')
  console.log('   Error:', err.message?.substring(0, 200) || err)
  // No fallar el build — las tablas se pueden crear via /api/setup
  process.exit(0)
}
