// ==================== CONFIGURACIÓN ====================
const API_URL = 'http://localhost:3000';

// ==================== ELEMENTOS DEL DOM ====================
const modal = document.getElementById('modal_editar');
const spanCerrar = document.getElementsByClassName('cerrar')[0];
const btnCancelar = document.querySelector('.btn_cancelar');
const formModal = document.getElementById('form_modal');
const inputNombreProducto = document.getElementById('nombre_producto');
const cantidadTotalInput = document.getElementById('cantidad_total');
const contenedorInventario = document.querySelector('.inventario');

// ==================== ELEMENTOS DEL MODAL ORDENAR ====================
const ordenModal = document.getElementById('ordenModal');
const closeButton = ordenModal?.querySelector('.close-button');
const ordenForm = document.getElementById('ordenForm');
const productoTitulo = document.getElementById('productoTitulo');
const ordenProductoNombre = document.getElementById('ordenProductoNombre');
const ordenDestinoInput = document.getElementById('ordenDestino');

let productoActual = null;
let productoNombreActual = null;

// ==================== FUNCIONES PRINCIPALES ====================

// Determinar categoría actual basada en la página
function obtenerCategoriaActual() {
    const url = window.location.pathname;
    const nombreArchivo = url.substring(url.lastIndexOf('/') + 1);
    
    const mapeoCategorias = {
        'inventario_bebidas.html': 1,  // Bebidas
        'inventario_comidas.html': 2,  // Comida
        'inventario_envases.html': 3,  // Envases
        'inventario_limpieza.html': 4, // Limpieza
        'inventario_menu.html': 1      // Bebidas por defecto
    };
    
    return mapeoCategorias[nombreArchivo] || 1;
}

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const categoriaId = obtenerCategoriaActual();
        console.log(`🔍 Cargando productos de categoría ${categoriaId}...`);
        
        const response = await fetch(`${API_URL}/api/inventario/categoria/${categoriaId}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const productos = await response.json();
        console.log(`✅ ${productos.length} productos recibidos`);
        
        actualizarCantidadesProductos(productos);
        
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        mostrarErrorCarga(error);
    }
}

// Actualizar cantidades de productos existentes
function actualizarCantidadesProductos(productos) {
    const productosExistentes = document.querySelectorAll('.producto');
    
    productosExistentes.forEach(productoElement => {
        const nombreProducto = productoElement.querySelector('.nombre_del_producto')?.textContent?.trim();
        
        if (!nombreProducto) return;
        
        const productoBD = productos.find(p => p.NombreProducto?.trim() === nombreProducto);
        
        if (productoBD) {
            const inputCantidad = productoElement.querySelector('.cantidad_producto');
            if (inputCantidad) {
                inputCantidad.value = parseInt(productoBD.Cantidad) || 0;
            }
        }
    });
    
    agregarEventListeners();
}

// Obtener ID del producto por nombre
async function obtenerIdProducto(nombreProducto) {
    try {
        const categoriaId = obtenerCategoriaActual();
        const response = await fetch(`${API_URL}/api/inventario/categoria/${categoriaId}`);
        const productos = await response.json();
        
        const producto = productos.find(p => 
            p.NombreProducto?.trim().toLowerCase() === nombreProducto.trim().toLowerCase()
        );
        
        return producto ? producto.IdInventario : null;
    } catch (error) {
        console.error('Error al obtener ID del producto:', error);
        return null;
    }
}

// Obtener configuración del producto
async function obtenerConfiguracionProducto(idProducto) {
    try {
        const response = await fetch(`${API_URL}/api/inventario/producto/${idProducto}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            return {
                id: data.producto.IdInventario,
                nombre: data.producto.NombreProducto,
                cantidadActual: parseInt(data.producto.Cantidad) || 0
            };
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ Error al obtener configuración:', error);
        alert('Error al cargar los datos del producto');
        return null;
    }
}

