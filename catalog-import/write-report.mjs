import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('source-audit.json'));const db=JSON.parse(fs.readFileSync('database-audit.json'));const map=JSON.parse(fs.readFileSync('database-map.json'));
const text=`IMPORTACIÓN DEL CATÁLOGO DE BABY HOGAR INFANTIL
Fecha de informe: ${new Date().toISOString()}
Origen: https://babyhogarinfantil.com (solo información pública)
Destino: PrestaShop local, http://localhost:8080/

RESULTADO
Productos detectados: ${source.expected}
Productos descargados: ${source.downloaded}
Productos importados en la base de datos: ${db.imported}
Fotografías locales: ${db.images}
Combinaciones de producto: ${db.combinations}
Marcas de origen: ${source.brands.length}
Categorías creadas, incluidos grupos de navegación: ${Object.keys(map.categories).length}
Productos pendientes: ${db.missing.length}
Discrepancias entre datos importados y descargados: ${db.errors.length}
Validación completa de importación: ${db.valid?'CORRECTA':'PENDIENTE / REVISAR'}

DATOS INCLUIDOS
Nombres, descripciones, referencias, marcas, categorías, características, precios, descuentos, fotografías, tallas/combinaciones y cantidades publicadas. Fechas originales conservadas para las novedades. Las cantidades son una captura de la web pública, no una conexión con el inventario interno.
Los 19 productos de ejemplo de PrestaShop se conservan desactivados. No se han borrado. Sus categorías y marcas sin productos activos también se desactivaron. La ventana local de novedades se configuró en 35 días para reproducir los nueve productos marcados como nuevos en la fuente, conservando las fechas originales.

LIMITACIONES DE LA FUENTE
${source.withoutImages.length} productos sin fotografías disponibles en las respuestas públicas, también después de revisar variantes.
${source.stockTotalDiscrepancies.length} productos cuyo total de stock público difiere de la suma de sus variantes visibles. Se han conservado las cantidades publicadas por variante, sin repartir ni inventar la diferencia.
${source.zeroPrices.length} productos con precio público cero: compra deshabilitada hasta revisar y asignar el precio correcto.
${source.unknownStock.length} variantes sin cantidad pública verificable; cuando falta, se importa cero para no inventar existencias.
${source.unidentifiedDefaultCategory.length} productos con categoría predeterminada sin identificar públicamente; conservan las categorías conocidas en las que fueron encontrados.
${source.issues.length} fichas con otras incidencias de descarga.
No se incluyen productos ocultos o no publicados, clientes, pedidos, contraseñas ni datos privados de la tienda original. No existe sincronización automática con la tienda original.

ARCHIVOS DE AUDITORÍA
source-audit.json: incidencias y limitaciones por producto.
database-audit.json: comprobación de precios, cantidades, imágenes y productos pendientes.
database-map.json: correspondencias entre identificadores de origen y PrestaShop.
migration/discovery.json: los ${source.publicListings} listados públicos y sus recuentos.
migration/stage/products/: datos por producto, con URL y fecha de observación.
migration/stage/assets/: fotografías descargadas.

COPIA PREVIA
D:\\IA\\ChatGPT\\backups\\prestashop-antes-catalogo-20261027-204952\\prestashop.sql
El archivo .sha256 adjunto permite comprobar su integridad. Contiene la base de datos local anterior a esta importación. Restaurarla reemplazaría los datos actuales; antes de restaurar debe hacerse una nueva copia del estado que quieras conservar.

ABRIR LA TIENDA
http://localhost:8080/
Administración: http://localhost:8080/administracion-baby/
Los productos se editan en Catálogo > Productos.
`;
fs.writeFileSync('INFORME-IMPORTACION.txt',text);
fs.writeFileSync('PRODUCTOS-SIN-FOTO.txt',source.withoutImages.map(p=>`${p.id} | ${p.name}\n${p.url}\n`).join('\n'));
console.log(text.slice(0,text.indexOf('DATOS INCLUIDOS')));



