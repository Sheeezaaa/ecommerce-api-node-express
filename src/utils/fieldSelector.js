/**
 * Utility to project only requested fields from a resource or collection.
 * Solves REST over-fetching by pruning non-requested fields.
 *
 * @param {Object|Array} data - Single resource object or array of resources
 * @param {string} fieldsParam - Comma-separated field names, e.g. "title,price,category"
 * @returns {Object|Array} Filtered object or array of objects with only requested fields
 */
export function selectFields(data, fieldsParam) {
  if (!fieldsParam || typeof fieldsParam !== 'string') {
    return data;
  }

  const requestedFields = fieldsParam
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  if (requestedFields.length === 0) {
    return data;
  }

  const filterItem = (item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const projected = {};
    for (const field of requestedFields) {
      if (Object.prototype.hasOwnProperty.call(item, field)) {
        projected[field] = item[field];
      }
    }
    return projected;
  };

  if (Array.isArray(data)) {
    return data.map(filterItem);
  }

  return filterItem(data);
}
