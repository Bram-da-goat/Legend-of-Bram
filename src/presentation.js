import * as THREE from "three";

const cameraCache = new WeakMap();
// Leave space for the battle toolbar and boss bar; recalculate only on resize.
export function fitBattleCamera(points, aspect, height) {
  const cached = cameraCache.get(points);
  if (cached?.aspect === aspect && cached?.height === height)
    return cached.view;
  const bounds = new THREE.Box3().setFromPoints(
    points.length ? points : [new THREE.Vector3()],
  );
  const target = bounds.getCenter(new THREE.Vector3());
  target.y = 0;
  const direction = new THREE.Vector3(0.45, 1.1, 0.85).normalize(),
    right = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 1, 0), direction)
      .normalize(),
    up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const tan = Math.tan((47 * Math.PI) / 360),
    available = Math.max(0.45, 1 - 220 / Math.max(400, height));
  const corners = [
    ...points,
    ...[
      [-20, -20],
      [-20, 20],
      [20, -20],
      [20, 20],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  ];
  let distance = 35;
  for (const p of corners) {
    const delta = p.clone().sub(target),
      depth = delta.dot(direction);
    distance = Math.max(
      distance,
      Math.abs(delta.dot(right)) / (tan * Math.max(0.4, aspect) * 0.88) + depth,
      Math.abs(delta.dot(up)) / (tan * available) + depth,
    );
  }
  const view = {
    target,
    position: target.clone().addScaledVector(direction, distance + 2),
  };
  cameraCache.set(points, { aspect, height, view });
  return view;
}
export function decorateLandscape(zones) {
  let seed = 4721;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (const name of ["meadow", "battle"]) {
    const grass = new THREE.InstancedMesh(
        new THREE.ConeGeometry(0.1, 0.42, 3),
        new THREE.MeshLambertMaterial({ color: "#74985e" }),
        650,
      ),
      dummy = new THREE.Object3D();
    for (let i = 0; i < 650; i++) {
      const a = random() * Math.PI * 2,
        r = 6 + random() * 23;
      dummy.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r);
      dummy.scale.setScalar(0.5 + random());
      dummy.rotation.y = random() * Math.PI;
      dummy.updateMatrix();
      grass.setMatrixAt(i, dummy.matrix);
    }
    zones[name].add(grass);
    const flowers = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.09, 0),
      new THREE.MeshLambertMaterial({ color: "#f0d5a0" }),
      130,
    );
    for (let i = 0; i < 130; i++) {
      const patch = i % 5,
        a = random() * Math.PI * 2,
        r = random() * 2.7;
      dummy.position.set(
        Math.sin(patch * 2) * 19 + Math.cos(a) * r,
        0.2,
        Math.cos(patch * 2) * 19 + Math.sin(a) * r,
      );
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      flowers.setMatrixAt(i, dummy.matrix);
      flowers.setColorAt(i, new THREE.Color(i % 3 ? "#f7da9a" : "#dfb4ce"));
    }
    zones[name].add(flowers);
  }
}