// Abrir modal para editar
async function abrirModal(nombreProducto) {
    try {
        console.log(`📝 Abriendo modal para producto: ${nombreProducto}`);
        
        // Obtener ID del producto por nombre
        const idProducto = await obtenerIdProducto(nombreProducto);
        
        if (!idProducto) {
            alert('Error: No se encontró el producto en la base de datos');
            return;
        }
        
        const config = await obtenerConfiguracionProducto(idProducto);
        
        if (!config) {
            alert('No se pudieron cargar los datos del producto');
            return;
        }
        
        productoNombreActual = nombreProducto;
        
        // Configurar modal
        inputNombreProducto.value = config.nombre;
        cantidadTotalInput.value = config.cantidadActual;
        
        // Enfocar el input de cantidad
        setTimeout(() => {
            cantidadTotalInput.focus();
            cantidadTotalInput.select();
        }, 100);
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('❌ Error al abrir modal:', error);
        alert('Error al abrir el editor: ' + error.message);
    }
}

// Actualizar producto en la base de datos
async function actualizarProducto(nombreProducto, nuevaCantidad) {
    try {
        console.log(`🔄 Actualizando producto: ${nombreProducto} a cantidad: ${nuevaCantidad}`);
        
        // Obtener ID del producto
        const idProducto = await obtenerIdProducto(nombreProducto);
        
        if (!idProducto) {
            alert('Error: No se encontró el producto en la base de datos');
            return;
        }
        
        const response = await fetch(`${API_URL}/api/inventario/producto/${idProducto}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cantidad: nuevaCantidad
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Producto actualizado correctamente');
            
            // Actualizar la cantidad en el DOM
            if (productoActual) {
                const inputCantidad = productoActual.querySelector('.cantidad_producto');
                if (inputCantidad) {
                    inputCantidad.value = nuevaCantidad;
                }
            }
            
            // Cerrar modal y mostrar éxito
            cerrarModal();
            alert('¡Inventario actualizado correctamente!');
            
        } else {
            throw new Error(data.message || 'Error al actualizar el producto');
        }
        
    } catch (error) {
        console.error('❌ Error al actualizar producto:', error);
        alert('Error al actualizar el producto: ' + error.message);
    }
}

// ==================== FUNCIONES PARA REPORTE DE INVENTARIO ====================

// Cargar reporte completo de inventario
async function cargarReporteInventario() {
    try {
        console.log('📊 Cargando reporte de inventario completo...');
        
        // Obtener datos de todas las categorías
        const categorias = [
            { id: 1, nombre: 'Bebidas' },
            { id: 2, nombre: 'Comidas' },
            { id: 3, nombre: 'Envases' },
            { id: 4, nombre: 'Limpieza' }
        ];
        
        let inventarioCompleto = [];

        // Cargar productos de cada categoría
        for (const categoria of categorias) {
            try {
                const response = await fetch(`${API_URL}/api/inventario/categoria/${categoria.id}`);
                
                if (response.ok) {
                    const productos = await response.json();
                    
                    // Agregar información de categoría a cada producto
                    const productosConCategoria = productos.map(producto => ({
                        ...producto,
                        Categoria: categoria.nombre
                    }));
                    
                    inventarioCompleto = inventarioCompleto.concat(productosConCategoria);
                }
            } catch (error) {
                console.log(`Error cargando ${categoria.nombre}:`, error);
            }
        }

        // Generar y mostrar el reporte
        generarHTMLReporte(inventarioCompleto);

    } catch (error) {
        console.error('❌ Error al cargar reporte de inventario:', error);
        const tablaReporteInventario = document.getElementById('tablaReporteInventario');
        if (tablaReporteInventario) {
            tablaReporteInventario.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                    <h3>Error al cargar el reporte</h3>
                    <p>${error.message}</p>
                    <button onclick="cargarReporteInventario()" class="btn-reportes" style="margin-top: 10px;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Generar HTML del reporte con diseño IDÉNTICO al panel
function generarHTMLReporte(inventario) {
    const tablaReporteInventario = document.getElementById('tablaReporteInventario');
    if (!tablaReporteInventario) {
        console.error('❌ No se encontró el elemento tablaReporteInventario');
        return;
    }

    // Ordenar por IdInventario (numéricamente)
    inventario.sort((a, b) => {
        const idA = parseInt(a.IdInventario) || 0;
        const idB = parseInt(b.IdInventario) || 0;
        return idA - idB; // Orden ascendente por ID
    });

    let html = `
        <table class="detail-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Cantidad</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Generar filas de productos
    inventario.forEach(item => {
        const cantidad = parseInt(item.Cantidad) || 0;
        
        html += `
                <tr>
                    <td>${item.IdInventario || 'N/A'}</td>
                    <td>${item.NombreProducto || 'Producto sin nombre'}</td>
                    <td>${item.Categoria}</td>
                    <td>${cantidad}</td>
                </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    console.log('🔄 Generando HTML del reporte con diseño idéntico al panel...');
    tablaReporteInventario.innerHTML = html;
}

// Abrir modal de reporte
function abrirModalReporte() {
    const modalReporteInventario = document.getElementById('modalReporteInventario');
    if (modalReporteInventario) {
        modalReporteInventario.style.display = 'flex';
        console.log('✅ Modal abierto, cargando reporte...');
        cargarReporteInventario();
    } else {
        console.error('❌ Modal de reporte no encontrado');
    }
}

// Cerrar modal de reporte
function cerrarModalReporte() {
    const modalReporteInventario = document.getElementById('modalReporteInventario');
    if (modalReporteInventario) {
        modalReporteInventario.style.display = 'none';
    }
}

// ==================== FUNCIONES PARA CORREOS ====================

// Función para Abrir el Modal de Ordenar
function abrirModalOrdenar(nombreProducto) {
    if (productoTitulo && ordenProductoNombre) {
        productoTitulo.textContent = nombreProducto;
        ordenProductoNombre.value = nombreProducto;
        document.getElementById('ordenCantidad').value = 1; 
        document.getElementById('ordenMotivo').value = '';
        ordenModal.style.display = 'flex';
    } else {
        console.error('❌ Elementos del modal de ordenar no encontrados');
    }
}

// Envío de orden por correo
async function enviarOrdenCorreo(orderData) {
    try {
        console.log('📧 Enviando orden:', orderData);

        const response = await fetch(`${API_URL}/api/ordenar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(`✅ ${data.message}`);
            ordenModal.style.display = 'none';
        } else {
            alert(`❌ Error al enviar orden: ${data.message || 'Error de servidor desconocido'}`);
        }

    } catch (error) {
        console.error('Error de conexión con la API de Correo:', error);
        alert('❌ Error de conexión. Verifique el servidor Node.js.');
    }
}

// Cerrar modal
function cerrarModal() {
    modal.style.display = 'none';
    productoNombreActual = null;
    productoActual = null;
    formModal.reset();
}

// Cerrar modal ordenar
function cerrarModalOrdenar() {
    ordenModal.style.display = 'none';
}

// ==================== EVENT LISTENERS ====================

function agregarEventListeners() {
    console.log('🔗 Configurando event listeners...');
    
    // Lógica de control de acceso
    const userRole = localStorage.getItem('usuarioRol');
    const rolesNoPermitidos = ['Cajero/Mesero'];
    
    if (rolesNoPermitidos.includes(userRole)) {
        // Deshabilitar todos los botones de edición y ordenar para el Mesero/Cajero
        document.querySelectorAll('.btn_editar, .btn_ordenar').forEach((btn) => {
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.cursor = 'not-allowed';
            
            btn.onclick = (e) => {
                e.stopPropagation();
                alert('Acceso de modificación restringido al rol de ' + userRole);
            };
        });
        
        // También ocultar el botón de reporte para roles no autorizados
        const btnReporteInventario = document.getElementById('btnReporteInventario');
        if (btnReporteInventario) {
            btnReporteInventario.style.display = 'none';
        }
        
        return;
    }
    
    // Configurar botón de reporte de inventario
    const btnReporteInventario = document.getElementById('btnReporteInventario');
    if (btnReporteInventario) {
        btnReporteInventario.addEventListener('click', abrirModalReporte);
        console.log('✅ Event listener del botón de reporte configurado');
    } else {
        console.error('❌ Botón de reporte no encontrado');
    }

    // Botones editar
    const botonesEditar = document.querySelectorAll('.btn_editar');
    botonesEditar.forEach((boton) => {
        boton.onclick = function() {
            productoActual = this.closest('.producto');
            const nombreProducto = productoActual.querySelector('.nombre_del_producto')?.textContent?.trim();
            
            if (nombreProducto) {
                abrirModal(nombreProducto);
            } else {
                alert('Error: No se pudo obtener el nombre del producto');
            }
        };
    });
    
    // Botones ordenar
    const botonesOrdenar = document.querySelectorAll('.btn_ordenar');
    botonesOrdenar.forEach(boton => {
        boton.onclick = function() {
            const productoElement = this.closest('.producto');
            const nombreProducto = productoElement.querySelector('.nombre_del_producto')?.textContent?.trim();
            
            if (nombreProducto) {
                abrirModalOrdenar(nombreProducto);
            } else {
                alert('Error: No se pudo obtener el nombre del producto');
            }
        };
    });
}

// Event listeners del modal editar
if (formModal) {
    formModal.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!productoNombreActual) {
            alert('Error: No hay un producto seleccionado');
            return;
        }

        const nuevaCantidad = parseInt(cantidadTotalInput.value);
        
        if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
            alert('Por favor ingrese una cantidad válida (número entero positivo)');
            return;
        }

        await actualizarProducto(productoNombreActual, nuevaCantidad);
    });
}

