// src/lib/math/mat3.ts
export type Mat3 = [
    number, number, number,
    number, number, number,
    number, number, number
];
export interface Point2D {
    x: number;
    y: number;
}
/**
 * TODO: Реализуйте функции в этом файле.
 * ВАЖНО: придерживайтесь row-major раскладки:
 * [ m00, m01, m02, m10, m11, m12, m20, m21, m22 ]
 */
export const EPS = 1e-10;
export const mat3 = {
    identity(): Mat3 {
        return [
            1,0,0,
            0,1,0,
            0,0,1
        ];
    },
    multiply(a: Mat3, b: Mat3): Mat3 {
        const result: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let k = 0; k < 3; k++) {
                    sum += a[r * 3 + k] * b[k * 3 + c];
                }
                result[r * 3 + c] = sum;
            }
        }

        return result;
    },
    translate(tx: number, ty: number): Mat3 {
        return [
            1, 0, tx,
            0, 1, ty,
            0, 0, 1
        ];
    },
    scale(sx: number, sy: number): Mat3 {
        // TODO
    },
    rotate(rad: number): Mat3 {
        // TODO: используйте Math.cos, Math.sin
        throw new Error("Not implemented");
    },
    fromTransform(
        tx: number,
        ty: number,
        rotationRad: number,
        sx: number,
        sy: number
    ): Mat3 {
        // TODO: собрать M = T * R * S
        throw new Error("Not implemented");
    },
    transformPoint(m: Mat3, x: number, y: number): Point2D {
        // TODO: вернуть {x:..., y:...}
        throw new Error("Not implemented");
    },
    invert(m: Mat3): Mat3 | null {
        // TODO: инверсия для аффинной матрицы (нижняя строка 0,0,1)
        throw new Error("Not implemented");
    }
};