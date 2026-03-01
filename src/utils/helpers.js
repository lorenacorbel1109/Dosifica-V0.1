/**
 * Obtiene un valor de objeto usando una ruta con puntos.
 * Ejemplo: getValueByPath(patient, "laboratorio.hemoglobina")
 *
 * @param {object} source - Objeto origen.
 * @param {string} path - Ruta con notación de puntos.
 * @returns {*} Valor encontrado o undefined.
 */
export const getValueByPath = (source, path) => {
  if (!source || !path) return undefined;

  return path
    .split('.')
    .reduce((current, key) => (current !== undefined && current !== null ? current[key] : undefined), source);
};

/**
 * Convierte textos en minúscula y sin espacios extra para comparación robusta.
 *
 * @param {*} value
 * @returns {string|*}
 */
export const normalizeText = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().toLowerCase();
};

/**
 * Verifica si un elemento está disponible dentro de un inventario textual.
 *
 * @param {string[]} inventory
 * @param {string} item
 * @returns {boolean}
 */
export const isResourceAvailable = (inventory = [], item = '') => {
  const normalizedInventory = inventory.map(normalizeText);
  return normalizedInventory.includes(normalizeText(item));
};
