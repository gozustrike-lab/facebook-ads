// scripts/db-push.js
// Ejecuta prisma db push usando cualquier conexión disponible
// Prioriza DIRECT_URL, pero si no funciona usa DATABASE_URL (pooler)
// El pooler con $executeRawUnsafe() SÍ soporta DDL

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

// Intentar con DIRECT_URL primero, luego DATABASE_URL
const urlsToTry = [directUrl, dbUrl].filter(Boolean)
let success = false

for (const url of urlsToTry) {
  const isDirect = url.includes('.supabase.co:5432')
  const label = isDirect ? 'DIRECT_URL (conexión directa)' : 'DATABASE_URL (pooler)'
  console.log(`\n🔗 Intentando con ${label}...`)
  console.log(`   Host: ${url.replace(/:[^:@]+@/, ':****@')}`)

  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'inherit',
      timeout: 60000,
    })
    console.log(`✅ Tablas creadas exitosamente via ${label}`)
    success = true
    break
  } catch (err) {
    console.log(`⚠️ Falló con ${label}. Intentando siguiente...`)
  }
}

if (!success) {
  console.log('⚠️ prisma db push falló con todas las URLs.')
  console.log('   Las tablas se crearán via /api/setup en runtime.')
}

// No fallar el build
process.exit(0)
