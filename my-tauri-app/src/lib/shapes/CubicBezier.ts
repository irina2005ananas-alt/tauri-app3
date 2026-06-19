import { Shape } from './Shape';
import type { Transform, Bounds, Point, IRenderer } from './types';

export class CubicBezier extends Shape {
    public p0: Point;
    public p1: Point;
    public p2: Point;
    public p3: Point;
    private segments: number = 50;

    constructor(id: string, transform: Transform, p0: Point, p1: Point, p2: Point, p3: Point) {
        super(id, transform);
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    private evalLocal(t: number): Point {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        return {
            x: mt3 * this.p0.x + 3 * mt2 * t * this.p1.x + 3 * mt * t2 * this.p2.x + t3 * this.p3.x,
            y: mt3 * this.p0.y + 3 * mt2 * t * this.p1.y + 3 * mt * t2 * this.p2.y + t3 * this.p3.y,
        };
    }

    private getLocalFlattenedPoints(): Point[] {
        const points: Point[] = [];
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            points.push(this.evalLocal(t));
        }
        return points;
    }

    override getLocalBounds(): Bounds {
        const pts = this.getLocalFlattenedPoints();
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
        };
    }

    override getBounds(): Bounds {
        const pts = this.getLocalFlattenedPoints().map(p => this.transformPointToDevice(p.x, p.y));
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
        };
    }

    override draw(r: IRenderer): void {
        const pts = this.getLocalFlattenedPoints().map(p => this.transformPointToDevice(p.x, p.y));
        const stroke = this.getEffectiveStrokeColor();
        if (stroke && this.strokeWidth > 0) {
            for (let i = 0; i < pts.length - 1; i++) {
                r.strokeLine(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, stroke, this.strokeWidth);
            }
        }
    }

    private pointToSegmentDistance(px: number, py: number, a: Point, b: Point): number {
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

    override hitTest(px: number, py: number): boolean {
        const pts = this.getLocalFlattenedPoints().map(p => this.transformPointToDevice(p.x, p.y));
        const threshold = Math.max(8, this.strokeWidth);
        for (let i = 0; i < pts.length - 1; i++) {
            if (this.pointToSegmentDistance(px, py, pts[i], pts[i + 1]) <= threshold) return true;
        }
        return false;
    }

    getControlPoints(): Point[] {
        return [this.p0, this.p1, this.p2, this.p3];
    }

    setControlPoint(index: number, point: Point): void {
        switch (index) {
            case 0: this.p0 = { ...point }; break;
            case 1: this.p1 = { ...point }; break;
            case 2: this.p2 = { ...point }; break;
            case 3: this.p3 = { ...point }; break;
        }
    }

    override clone(): CubicBezier {
        const cloned = new CubicBezier(
            this.id + '_copy',
            { ...this.transform },
            { ...this.p0 },
            { ...this.p1 },
            { ...this.p2 },
            { ...this.p3 }
        );
        cloned.fillColor = this.fillColor ? { ...this.fillColor } : null;
        cloned.fillOpacity = this.fillOpacity;
        cloned.strokeColor = this.strokeColor ? { ...this.strokeColor } : null;
        cloned.strokeWidth = this.strokeWidth;
        cloned.strokeOpacity = this.strokeOpacity;
        return cloned;
    }

    override toJSON(): any {
        return {
            id: this.id,
            type: 'cubicBezier',
            transform: { ...this.transform },
            p0: { ...this.p0 },
            p1: { ...this.p1 },
            p2: { ...this.p2 },
            p3: { ...this.p3 },
            strokeStyle: this.strokeColor ? `rgba(${this.strokeColor.r},${this.strokeColor.g},${this.strokeColor.b},${this.strokeOpacity})` : null,
            strokeWidth: this.strokeWidth,
        };
    }
}