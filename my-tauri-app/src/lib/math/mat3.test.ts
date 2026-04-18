// src/lib/math/mat3.test.ts
import { test, expect } from "vitest";
import { mat3, type Mat3, EPS } from "./mat3";

function expectMatCloseTo(actual: Mat3, expected: Mat3, eps = 1e-9) {
    for (let i = 0; i < 9; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], Math.log10(1 / eps));
    }
}

function expectAffine(m: Mat3) {
    expect(m[6]).toBeCloseTo(0);
    expect(m[7]).toBeCloseTo(0);
    expect(m[8]).toBeCloseTo(1);
}

test("identity: full matrix", () => {
    const I = mat3.identity();
    const expected: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    expectMatCloseTo(I, expected);
    expectAffine(I);
});

test("translate: exact matrix and transformPoint", () => {
    const tx = 10, ty = -5;
    const T = mat3.translate(tx, ty);
    const expected: Mat3 = [1, 0, tx, 0, 1, ty, 0, 0, 1];
    expectMatCloseTo(T, expected);
    expectAffine(T);

    const p = mat3.transformPoint(T, 3, 4);
    expect(p.x).toBeCloseTo(3 + tx);
    expect(p.y).toBeCloseTo(4 + ty);
});

test("scale: exact matrix and point behavior", () => {
    const sx = 2, sy = 0.5;
    const S = mat3.scale(sx, sy);
    const expected: Mat3 = [sx, 0, 0, 0, sy, 0, 0, 0, 1];
    expectMatCloseTo(S, expected);
    expectAffine(S);

    const p = mat3.transformPoint(S, 4, 6);
    expect(p.x).toBeCloseTo(4 * sx);
    expect(p.y).toBeCloseTo(6 * sy);
});

test("rotate: exact matrix and point behavior", () => {
    const I = mat3.rotate(0);
    const expectedIdentity: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    expectMatCloseTo(I, expectedIdentity);

    const r90 = mat3.rotate(Math.PI / 2);
    const p = mat3.transformPoint(r90, 1, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
});

test("multiply: identity with matrix", () => {
    const I = mat3.identity();
    const T = mat3.translate(10, 5);
    const result = mat3.multiply(T, I);
    expectMatCloseTo(result, T);
});

test("fromTransform: composes transformations correctly", () => {
    const tx = 100, ty = 50;
    const angle = Math.PI / 4;
    const sx = 2, sy = 1;

    const M = mat3.fromTransform(tx, ty, angle, sx, sy);

    const px = 1, py = 0;
    const p = mat3.transformPoint(M, px, py);

    const scaled = { x: px * sx, y: py * sy };
    const rotated = {
        x: scaled.x * Math.cos(angle) - scaled.y * Math.sin(angle),
        y: scaled.x * Math.sin(angle) + scaled.y * Math.cos(angle)
    };
    const expected = { x: rotated.x + tx, y: rotated.y + ty };

    expect(p.x).toBeCloseTo(expected.x);
    expect(p.y).toBeCloseTo(expected.y);
});

test("invert: translation", () => {
    const T = mat3.translate(10, 20);
    const T_inv = mat3.invert(T);
    expect(T_inv).not.toBeNull();

    if (T_inv) {
        const identity = mat3.multiply(T, T_inv);
        expect(identity[0]).toBeCloseTo(1);
        expect(identity[4]).toBeCloseTo(1);

        const p = mat3.transformPoint(T, 5, 5);
        const p_back = mat3.transformPoint(T_inv, p.x, p.y);
        expect(p_back.x).toBeCloseTo(5);
        expect(p_back.y).toBeCloseTo(5);
    }
});

test("invert: scale", () => {
    const S = mat3.scale(2, 3);
    const S_inv = mat3.invert(S);
    expect(S_inv).not.toBeNull();

    if (S_inv) {
        const p = mat3.transformPoint(S, 4, 6);
        const p_back = mat3.transformPoint(S_inv, p.x, p.y);
        expect(p_back.x).toBeCloseTo(4);
        expect(p_back.y).toBeCloseTo(6);
    }
});

test("invert: degenerate matrices", () => {
    expect(mat3.invert(mat3.scale(0, 1))).toBeNull();
    expect(mat3.invert(mat3.scale(1, 0))).toBeNull();
});

test("randomized sanity: transformPoint matches manual steps", () => {
    for (let i = 0; i < 30; i++) {
        const tx = (i % 7) - 3;
        const ty = ((i * 3) % 11) - 5;
        const angle = (i * 0.37) % (2 * Math.PI);
        const sx = 0.2 + ((i % 5) * 0.6);
        const sy = 0.3 + ((i % 3) * 0.8);

        const M = mat3.fromTransform(tx, ty, angle, sx, sy);
        const px = (i % 5) - 2.5;
        const py = ((i * 2) % 7) - 3.5;

        const pFromM = mat3.transformPoint(M, px, py);

        const scaled = { x: px * sx, y: py * sy };
        const rotated = {
            x: scaled.x * Math.cos(angle) - scaled.y * Math.sin(angle),
            y: scaled.x * Math.sin(angle) + scaled.y * Math.cos(angle)
        };
        const manual = { x: rotated.x + tx, y: rotated.y + ty };

        expect(pFromM.x).toBeCloseTo(manual.x);
        expect(pFromM.y).toBeCloseTo(manual.y);
        expectAffine(M);
    }
});