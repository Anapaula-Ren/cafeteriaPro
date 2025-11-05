// ==================== CONFIGURACIÓN DE LA API ====================
const API_URL = 'http://localhost:3000';

// ==================== ELEMENTOS DEL DOM ====================
const modal = document.getElementById('modal_editar');
const spanCerrar = document.getElementsByClassName('cerrar')[0];
const btnCancelar = document.querySelector('.btn_cancelar');
const formModal = document.getElementById('form_modal');
const inputNombreProducto = document.getElementById('nombre_producto');
const unidadesInput = document.getElementById('unidades_sin_abrir');
const gramosAbiertosInput = document.getElementById('gramos_abiertos');
const totalInput = document.getElementById('total_gramos');
const pesoUnidadSpan = document.getElementById('peso_unidad');
const unidadMedidaSpan = document.getElementById('unidad_medida');
const textoUnidades = document.getElementById('texto_unidades');
const textoAbierto = document.getElementById('texto_abierto');
const labelGramosAbiertos = document.querySelector('label[for="gramos_abiertos"]');
const labelTotal = document.getElementById('label_total');
const contenedorInventario = document.querySelector('.inventario');

// ==================== ELEMENTOS DEL MODAL ORDENAR ====================
const ordenModal = document.getElementById('ordenModal');
const closeButton = ordenModal?.querySelector('.close-button');
const ordenForm = document.getElementById('ordenForm');
const productoTitulo = document.getElementById('productoTitulo');
const ordenProductoNombre = document.getElementById('ordenProductoNombre');
const ordenDestinoInput = document.getElementById('ordenDestino');

let productoActual = null;
let configuracionActual = null;
let idProductoActual = null;

// ==================== DETERMINAR CATEGORÍA ACTUAL ====================
function obtenerCategoriaActual() {
    try {
        const url = window.location.pathname;
        const nombreArchivo = url.substring(url.lastIndexOf('/') + 1);
        
        const mapeoCategorias = {
            'inventario_bebidas.html': 1,
            'inventario_comidas.html': 2,
            'inventario_envases.html': 3,
            'inventario_limpieza.html': 4,
            'inventario_menu.html': 1
        };
        
        let categoriaId = mapeoCategorias[nombreArchivo];
        
        if (!categoriaId) {
            const urlParams = new URLSearchParams(window.location.search);
            categoriaId = urlParams.get('categoria') || 1;
        }
        
        console.log(`📂 Categoría detectada: ${categoriaId}`);
        return parseInt(categoriaId);
    } catch (error) {
        console.error('Error al determinar categoría:', error);
        return 1;
    }
}

