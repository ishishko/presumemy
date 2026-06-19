import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // =========================================================
  // CONFIG
  // =========================================================
  await prisma.configuracionNegocio.create({
    data: {
      id: 1,
      nombre: 'MemyDeni',
      moneda: 'ARS',
      cancelacionAuto: false,
      diasEspera: 0,
    },
  })
  console.log('✅ ConfiguracionNegocio')

  // =========================================================
  // CATEGORIAS PRODUCTO (9)
  // =========================================================
  const categoriasProducto = await prisma.categoriaProducto.createMany({
    data: [
      { nombre: 'Decoración' },
      { nombre: 'Mesa' },
      { nombre: 'Repostería' },
      { nombre: 'Empaque' },
      { nombre: 'Globos' },
      { nombre: 'Invitaciones' },
      { nombre: 'Piñata' },
      { nombre: 'Favoritos' },
      { nombre: 'Varios' },
    ],
  })
  console.log(`✅ ${categoriasProducto.count} categorias_producto`)

  // =========================================================
  // CATEGORIAS INSUMO (8)
  // =========================================================
  const catPapel = await prisma.categoriaInsumo.create({ data: { nombre: 'Papel' } })
  const catPapelImpreso = await prisma.categoriaInsumo.create({ data: { nombre: 'Papel Impreso' } })
  const catPegamentos = await prisma.categoriaInsumo.create({ data: { nombre: 'Pegamentos' } })
  const catLibreria = await prisma.categoriaInsumo.create({ data: { nombre: 'Librería' } })
  const catCortes = await prisma.categoriaInsumo.create({ data: { nombre: 'Cortes' } })
  const catEmbalaje = await prisma.categoriaInsumo.create({ data: { nombre: 'Embalaje' } })
  const catMerceria = await prisma.categoriaInsumo.create({ data: { nombre: 'Mercería' } })
  const catVarios = await prisma.categoriaInsumo.create({ data: { nombre: 'Varios' } })

  console.log('✅ 8 categorias_insumo')

  // =========================================================
  // PROVEEDORES (8)
  // =========================================================
  const provDistribuidora = await prisma.proveedor.create({ data: { nombre: 'Distribuidora Papelera Norte' } })
  const provLibreria = await prisma.proveedor.create({ data: { nombre: 'Librería Central' } })
  const provEmpaques = await prisma.proveedor.create({ data: { nombre: 'Empaques del Pacífico' } })
  const provMercerias = await prisma.proveedor.create({ data: { nombre: 'Mercerías Don Lalo' } })
  const provCortes = await prisma.proveedor.create({ data: { nombre: 'Cortes Express' } })
  const provInsumos = await prisma.proveedor.create({ data: { nombre: 'Insumos GMD' } })
  const provPapeleria = await prisma.proveedor.create({ data: { nombre: 'Papelería La Estrella' } })
  const provImprenta = await prisma.proveedor.create({ data: { nombre: 'Imprenta Aurora' } })

  console.log('✅ 8 proveedores')

  // =========================================================
  // INSUMOS (18)
  // =========================================================
  const insumosData = [
    { code: 'I-1001', name: 'Cartulina opalina 220 g', catId: catPapel.id, stock: 18, min: 30, unit: 'pliego', costoPaquete: 220, cantidadPack: 10, provId: provDistribuidora.id },
    { code: 'I-1002', name: 'Papel kraft 70 g', catId: catPapel.id, stock: 8, min: 15, unit: 'pliego', costoPaquete: 180, cantidadPack: 10, provId: provDistribuidora.id },
    { code: 'I-1003', name: 'Papel madera A4', catId: catPapelImpreso.id, stock: 4, min: 20, unit: 'paquete', costoPaquete: 320, cantidadPack: 4, provId: provImprenta.id },
    { code: 'I-1004', name: 'Tarjetería impresa cumple', catId: catPapelImpreso.id, stock: 28, min: 12, unit: 'u', costoPaquete: 240, cantidadPack: 24, provId: provImprenta.id },
    { code: 'I-1005', name: 'Pegamento blanco 250 ml', catId: catPegamentos.id, stock: 12, min: 8, unit: 'bote', costoPaquete: 195, cantidadPack: 3, provId: provInsumos.id },
    { code: 'I-1006', name: 'Cinta doble faz 1 cm', catId: catPegamentos.id, stock: 2, min: 8, unit: 'rollo', costoPaquete: 360, cantidadPack: 12, provId: provInsumos.id },
    { code: 'I-1007', name: 'Cinta dorada 5 m', catId: catMerceria.id, stock: 3, min: 10, unit: 'rollo', costoPaquete: 175, cantidadPack: 5, provId: provMercerias.id },
    { code: 'I-1008', name: 'Listón satín 1 cm', catId: catMerceria.id, stock: 24, min: 20, unit: 'm', costoPaquete: 160, cantidadPack: 20, provId: provMercerias.id },
    { code: 'I-1009', name: 'Etiqueta circular 3 cm', catId: catLibreria.id, stock: 320, min: 100, unit: 'u', costoPaquete: 90, cantidadPack: 60, provId: provPapeleria.id },
    { code: 'I-1010', name: 'Stickers transparentes A4', catId: catLibreria.id, stock: 7, min: 20, unit: 'hoja', costoPaquete: 240, cantidadPack: 10, provId: provPapeleria.id },
    { code: 'I-1011', name: 'Cúter de precisión', catId: catCortes.id, stock: 5, min: 4, unit: 'u', costoPaquete: 280, cantidadPack: 4, provId: provCortes.id },
    { code: 'I-1012', name: 'Repuestos cúter pack 10', catId: catCortes.id, stock: 8, min: 12, unit: 'pack', costoPaquete: 110, cantidadPack: 1, provId: provCortes.id },
    { code: 'I-1013', name: 'Bolsa kraft con visor', catId: catEmbalaje.id, stock: 60, min: 40, unit: 'u', costoPaquete: 220, cantidadPack: 25, provId: provEmpaques.id },
    { code: 'I-1014', name: 'Caja golosinera 12×12', catId: catEmbalaje.id, stock: 22, min: 30, unit: 'u', costoPaquete: 380, cantidadPack: 10, provId: provEmpaques.id },
    { code: 'I-1015', name: 'Cinta dorada glitter 2 cm', catId: catMerceria.id, stock: 18, min: 10, unit: 'rollo', costoPaquete: 240, cantidadPack: 6, provId: provMercerias.id },
    { code: 'I-1016', name: 'Pintura acrílica blanca', catId: catVarios.id, stock: 2, min: 6, unit: 'bote', costoPaquete: 290, cantidadPack: 4, provId: provInsumos.id },
    { code: 'I-1017', name: 'Crayolas pastel 12 pcs', catId: catVarios.id, stock: 9, min: 8, unit: 'caja', costoPaquete: 145, cantidadPack: 3, provId: provLibreria.id },
    { code: 'I-1018', name: 'Plantillas Mickey set 4', catId: catCortes.id, stock: 4, min: 10, unit: 'plantilla', costoPaquete: 320, cantidadPack: 4, provId: provCortes.id },
  ]

  for (const ins of insumosData) {
    const costoUnitario = ins.costoPaquete / ins.cantidadPack
    await prisma.insumo.create({
      data: {
        nombre: ins.name,
        codigo: ins.code,
        categoriaId: ins.catId,
        unidad: ins.unit,
        stock: ins.stock,
        stockMinimo: ins.min,
        costoPaquete: ins.costoPaquete,
        cantidadPack: ins.cantidadPack,
        costoUnitario: costoUnitario,
        notas: '',
        fechaActualizacion: new Date(),
        proveedores: {
          create: {
            proveedorId: ins.provId,
            esPrincipal: true,
            precio: ins.costoPaquete,
          },
        },
      },
    })
  }
  console.log('✅ 18 insumos')

  // =========================================================
  // DISTRIBUCION GANANCIAS (3 filas fijas)
  // =========================================================
  await prisma.distribucionGanancia.createMany({
    data: [
      { nombre: 'Meme', porcentaje: 40 },
      { nombre: 'Pety', porcentaje: 30 },
      { nombre: 'Gastos', porcentaje: 30 },
    ],
  })
  console.log('✅ 3 distribucion_ganancias')

  // =========================================================
  // CLIENTES (seed inicial)
  // =========================================================
  const clientes = [
    'Marisol Aguirre',
    'Laura Domínguez',
    'Café del Centro',
    'Pau Hernández',
    'Familia Rojas',
    'Estudio Pétalo',
    'Andrea Vázquez',
    'Iván Castillo',
  ]

  let idx = 1
  for (const nombre of clientes) {
    await prisma.cliente.create({
      data: {
        nombre,
        codigo: `TEMP-${idx++}-${Date.now()}`,
        contactos: {
          create: {
            canal: 'instagram',
            valor: '',
            esPrincipal: true,
          },
        },
      },
    })
  }

  // Actualizar codigos con formato C-{id}
  const clientesCreados = await prisma.cliente.findMany({ orderBy: { id: 'asc' } })
  for (const c of clientesCreados) {
    await prisma.cliente.update({
      where: { id: c.id },
      data: { codigo: `C-${c.id}` },
    })
  }
  console.log(`✅ ${clientes.length} clientes`)

  console.log('🎉 Seed completo!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
