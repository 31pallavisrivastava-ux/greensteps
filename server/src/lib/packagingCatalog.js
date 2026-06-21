/** Map DB packaging row to API DTO (orderTypes stored as single enum string). */
export function serializePackagingItem(item) {
  return {
    id: item.id,
    category: item.category,
    label: item.label,
    orderTypes: [item.orderTypes],
    plasticGramsPerUnit: item.plasticGramsPerUnit,
    plasticType: item.plasticType,
    co2ePerUnitKg: item.co2ePerUnitKg,
  }
}

export function filterPackagingByOrderType(items, orderType) {
  if (!orderType) return items
  return items.filter((item) => item.orderTypes === orderType)
}