// ==================== CARGAR PRODUCTOS AL INICIO ====================
async function cargarProductos() {
    try {
        if (!contenedorInventario) {
            console.error('❌ No se encontró el contenedor de inventario');
            return;
        }

        const categoriaId = obtenerCategoriaActual();
        console.log(`🔍 Cargando productos de categoría ${categoriaId}...`);
        
        const response = await fetch(`${API_URL}/api/inventario/categoria/${categoriaId}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const productos = await response.json();
        console.log(`✅ ${productos.length} productos recibidos`);
        
        if (!Array.isArray(productos)) {
            throw new Error('Formato de respuesta inválido');
        }
        
        actualizarProductosExistentes(productos);
        console.log(`✅ Productos actualizados correctamente`);
        
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        // Solo mostrar error si no hay productos en el HTML
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
}

// ==================== ACTUALIZAR PRODUCTOS EXISTENTES ====================
function actualizarProductosExistentes(productos) {
    const productosExistentes = document.querySelectorAll('.producto');
    
    if (productosExistentes.length === 0) {
        crearProductosDesdeCero(productos);
        return;
    }
    
    productosExistentes.forEach(productoElement => {
        const nombreProducto = productoElement.querySelector('.nombre_del_producto')?.textContent?.trim();
        
        if (!nombreProducto) return;
        
        const productoBD = productos.find(p => p.NombreProducto?.trim() === nombreProducto);
        
        if (productoBD) {
            // Actualizar solo la cantidad y data-id
            const inputCantidad = productoElement.querySelector('.cantidad_producto');
            if (inputCantidad) {
                inputCantidad.value = parseFloat(productoBD.TotalCantidad) || 0;
            }
            
            productoElement.setAttribute('data-id', productoBD.IdInventario);
            
        } else {
            console.warn(`⚠️ "${nombreProducto}" no encontrado en BD`);
        }
    });
    
    // Agregar event listeners después de actualizar
    agregarEventListeners();
}

// ==================== CREAR PRODUCTOS DESDE CERO ====================
function crearProductosDesdeCero(productos) {
    contenedorInventario.innerHTML = '';
    
    productos.forEach(producto => {
        if (!producto.NombreProducto) return;
        
        const divProducto = document.createElement('div');
        divProducto.className = 'producto';
        divProducto.setAttribute('data-id', producto.IdInventario);
        
        const unidadTexto = producto.UnidadMedida || 'g';
        const maxTexto = producto.MaxCantidad || 5000;
        const cantidadActual = parseFloat(producto.TotalCantidad) || 0;
        const nombreImagen = obtenerNombreImagen(producto.NombreProducto);
        
        divProducto.innerHTML = `
            <h3 class="nombre_del_producto">${producto.NombreProducto}</h3>
            <img src="imagenes/${nombreImagen}" alt="${producto.NombreProducto}" 
                 onerror="this.src='imagenes/default.jpg'">
            <p>Cantidad: <input type="number" value="${cantidadActual}" readonly class="cantidad_producto"> ${unidadTexto} / ${maxTexto} ${unidadTexto}</p>
            <div class="botones">
                <button class="btn_editar"><i class="fa-solid fa-pencil"></i></button>
                <button class="btn_ordenar"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
        
        contenedorInventario.appendChild(divProducto);
    });
    
    agregarEventListeners();
}

// ==================== FUNCIÓN PARA OBTENER NOMBRE DE IMAGEN ====================
function obtenerNombreImagen(nombreProducto) {
    const mapeoGeneral = {
        // BEBIDAS
        'Café molido': 'cafe_molido.jpeg',
        'Leche entera': 'leche_entera.jpg',
        'Leche deslactosada': 'leche_deslactosada.jpg',
        'Leche de almendras': 'leche_almendra.jpg',
        'Azúcar estándar': 'azucar_estandar.jpg',
        'Stevia': 'stevia.jpeg',
        'Jarabe de vainilla': 'jarabe_vainilla.jpg',
        'Jarabe de chocolate': 'jarabe_chocolate.jpg',
        'Té negro': 'te_negro.jpg',
        'Agua': 'agua.jpg',
        'Crema para batir': 'crema_para_batir.jpg',
        'Canela molida': 'canela_molida.jpg',
        
        // COMIDAS
        'Sandwich de jamón y queso': 'sandwich_jamon_queso.jpg',
        'Wrap de pollo': 'wrap_pollo.jpg',
        'Croissant': 'croissant.jpg',
        'Muffin': 'muffin.jpg',
        'Brownie': 'brownie.jpg',
        'Dona': 'dona.jpg',
        
        // ENVASES
        'Bebida caliente': 'vaso_caliente.jpg',
        'Bebida fría': 'vaso_frio.jpg',
        'Servilletas': 'servilletas.jpg',
        'Manga aislante': 'manga_aislante.jpg',
        'Popotes': 'popotes.jpg',
        
        // LIMPIEZA
        'Bolsa de basura': 'bolsa_basura.jpg',
        'Esponja': 'esponja.jpg',
        'Desinfectante': 'desinfectante.jpg',
        'Microfibra': 'microfibra.jpg'
    };
    
    return mapeoGeneral[nombreProducto] || 'default.jpg';
}

