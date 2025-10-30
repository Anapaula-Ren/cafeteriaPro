// Modal
const modal = document.getElementById('modal_editar');
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