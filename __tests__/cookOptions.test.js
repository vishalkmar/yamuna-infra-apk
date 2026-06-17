import { MEAL_TYPES, DIET_TYPES, mealLabel, dietLabel, normalizeMeals } from '../src/utils/cookOptions';

describe('cookOptions constants', () => {
  it('exposes meal + diet types', () => {
    expect(MEAL_TYPES).toEqual(['breakfast', 'lunch', 'dinner']);
    expect(DIET_TYPES).toEqual(['veg', 'jain', 'non_veg']);
  });
});

describe('mealLabel / dietLabel', () => {
  it('maps keys, passes through unknowns', () => {
    expect(mealLabel('breakfast')).toBe('Breakfast');
    expect(mealLabel('brunch')).toBe('brunch');
    expect(dietLabel('non_veg')).toBe('Non-veg');
    expect(dietLabel('vegan')).toBe('vegan');
  });
});

describe('normalizeMeals', () => {
  it('de-dupes, drops invalid, keeps canonical order', () => {
    expect(normalizeMeals(['dinner', 'breakfast', 'breakfast', 'tea'])).toEqual(['breakfast', 'dinner']);
  });
  it('handles non-arrays', () => {
    expect(normalizeMeals(null)).toEqual([]);
    expect(normalizeMeals('lunch')).toEqual([]);
  });
});
