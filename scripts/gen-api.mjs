// Membuat tipe klien dari OpenAPI backend.
// Pemakaian: npm run gen:api -- ./path/ke/openapi.json
// Berkas OpenAPI backend diunduh dari api/v1/openapi.json di lingkungan lokal.
import { existsSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2]

if (!input) {
  console.error('Pemakaian: npm run gen:api -- ./path/ke/openapi.json')
  process.exit(1)
}

if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) {
  console.error('Berikan path berkas lokal, bukan URL.')
  process.exit(1)
}

const file = resolve(process.cwd(), input)
if (!existsSync(file) || !statSync(file).isFile()) {
  console.error(`Berkas tidak ditemukan: ${input}`)
  process.exit(1)
}

const output = resolve(root, 'src/api/schema.d.ts')
const ast = await openapiTS(pathToFileURL(file))
writeFileSync(output, astToString(ast))
console.log('Tipe API ditulis ke src/api/schema.d.ts')
