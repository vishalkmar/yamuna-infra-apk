// Cook-booking option labels (Module 12), mirrored from the backend.

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
export const DIET_TYPES = ['veg', 'jain', 'non_veg'];

const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
const DIET_LABEL = { veg: 'Veg', jain: 'Jain', non_veg: 'Non-veg' };

export function mealLabel(meal) {
  return MEAL_LABEL[meal] || meal;
}

export function dietLabel(diet) {
  return DIET_LABEL[diet] || diet;
}

// Canonical order + de-dupe, keeping only valid meals.
export function normalizeMeals(list) {
  if (!Array.isArray(list)) return [];
  const set = new Set(list.filter(m => MEAL_TYPES.includes(m)));
  return MEAL_TYPES.filter(m => set.has(m));
}
