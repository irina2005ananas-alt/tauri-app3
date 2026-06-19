import { Shape } from './Shape';
import type { Transform, Bounds, Point, IRenderer } from './types';

export type PathMode = 'polyline' | 'bezier' | 'catmull';

export class PathBezier extends Shape {
    public points: Point[];
    public mode: PathMode;
    public closed: boolean;
    private segmentsPerCurve: number = 30;

    constructor(id: string, transform: Transform, points: Point[], mode: PathMode = 'polyline', closed: boolean = false) {
        super(id, transform);
        this.points = points.map(p => ({ ...p }));
        this.mode = mode;
        this.closed = closed;
    }

    private catmullRomToBezier(p0: Point, p1: Point, p2: Point, p3: Point): { p0: Point, p1: Point, p2: Point, p3: Point } {
        const tension = 0.5;
        return {
            p0: { x: p1.x, y: p1.y },
            p1: {
                x: p1.x + (p2.x - p0.x) * tension / 3,
                y: p1.y + (p2.y - p0.y) * tension / 3
            },
            p2: {
                x: p2.x - (p3.x - p1.x) * tension / 3,
                y: p2.y - (p3.y - p1.y) * tension / 3
            },
            p3: { x: p2.x, y: p2.y }
        };
    }

    private getCatmullBezierSegments(): { p0: Point, p1: Point, p2: Point, p3: Point }[] {
        const segments: { p0: Point, p1: Point, p2: Point, p3: Point }[] = [];
        const n = this.points.length;
        if (n < 2) return segments;

        for (let i = 0; i < n - 1; i++) {
            const pPrev = i > 0 ? this.points[i - 1] : (this.closed ? this.points[n - 1] : this.points[i]);
            const p0 = this.points[i];
            const p1 = this.points[i + 1];
            const pNext = i + 2 < n ? this.points[i + 2] : (this.closed ? this.points[0] : this.points[i + 1]);
            segments.push(this.catmullRomToBezier(pPrev, p0, p1, pNext));
        }

        if (this.closed && n > 2) {
            segments.push(this.catmullRomToBezier(
                this.points[n - 2],
                this.points[n - 1],
                this.points[0],
                this.points[1]
            ));
        }
        return segments;
    }

    private getBezierSegmentsSmooth(): { p0: Point, p1: Point, p2: Point, p3: Point }[] {
        const segments: { p0: Point, p1: Point, p2: Point, p3: Point }[] = [];
        const n = this.points.length;
        if (n < 2) return segments;

        for (let i = 0; i < n - 1; i++) {
            const pPrev = i > 0 ? this.points[i - 1] : (this.closed ? this.points[n - 1] : this.points[i]);
            const p0 = this.points[i];
            const p1 = this.points[i + 1];
            const pNext = i + 2 < n ? this.points[i + 2] : (this.closed ? this.points[0] : this.points[i + 1]);
            const tension = 0.5;
            const cp1: Point = {
                x: p0.x + (p1.x - pPrev.x) * tension / 2,
                y: p0.y + (p1.y - pPrev.y) * tension / 2
            };
            const cp2: Point = {
                x: p1.x - (pNext.x - p0.x) * tension / 2,
                y: p1.y - (pNext.y - p0.y) * tension / 2
            };
            segments.push({ p0, p1: cp1, p2: cp2, p3: p1 });
        }
        return segments;
    }

    private evalCubicBezier(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }

    private getLocalFlattenedPoints(): Point[] {
        if (this.points.length === 0) return [];
        if (this.points.length === 1) return [{ ...this.points[0] }];

        const result: Point[] = [];

        if (this.mode === 'polyline') {
            for (const p of this.points) result.push({ ...p });
        } else if (this.mode === 'bezier') {
            const segments = this.getBezierSegmentsSmooth();
            for (const seg of segments) {
                for (let i = 0; i <= this.segmentsPerCurve; i++) {
                    const t = i / this.segmentsPerCurve;
                    result.push(this.evalCubicBezier(t, seg.p0, seg.p1, seg.p2, seg.p3));
                }
            }
        } else if (this.mode === 'catmull') {
            const segments = this.getCatmullBezierSegments();
            for (const seg of segments) {
                for (let i = 0; i <= this.segmentsPerCurve; i++) {
                    const t = i / this.segmentsPerCurve;
                    result.push(this.evalCubicBezier(t, seg.p0, seg.p1, seg.p2, seg.p3));
                }
            }
        }
        return result;
    }

    override getLocalBounds(): Bounds {
        const pts = this.getLocalFlattenedPoints();
        if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
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
        if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
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
            if (this.closed && pts.length > 2) {
                r.strokeLine(pts[pts.length - 1].x, pts[pts.length - 1].y, pts[0].x, pts[0].y, stroke, this.strokeWidth);
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
        const threshold = Math.max(10, this.strokeWidth);
        for (let i = 0; i < pts.length - 1; i++) {
            if (this.pointToSegmentDistance(px, py, pts[i], pts[i + 1]) <= threshold) return true;
        }
        if (this.closed && pts.length > 2) {
            if (this.pointToSegmentDistance(px, py, pts[pts.length - 1], pts[0]) <= threshold) return true;
        }
        return false;
    }

    getControlPoints(): Point[] {
        return this.points.map(p => ({ ...p }));
    }

    setControlPoint(index: number, point: Point): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = { ...point };
        }
    }

    addPoint(point: Point, index?: number): void {
        if (index !== undefined && index >= 0 && index <= this.points.length) {
            this.points.splice(index, 0, { ...point });
        } else {
            this.points.push({ ...point });
        }
    }

    removePoint(index: number): void {
        if (index >= 0 && index < this.points.length && this.points.length > 2) {
            this.points.splice(index, 1);
        }
    }

    override clone(): PathBezier {
        const cloned = new PathBezier(
            this.id + '_copy',
            { ...this.transform },
            this.points.map(p => ({ ...p })),
            this.mode,
            this.closed
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
            type: 'pathBezier',
            transform: { ...this.transform },
            points: this.points.map(p => ({ ...p })),
            mode: this.mode,
            closed: this.closed,
            strokeStyle: this.strokeColor ? `rgba(${this.strokeColor.r},${this.strokeColor.g},${this.strokeColor.b},${this.strokeOpacity})` : null,
            strokeWidth: this.strokeWidth,
        };
    }
}