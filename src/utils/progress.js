// Mirror of server/src/utils/progress.js so frontend can do optimistic
// progress recalculation without a round-trip.

const FACTOR = { completed: 1.0, in_progress: 0.5, pending: 0.0 };

export function computeProgress(milestones) {
  if (!milestones?.length) return 0;
  let total = 0;
  let earned = 0;
  for (const m of milestones) {
    const w = Number(m.weight) || 1;
    const f = FACTOR[m.status] !== undefined ? FACTOR[m.status] : 0;
    total += w;
    earned += w * f;
  }
  return total === 0 ? 0 : Math.round((earned / total) * 100);
}

export function currentMilestone(milestones) {
  if (!milestones?.length) return null;
  return milestones.find(m => m.status === 'in_progress')
    || milestones.find(m => m.status === 'pending')
    || milestones[milestones.length - 1];
}