// ==================== FUNCIÓN PARA CALCULAR TOTAL ====================
function calcularTotal() {
    if (!configuracionActual) return;

    const unidades = parseFloat(unidadesInput.value) || 0;
    const cantidadAbierta = parseFloat(gramosAbiertosInput.value) || 0;
    const pesoUnidad = parseFloat(pesoUnidadSpan.textContent) || 0;
    
    const total = (unidades * pesoUnidad) + cantidadAbierta;
    
    let unidadTexto = "unidades";
    if (configuracionActual.unidadMedida === "g") {
        unidadTexto = "gramos";
    } else if (configuracionActual.unidadMedida === "L") {
        unidadTexto = "litros";
    } else if (configuracionActual.unidadMedida === "mL") {
        unidadTexto = "mililitros";
    }
    
    totalInput.value = `${total.toFixed(2)} ${unidadTexto}`;
}

// ==================== FUNCIÓN PARA OBTENER CONFIGURACIÓN DESDE BD ====================
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
                unidadMedida: data.producto.UnidadMedida || "g",
                pesoUnidad: parseFloat(data.producto.EquivalenciaUnidad) || 0,
                minUnidades: parseInt(data.producto.MinUnidades) || 0,
                maxUnidades: parseInt(data.producto.MaxUnidades) || 0,
                minAbierto: parseFloat(data.producto.MinCantidad) || 0,
                maxAbierto: parseFloat(data.producto.MaxCantidad) || 0,
                unidadesSinAbrir: parseInt(data.producto.UnidadesSinAbrir) || 0,
                cantidadAbierta: parseFloat(data.producto.CantidadAbierta) || 0
            };
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        alert('Error al cargar los datos del producto');
        return null;
    }
}

// ==================== FUNCIÓN PARA ABRIR EL MODAL EDITAR ====================
async function abrirModal(idProducto) {
    try {
        const config = await obtenerConfiguracionProducto(idProducto);
        
        if (!config) return;
        
        configuracionActual = config;
        idProductoActual = idProducto;
        
        // Configurar modal
        inputNombreProducto.value = config.nombre;
        
        let textoUnidadAbierta = "gramos";
        if (config.unidadMedida === "L") {
            textoUnidadAbierta = "litros";
        } else if (config.unidadMedida === "mL") {
            textoUnidadAbierta = "mililitros";
        }
        
        labelGramosAbiertos.innerHTML = `Cantidad en ${textoUnidadAbierta} (abierto):`;
        labelTotal.textContent = `Total en ${textoUnidadAbierta}:`;
        pesoUnidadSpan.textContent = config.pesoUnidad;
        unidadMedidaSpan.textContent = config.unidadMedida;
        
        unidadesInput.min = config.minUnidades;
        unidadesInput.max = config.maxUnidades;
        gramosAbiertosInput.min = config.minAbierto;
        gramosAbiertosInput.max = config.maxAbierto;
        
        textoUnidades.textContent = `Mínimo: ${config.minUnidades} | Máximo: ${config.maxUnidades}`;
        textoAbierto.textContent = `Mínimo: ${config.minAbierto} ${config.unidadMedida} | Máximo: ${config.maxAbierto} ${config.unidadMedida}`;
        
        unidadesInput.value = config.unidadesSinAbrir;
        gramosAbiertosInput.value = config.cantidadAbierta;
        
        calcularTotal();
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error al abrir modal:', error);
        alert('Error al abrir el editor');
    }
}

// ==================== FUNCIÓN PARA ABRIR EL MODAL ORDENAR ====================
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