// Event listeners del modal ordenar
if (ordenForm) {
    ordenForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const producto = ordenProductoNombre.value;
        const cantidad = document.getElementById('ordenCantidad').value;
        const motivo = document.getElementById('ordenMotivo').value;
        const destino = ordenDestinoInput.value;
        const usuarioNombre = localStorage.getItem('usuarioNombre') || 'Usuario Cafetería';

        const orderData = {
            producto,
            cantidad: parseInt(cantidad, 10),
            motivo,
            destino,
            usuarioNombre 
        };

        await enviarOrdenCorreo(orderData);
    });
}

// ==================== CONFIGURACIÓN DE EVENT LISTENERS GLOBALES ====================

// Cerrar modales
if (spanCerrar) {
    spanCerrar.addEventListener('click', cerrarModal);
}
if (btnCancelar) {
    btnCancelar.addEventListener('click', cerrarModal);
}
if (closeButton) {
    closeButton.addEventListener('click', cerrarModalOrdenar);
}

const closeReporteInventario = document.getElementById('closeReporteInventario');
if (closeReporteInventario) {
    closeReporteInventario.addEventListener('click', cerrarModalReporte);
}

// Cerrar modales al hacer clic fuera
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        cerrarModal();
    }
    if (event.target === ordenModal) {
        cerrarModalOrdenar();
    }
    const modalReporteInventario = document.getElementById('modalReporteInventario');
    if (event.target === modalReporteInventario) {
        cerrarModalReporte();
    }
});

// ==================== FUNCIONES AUXILIARES ====================

// Mostrar error de carga
function mostrarErrorCarga(error) {
    if (document.querySelectorAll('.producto').length === 0) {
        contenedorInventario.innerHTML = `
            <div class="error-carga">
                <h3>Error al cargar el inventario</h3>
                <p>${error.message}</p>
                <button onclick="cargarProductos()">Reintentar</button>
            </div>
        `;
    }
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de inventario...');
    
    // Configurar el botón de reporte inmediatamente
    const btnReporteInventario = document.getElementById('btnReporteInventario');
    if (btnReporteInventario) {
        console.log('✅ Botón de reporte encontrado, configurando evento...');
        btnReporteInventario.addEventListener('click', abrirModalReporte);
    } else {
        console.error('❌ Botón de reporte no encontrado en el DOM');
    }

    // Configurar el cierre del modal de reporte
    const closeReporteInventario = document.getElementById('closeReporteInventario');
    if (closeReporteInventario) {
        closeReporteInventario.addEventListener('click', cerrarModalReporte);
    }

    // Cargar productos después de que el DOM esté listo
    setTimeout(() => {
        cargarProductos();
    }, 100);
});