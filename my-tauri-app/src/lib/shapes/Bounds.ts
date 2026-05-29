// src/lib/shapes/Bounds.ts
export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export function boundsFromPoints(points: { x: number; y: number }[]): Bounds {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
}