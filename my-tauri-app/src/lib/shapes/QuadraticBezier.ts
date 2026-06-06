import { Shape, type Bounds } from './Shape';
import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';
import type { Point2D } from '../math/mat3';

export class QuadraticBezier extends Shape {
    p0: Point2D;
    p1: Point2D;
    p2: Point2D;
    private segments: number = 50;

    constructor(p0?: Point2D, p1?: Point2D, p2?: Point2D, id?: string) {
        super(id);

        if (p0 && p1 && p2) {
            this.p0 = p0;
            this.p1 = p1;
            this.p2 = p2;
        } else {
            this.p0 = { x: -80, y: 0 };
            this.p1 = { x: 0, y: -60 };
            this.p2 = { x: 80, y: 0 };
        }
    }

    protected createClone(): Shape {
        return new QuadraticBezier(
            { ...this.p0 },
            { ...this.p1 },
            { ...this.p2 },
            this.id
        );
    }

    evalLocal(t: number): Point2D {
        const mt = 1 - t;
        const x = mt * mt * this.p0.x + 2 * mt * t * this.p1.x + t * t * this.p2.x;
        const y = mt * mt * this.p0.y + 2 * mt * t * this.p1.y + t * t * this.p2.y;
        return { x, y };
    }

    getLocalFlattenedPoints(): Point2D[] {
        const points: Point2D[] = [];
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            points.push(this.evalLocal(t));
        }
        return points;
    }

    getDeviceFlattenedPoints(): Point2D[] {
        return this.getLocalFlattenedPoints().map(p => this.transformPointToDevice(p.x, p.y));
    }

    // ========== ДОБАВИТЬ ЭТОТ БЛОК ==========
    getControlPoints(): Point2D[] {
        return [this.p0, this.p1, this.p2];
    }

    setControlPoint(index: number, point: Point2D): void {
        switch (index) {
            case 0: this.p0 = { ...point }; break;
            case 1: this.p1 = { ...point }; break;
            case 2: this.p2 = { ...point }; break;
        }
    }
    // ========== КОНЕЦ БЛОКА ==========

    drawRaster(r: RasterRenderer): void {
        const points = this.getDeviceFlattenedPoints();
        const strokeColor = this.colorToRGBA(this.strokeStyle, this.strokeOpacity);

        if (this.strokeWidth > 0 && points.length > 1) {
            for (let i = 0; i < points.length - 1; i++) {
                r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, strokeColor, this.strokeWidth);
            }
        }
    }

    private pointToSegmentDistance(px: number, py: number, a: Point2D, b: Point2D): number {
        const ax = px - a.x;
        const ay = py - a.y;
        const bx = b.x - a.x;
        const by = b.y - a.y;

        const dot = ax * bx + ay * by;
        const len2 = bx * bx + by * by;

        if (len2 === 0) return Math.hypot(ax, ay);

        let t = dot / len2;
        t = Math.max(0, Math.min(1, t));

        const projX = a.x + t * bx;
        const projY = a.y + t * by;

        return Math.hypot(px - projX, py - projY);
    }

    hitTest(px: number, py: number): boolean {
        const points = this.getDeviceFlattenedPoints();
        const threshold = Math.max(this.strokeWidth, 8);

        for (let i = 0; i < points.length - 1; i++) {
            const dist = this.pointToSegmentDistance(px, py, points[i], points[i + 1]);
            if (dist <= threshold) return true;
        }
        return false;
    }

    getLocalBounds(): Bounds {
        const points = this.getLocalFlattenedPoints();
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return { minX, minY, maxX, maxY };
    }

    getBounds(): Bounds {
        const points = this.getDeviceFlattenedPoints();
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return { minX, minY, maxX, maxY };
    }

    toJSON(): object {
        return {
            type: 'QuadraticBezier',
            id: this.id,
            p0: { ...this.p0 },
            p1: { ...this.p1 },
            p2: { ...this.p2 },
            transform: { ...this.transform },
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}