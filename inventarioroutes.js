// ====================================================================
// ARCHIVO: inventarioRoutes.js
// Rutas para la gestión del inventario de la cafetería
// ====================================================================

module.exports = function(pool) {
  const express = require('express');
  const router = express.Router();

  // 1️⃣ Obtener un producto específico del inventario por ID
  router.get('/producto/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      console.log(`🔍 Solicitando producto ID: ${id}`);
      
      const query = `
        SELECT 
          IdInventario,
          NombreProducto,
          UnidadesSinAbrir,
          MinUnidades,
          MaxUnidades,
          CantidadAbierta,
          MinCantidad,
          MaxCantidad,
          EquivalenciaUnidad,
          TotalCantidad,
          UnidadMedida
        FROM inventario 
        WHERE IdInventario = ?
      `;
      
      const [results] = await pool.query(query, [id]);
      
      if (results.length > 0) {
        const producto = results[0];
        
        // Si no tiene UnidadMedida definida, determinarla por el nombre
        if (!producto.UnidadMedida) {
          const nombreLower = producto.NombreProducto.toLowerCase();
          
          if (nombreLower.includes('leche') || nombreLower.includes('agua')) {
            producto.UnidadMedida = "L";
          } else if (nombreLower.includes('jarabe') || nombreLower.includes('crema')) {
            producto.UnidadMedida = "mL";
          } else {
            producto.UnidadMedida = "g";
          }
        }
        
        console.log(`✅ Producto encontrado: ${producto.NombreProducto}`);
        
        res.json({
          success: true,
          producto: producto
        });
      } else {
        console.log(`❌ Producto no encontrado: ${id}`);
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
    } catch (error) {
      console.error('❌ Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });

  // 2️⃣ Actualizar un producto del inventario (CORREGIDO - EquivalenciaUnidad)
  router.put('/producto/:id', async (req, res) => {
    const { id } = req.params;
    const { unidades_sin_abrir, cantidad_abierta } = req.body;
    
    console.log('📥 Recibiendo actualización:', { 
      id, 
      unidades_sin_abrir, 
      cantidad_abierta 
    });
    
    try {
      // Validar que los datos existen
      if (unidades_sin_abrir === undefined || cantidad_abierta === undefined) {
        console.log('❌ Datos incompletos en la solicitud');
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos: unidades_sin_abrir y cantidad_abierta son requeridos'
        });
      }

      // Validar tipos de datos
      const unidades = parseInt(unidades_sin_abrir);
      const cantidad = parseFloat(cantidad_abierta);
      
      if (isNaN(unidades) || isNaN(cantidad)) {
        console.log('❌ Datos inválidos:', { unidades_sin_abrir, cantidad_abierta });
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos: unidades_sin_abrir debe ser entero y cantidad_abierta debe ser número'
        });
      }

      console.log(`🔄 Actualizando producto ID: ${id} con unidades: ${unidades}, cantidad: ${cantidad}`);
      
      // SOLO actualizar UnidadesSinAbrir y CantidadAbierta
      // TotalCantidad se calcula AUTOMÁTICAMENTE por MySQL (columna GENERATED)
      const updateQuery = `
        UPDATE inventario 
        SET UnidadesSinAbrir = ?,
            CantidadAbierta = ?,
            FechaActualizacion = CURRENT_TIMESTAMP
        WHERE IdInventario = ?
      `;
      
      const [result] = await pool.query(updateQuery, [
        unidades, 
        cantidad, 
        id
      ]);
      
      if (result.affectedRows === 0) {
        console.log(`❌ No se afectaron filas en la actualización: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'No se pudo actualizar el producto - ninguna fila afectada'
        });
      }
      
      // Obtener el producto actualizado para devolver el TotalCantidad calculado automáticamente
      const selectQuery = `
        SELECT 
          IdInventario,
          NombreProducto,
          UnidadesSinAbrir,
          CantidadAbierta,
          EquivalenciaUnidad,
          TotalCantidad,
          UnidadMedida
        FROM inventario 
        WHERE IdInventario = ?
      `;
      
      const [updatedProduct] = await pool.query(selectQuery, [id]);
      
      if (updatedProduct.length === 0) {
        console.log(`❌ No se pudo obtener el producto actualizado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Producto actualizado pero no se pudo obtener la información actualizada'
        });
      }
      
      const producto = updatedProduct[0];
      
      console.log(`✅ Producto actualizado correctamente. Filas afectadas: ${result.affectedRows}`);
      console.log(`📊 Total calculado por MySQL: ${producto.TotalCantidad}`);
      
      res.json({
        success: true,
        message: 'Producto actualizado correctamente',
        total_cantidad: parseFloat(producto.TotalCantidad),
        unidades_actualizadas: unidades,
        cantidad_actualizada: cantidad,
        producto: {
          id: producto.IdInventario,
          nombre: producto.NombreProducto,
          unidades_sin_abrir: producto.UnidadesSinAbrir,
          cantidad_abierta: producto.CantidadAbierta,
          total_cantidad: parseFloat(producto.TotalCantidad),
          unidad_medida: producto.UnidadMedida,
          equivalencia_unidad: producto.EquivalenciaUnidad
        }
      });
      
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor: ' + error.message
      });
    }
  });

  // 3️⃣ Obtener todos los productos de inventario por categoría
  router.get('/categoria/:idCategoria', async (req, res) => {
    const { idCategoria } = req.params;
    
    try {
      console.log(`📦 Solicitando productos de categoría: ${idCategoria}`);
      
      const query = `
        SELECT 
          i.IdInventario,
          i.NombreProducto,
          i.UnidadesSinAbrir,
          i.MinUnidades,
          i.MaxUnidades,
          i.CantidadAbierta,
          i.MinCantidad,
          i.MaxCantidad,
          i.EquivalenciaUnidad,
          i.TotalCantidad,
          i.UnidadMedida,
          i.FechaActualizacion,
          c.Nombre as Categoria
        FROM inventario i
        JOIN categorias_inventario c ON i.IdCategoriaInventario = c.IdCategoriaInventario
        WHERE i.IdCategoriaInventario = ?
        ORDER BY i.NombreProducto
      `;
      
      const [results] = await pool.query(query, [idCategoria]);
      console.log(`✅ Encontrados ${results.length} productos para categoría ${idCategoria}`);
      
      // Agregar unidad de medida a cada producto si no la tiene
      const productosConUnidad = results.map(producto => {
        if (!producto.UnidadMedida) {
          const nombreLower = producto.NombreProducto.toLowerCase();
          
          if (nombreLower.includes('leche') || nombreLower.includes('agua')) {
            producto.UnidadMedida = "L";
          } else if (nombreLower.includes('jarabe') || nombreLower.includes('crema')) {
            producto.UnidadMedida = "mL";
          } else {
            producto.UnidadMedida = "g";
          }
        }
        
        return producto;
      });
      
      res.json(productosConUnidad);
    } catch (error) {
      console.error('❌ Error al obtener productos por categoría:', error);
      res.status(500).json({ 
        error: 'Error al obtener productos',
        detalles: error.message
      });
    }
  });

  // 4️⃣ Obtener todas las categorías de inventario
  router.get('/categorias', async (req, res) => {
    try {
      console.log('📂 Solicitando categorías de inventario');
      
      const query = `
        SELECT 
          IdCategoriaInventario,
          Nombre,
          Descripcion
        FROM categorias_inventario
        ORDER BY Nombre
      `;
      
      const [results] = await pool.query(query);
      console.log(`✅ Encontradas ${results.length} categorías`);
      
      res.json(results);
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      res.status(500).json({ 
        error: 'Error al obtener categorías',
        detalles: error.message
      });
    }
  });

  // 5️⃣ Crear nuevo producto en inventario (CORREGIDO - EquivalenciaUnidad)
  router.post('/producto', async (req, res) => {
    const {
      IdCategoriaInventario,
      NombreProducto,
      UnidadesSinAbrir,
      MinUnidades,
      MaxUnidades,
      CantidadAbierta,
      MinCantidad,
      MaxCantidad,
      EquivalenciaUnidad,
      UnidadMedida
    } = req.body;
    
    try {
      console.log('➕ Creando nuevo producto:', { NombreProducto, IdCategoriaInventario });
      
      // NO incluir TotalCantidad en el INSERT - se calcula automáticamente
      const query = `
        INSERT INTO inventario (
          IdCategoriaInventario,
          NombreProducto,
          UnidadesSinAbrir,
          MinUnidades,
          MaxUnidades,
          CantidadAbierta,
          MinCantidad,
          MaxCantidad,
          EquivalenciaUnidad,
          UnidadMedida
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.query(query, [
        IdCategoriaInventario,
        NombreProducto,
        UnidadesSinAbrir || 0,
        MinUnidades || 0,
        MaxUnidades || 0,
        CantidadAbierta || 0,
        MinCantidad || 0,
        MaxCantidad || 0,
        EquivalenciaUnidad || 0,
        UnidadMedida || 'g'
      ]);
      
      console.log(`✅ Producto creado correctamente. ID: ${result.insertId}`);
      
      res.status(201).json({
        success: true,
        message: 'Producto creado correctamente',
        id: result.insertId
      });
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear producto: ' + error.message
      });
    }
  });

  // 6️⃣ Eliminar producto del inventario
  router.delete('/producto/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      console.log(`🗑️ Eliminando producto ID: ${id}`);
      
      const query = 'DELETE FROM inventario WHERE IdInventario = ?';
      const [result] = await pool.query(query, [id]);
      
      if (result.affectedRows === 0) {
        console.log(`❌ Producto no encontrado para eliminar: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      
      console.log(`✅ Producto eliminado correctamente. Filas afectadas: ${result.affectedRows}`);
      
      res.json({
        success: true,
        message: 'Producto eliminado correctamente'
      });
    } catch (error) {
      console.error('❌ Error al eliminar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar producto: ' + error.message
      });
    }
  });

  // 7️⃣ Endpoint de salud/verificación (para debugging)
  router.get('/status', async (req, res) => {
    try {
      console.log('🔍 Verificando estado del servicio de inventario');
      
      // Verificar conexión a la base de datos
      const [dbResult] = await pool.query('SELECT 1 as test');
      
      // Verificar tablas existentes
      const [tablas] = await pool.query('SHOW TABLES LIKE "inventario"');
      const [categorias] = await pool.query('SHOW TABLES LIKE "categorias_inventario"');
      
      // Contar productos
      const [conteoProductos] = await pool.query('SELECT COUNT(*) as total FROM inventario');
      
      res.json({
        status: 'ok',
        database: dbResult.length > 0 ? 'conectado' : 'error',
        tablas: {
          inventario: tablas.length > 0,
          categorias_inventario: categorias.length > 0
        },
        total_productos: conteoProductos[0].total,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error en endpoint de status:', error);
      res.status(500).json({
        status: 'error',
        error: error.message
      });
    }
  });

  return router;
};