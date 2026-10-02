// Fractions are distance along the tunnel, not world Z or spline control points.
export const CAVE_SPAWNS = [
  ...[0.10, 0.25, 0.42, 0.59, 0.76, 0.91].map((progress, i) => ({
    id: `cave-bats-${i + 1}`, type: 'bat', progress,
  })),
  ...[0.84, 0.94].map((progress, i) => ({
    id: `cave-rock-${i + 1}`, type: 'rock', progress,
  })),
];
export const respawnDelay = type => ['bat', 'rock'].includes(type) ? 20 : 45;
export function caveBandAllowed(position, type, spacedPoints) {
  let nearest = 0, distance = Infinity;
  spacedPoints.forEach((p, i) => {
    const d = Math.hypot(p.x - position.x, p.z - position.z);
    if (d < distance) { distance = d; nearest = i; }
  });
  const progress = nearest / (spacedPoints.length - 1);
  return distance <= 2.4 && progress >= (type === 'rock' ? 0.8 : 0.035) && progress <= 0.98;
}
