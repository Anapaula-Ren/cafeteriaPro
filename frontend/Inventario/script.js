document.addEventListener('DOMContentLoaded', () => {
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
});








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