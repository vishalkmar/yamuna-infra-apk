// Meal Ordering option labels (Module 13), mirrored from the backend.

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'prasadam'];
export const DIET_TYPES = ['satvik', 'jain', 'regular_veg', 'custom'];
export const SUBSCRIPTION_PLANS = ['daily', 'weekly', 'monthly'];

const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', prasadam: 'Prasadam' };
const DIET_LABEL = { satvik: 'Satvik', jain: 'Jain', regular_veg: 'Regular Veg', custom: 'Custom' };
const PLAN_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export function mealLabel(meal) { return MEAL_LABEL[meal] || meal; }
export function dietLabel(diet) { return DIET_LABEL[diet] || diet; }
export function planLabel(plan) { return PLAN_LABEL[plan] || plan; }

export function normalizeMealTypes(list) {
  if (!Array.isArray(list)) return [];
  const set = new Set(list.filter(m => MEAL_TYPES.includes(m)));
  return MEAL_TYPES.filter(m => set.has(m));
}