// ==================== EVENT LISTENERS ====================
function agregarEventListeners() {
    // Event listeners para inputs del modal editar
    if (unidadesInput) unidadesInput.addEventListener('input', calcularTotal);
    if (gramosAbiertosInput) gramosAbiertosInput.addEventListener('input', calcularTotal);
    
    // Event listeners para botones editar
    const botonesEditar = document.querySelectorAll('.btn_editar');
    botonesEditar.forEach(boton => {
        boton.onclick = function() {
            productoActual = this.closest('.producto');
            const idProducto = productoActual.getAttribute('data-id');
            
            if (idProducto) {
                abrirModal(idProducto);
            } else {
                alert('Error: No se encontró el ID del producto');
            }
        };
    });
    
    // Event listeners para botones ordenar
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

// ==================== EVENTOS DEL MODAL EDITAR ====================
if (spanCerrar) {
    spanCerrar.onclick = function() {
        modal.style.display = 'none';
    }
}

if (btnCancelar) {
    btnCancelar.onclick = function() {
        modal.style.display = 'none';
    }
}

if (modal) {
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// ==================== EVENTOS DEL MODAL ORDENAR ====================
if (closeButton) {
    closeButton.onclick = function() {
        ordenModal.style.display = 'none';
    }
}

if (ordenModal) {
    window.addEventListener('click', function(event) {
        if (event.target == ordenModal) {
            ordenModal.style.display = 'none';
        }
    });
}

// ==================== GUARDAR CAMBIOS (EDITAR) ====================
if (formModal) {
    formModal.onsubmit = async function(e) {
        e.preventDefault();
        
        try {
            if (!configuracionActual || !idProductoActual) {
                alert('Error: No hay producto seleccionado');
                return;
            }
            
            const unidades = parseFloat(unidadesInput.value) || 0;
            const cantidadAbierta = parseFloat(gramosAbiertosInput.value) || 0;
            
            // Validaciones
            if (unidades < configuracionActual.minUnidades) {
                alert(`Las unidades no pueden ser menores a ${configuracionActual.minUnidades}`);
                return;
            }
            
            if (unidades > configuracionActual.maxUnidades) {
                alert(`Las unidades no pueden ser mayores a ${configuracionActual.maxUnidades}`);
                return;
            }
            
            if (cantidadAbierta < configuracionActual.minAbierto) {
                alert(`La cantidad abierta no puede ser menor a ${configuracionActual.minAbierto}`);
                return;
            }
            
            if (cantidadAbierta > configuracionActual.maxAbierto) {
                alert(`La cantidad abierta no puede ser mayor a ${configuracionActual.maxAbierto}`);
                return;
            }
            
            console.log('Enviando datos:', { unidades_sin_abrir: unidades, cantidad_abierta: cantidadAbierta });
            
            const response = await fetch(`${API_URL}/api/inventario/producto/${idProductoActual}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unidades_sin_abrir: unidades,
                    cantidad_abierta: cantidadAbierta
                })
            });
            
            const result = await response.json();
            if (result.success) {
                // Actualizar el valor en el DOM inmediatamente
                if (productoActual) {
                    const inputCantidad = productoActual.querySelector('.cantidad_producto');
                    if (inputCantidad) {
                        inputCantidad.value = parseFloat(result.total_cantidad).toFixed(2);
                    }
                }
                
                modal.style.display = 'none';
                alert('✅ Cantidad actualizada correctamente');
                
            } else {
                alert('❌ Error: ' + result.message);
            }
            
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('❌ Error al guardar los cambios');
        }
    };
}

// ==================== ENVÍO DE ORDEN POR CORREO ====================
if (ordenForm) {
    ordenForm.onsubmit = async function(e) {
        e.preventDefault();

        try {
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
    };
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de inventario...');
    
    if (contenedorInventario) {
        // Esperar a que las imágenes del HTML se carguen
        setTimeout(cargarProductos, 100);
    }
    
    // Configurar event listeners globales
    agregarEventListeners();
});


































/*document.addEventListener('DOMContentLoaded', () => {
    // ====================================================================
    // 1. REFERENCIAS GLOBALES (Usando clases para manejar múltiples botones)
    // ====================================================================
    const modalEditar = document.getElementById('modal_editar');
    const spanCerrar = document.querySelector('#modal_editar .cerrar');
    const btnCancelar = document.querySelector('#modal_editar .btn_cancelar');
    const formModal = document.getElementById('form_modal');
    
    // Referencias para el modal de edición
    const inputNombreProductoModal = document.getElementById('nombre_producto');
    const inputCantidadGramosModal = document.getElementById('cantidad_gramos');
    
    let productoActivo = null; // Variable para rastrear el producto que se está editando/ordenando

    // ====================================================================
    // 2. LÓGICA DEL MODAL DE EDICIÓN (ADAPTADO A CLASES)
    // ====================================================================
    document.querySelectorAll('.btn_editar').forEach(button => {
        button.addEventListener('click', function() {
            // 1. Identificar el producto padre
            const productoDiv = this.closest('.producto');
            productoActivo = productoDiv; // Guarda la referencia del div
            
            // 2. Obtener datos usando el elemento padre
            const nombre = productoDiv.querySelector('.producto-nombre').textContent.trim();
            const cantidadGramos = productoDiv.querySelector('.producto-cantidad').value;

            // 3. Abrir modal y cargar valores
            inputNombreProductoModal.value = nombre;
            inputCantidadGramosModal.value = cantidadGramos;
            modalEditar.style.display = 'flex';
            modalEditar.style.justifyContent = 'center';
            modalEditar.style.alignItems = 'center';
        });
    });

    // Manejar el envío del formulario de EDICIÓN
    formModal.onsubmit = function(e) {
        e.preventDefault();
        
        if (productoActivo) {
            // Obtener el input de cantidad de la vista principal del producto activo
            const inputPrincipal = productoActivo.querySelector('.producto-cantidad');
            
            // Actualizar el valor en la vista principal
            inputPrincipal.value = inputCantidadGramosModal.value;
            
            // Aquí iría el código de envío al servidor para actualizar la DB
            // console.log('Actualizando DB: ', inputPrincipal.value);
            
            alert('Cantidad actualizada correctamente');
        }
        
        modalEditar.style.display = 'none';
    }

    // Cierre del modal de Edición (X y Cancelar)
    spanCerrar.onclick = function() { modalEditar.style.display = 'none'; }        
    btnCancelar.onclick = function() { modalEditar.style.display = 'none'; }        
    window.onclick = function(event) {
        if (event.target == modalEditar || event.target == ordenModal) {
            event.target.style.display = 'none';
        }
    }


    // ====================================================================
    // 3. LÓGICA DEL MODAL DE ORDENAR CORREO
    // ====================================================================
    const ordenModal = document.getElementById('ordenModal');
    const closeButton = ordenModal.querySelector('.close-button');
    const ordenForm = document.getElementById('ordenForm');
    const productoTitulo = document.getElementById('productoTitulo');
    const ordenProductoNombre = document.getElementById('ordenProductoNombre');
    const ordenDestinoInput = document.getElementById('ordenDestino');

    // Función para Abrir el Modal de Ordenar
    function openOrderModal(productName) {
        productoTitulo.textContent = productName;
        ordenProductoNombre.value = productName;
        document.getElementById('ordenCantidad').value = 1; 
        document.getElementById('ordenMotivo').value = '';
        ordenModal.style.display = 'flex';
        ordenModal.style.justifyContent = 'center';
        ordenModal.style.alignItems = 'center';
    }

    // Adjuntar la función al clic de todos los botones de "Ordenar"
    document.querySelectorAll('.btn_ordenar').forEach(button => { // ⬅️ USANDO LA CLASE
        button.addEventListener('click', function(e) {
            // Encuentra el nombre del producto asociado a este botón
            const productName = this.closest('.producto').querySelector('.producto-nombre').textContent.trim();
            openOrderModal(productName);
        });
    });
    
    // Cierre del Modal de Ordenar
    closeButton.addEventListener('click', () => {
        ordenModal.style.display = 'none';
    });

    // 4. Lógica de Envío del Correo (Llama a la API de Node.js)
    ordenForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const producto = ordenProductoNombre.value;
        const cantidad = document.getElementById('ordenCantidad').value;
        const motivo = document.getElementById('ordenMotivo').value;
        const destino = ordenDestinoInput.value;
        const usuarioNombre = localStorage.getItem('usuarioNombre'); 

        const orderData = {
            producto,
            cantidad: parseInt(cantidad, 10),
            motivo,
            destino,
            usuarioNombre 
        };

        try {
            const response = await fetch('http://localhost:3000/api/ordenar', {
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
    });
});*/








// Modal
/*const modal = document.getElementById('modal_editar');
const btnEditar = document.getElementById('btn_editar');
const spanCerrar = document.getElementsByClassName('cerrar')[0];
const btnCancelar = document.querySelector('.btn_cancelar');
const formModal = document.getElementById('form_modal');
const inputNombreDelProducto = document.getElementById('nombre_del_producto');
const inputNombreProducto = document.getElementById('nombre_producto');
const inputCantidadUnidades = document.getElementById('cantidad_unidades');
const inputCantidadGramos = document.getElementById('cantidad_gramos');
const inputProducto = document.getElementById('cantidad_producto');
// Abrir modal al hacer clic en el botón de editar
btnEditar.onclick = function() {
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    // Cargar el valor actual en el formulario
    inputNombreProducto.value = inputNombreDelProducto.textContent;
    inputCantidadGramos.value = inputProducto.value;
}        
// Cerrar modal al hacer clic en la X
spanCerrar.onclick = function() {
    modal.style.display = 'none'; 
}        
// Cerrar modal al hacer clic en Cancelar
btnCancelar.onclick = function() {
    modal.style.display = 'none';
}        
// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}        
// Manejar el envío del formulario
formModal.onsubmit = function(e) {
    e.preventDefault();        
    // Actualizar el valor en la vista principal
    inputProducto.value = inputCantidadGramos.value;        
    // Aquí normalmente enviarías los datos al servidor
    console.log('Nueva cantidad de café molido:', inputProducto.value);        
    // Cerrar el modal
    modal.style.display = 'none';        
    // Mostrar mensaje de éxito (opcional)
    alert('Cantidad actualizada correctamente');
}

// modal ordenar
document.addEventListener('DOMContentLoaded', () => {
    // 1. Referencias al Modal
    const ordenModal = document.getElementById('ordenModal');
    const closeButton = ordenModal.querySelector('.close-button');
    const ordenForm = document.getElementById('ordenForm');
    const productoTitulo = document.getElementById('productoTitulo');
    const ordenProductoNombre = document.getElementById('ordenProductoNombre');
    const ordenDestinoInput = document.getElementById('ordenDestino'); // ⬅️ Referencia al nuevo campo

    // 2. Función para Abrir el Modal
    function openOrderModal(productName) {
        productoTitulo.textContent = productName;
        ordenProductoNombre.value = productName;
        ordenCantidad.value = 1; 
        ordenModal.style.display = 'block';
    }

    // EJEMPLO: Adjunta esta función al clic de tus botones de "Ordenar" en el inventario
     document.querySelectorAll('btn_ordenar').forEach(button => {
         button.addEventListener('click', (e) => {
             const productName = e.target.closest('.card').querySelector('h3').textContent.trim();
             openOrderModal(productName);
         });
     });
    
    // (Asegúrate de que tus botones de ordenar llamen a 'openOrderModal' con el nombre del producto)

    // 3. Cierre del Modal
    closeButton.addEventListener('click', () => {
        ordenModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === ordenModal) {
            ordenModal.style.display = 'none';
        }
    });

    // 4. Lógica de Envío del Formulario (Llama a la API de Node.js)
    ordenForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const producto = ordenProductoNombre.value;
        const cantidad = document.getElementById('ordenCantidad').value;
        const motivo = document.getElementById('ordenMotivo').value;
        const destino = ordenDestinoInput.value; // ⬅️ Capturamos el correo del proveedor
        const usuarioNombre = localStorage.getItem('usuarioNombre'); 

        const orderData = {
            producto,
            cantidad: parseInt(cantidad, 10),
            motivo,
            destino, // ⬅️ Enviamos el correo de destino
            usuarioNombre 
        };

        try {
            const response = await fetch('http://localhost:3000/api/ordenar', {
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
    });
});*/