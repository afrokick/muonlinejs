import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';

export class MathUtils {
  static AngleQuaternion(angles: Vector3): Quaternion {
    // return Quaternion.FromEulerVector(angles);
    let angle: Float;
    let sr, sp, sy, cr, cp, cy: Float;

    angle = angles.z * 0.5;
    sy = Math.sin(angle);
    cy = Math.cos(angle);
    angle = angles.y * 0.5;
    sp = Math.sin(angle);
    cp = Math.cos(angle);
    angle = angles.x * 0.5;
    sr = Math.sin(angle);
    cr = Math.cos(angle);

    const x = sr * cp * cy - cr * sp * sy;
    const y = cr * sp * cy + sr * cp * sy;
    const z = cr * cp * sy - sr * sp * cy;
    const w = cr * cp * cy + sr * sp * sy;

    return new Quaternion(x, y, z, w);
  }
}
