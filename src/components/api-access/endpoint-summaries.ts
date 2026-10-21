export const spanishEndpointSummaries: Record<string, string> = {
  'GET /tasks': 'Consultar y filtrar todo el historial de tareas',
  'POST /tasks': 'Crear una tarea',
  'GET /tasks/{id}': 'Consultar una tarea con su estado y propiedades',
  'PATCH /tasks/{id}':
    'Editar una tarea; propertyValues sustituye todos sus valores',
  'DELETE /tasks/{id}': 'Eliminar una tarea de forma permanente',
  'POST /tasks/{id}/move':
    'Mover una tarea y actualizar su fecha de finalización',
  'PUT /statuses/{id}/tasks/order':
    'Reordenar todas las tareas de un estado activo',
  'PUT /tasks/{id}/properties/{propertyId}':
    'Asignar el valor de una propiedad de la tarea',
  'DELETE /tasks/{id}/properties/{propertyId}':
    'Borrar el valor de una propiedad',
  'GET /statuses': 'Consultar los estados en el orden del tablero',
  'POST /statuses': 'Añadir un estado al tablero',
  'PUT /statuses/order':
    'Reordenar todos los estados; incluir cada id una sola vez',
  'GET /statuses/{id}': 'Consultar un estado del tablero',
  'PATCH /statuses/{id}': 'Editar el nombre, el color o el carácter terminal',
  'DELETE /statuses/{id}': 'Eliminar un estado vacío, conservando al menos uno',
  'GET /properties': 'Consultar las definiciones de propiedades en su orden',
  'POST /properties': 'Añadir una propiedad con su tipo',
  'PUT /properties/order':
    'Reordenar las propiedades; incluir cada id una sola vez',
  'GET /properties/{id}': 'Consultar la definición de una propiedad',
  'PATCH /properties/{id}':
    'Editar una propiedad sin invalidar los valores guardados',
  'DELETE /properties/{id}': 'Eliminar una propiedad y todos sus valores',
};
