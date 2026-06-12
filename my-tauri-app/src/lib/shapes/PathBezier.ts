import { Shape, type Bounds } from './Shape';
import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';
import type { Point2D } from '../math/mat3';

export type PathMode = 'polyline' | 'bezier' | 'catmull';

export class PathBezier extends Shape {
    points: Point2D[];
    mode: PathMode;
    closed: boolean;
    private segmentsPerCurve: number = 30;

    constructor(points?: Point2D[], mode: PathMode = 'polyline', closed: boolean = false, id?: string) {
        super(id);
        this.points = points ? [...points] : [
            { x: -100, y: 0 },
            { x: -50, y: -50 },
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        ];
        this.mode = mode;
        this.closed = closed;
    }

    protected createClone(): Shape {
        const clone = new PathBezier(
            [...this.points],
            this.mode,
            this.closed,
            this.id
        );
        return clone;
    }

    getControlPoints(): Point2D[] {
        return [...this.points];
    }

    setControlPoint(index: number, point: Point2D): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = { ...point };
        }
    }

    addPoint(point: Point2D, index?: number): void {
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

    // ========== Catmull-Rom to Bezier ==========
    private catmullRomToBezier(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): { p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D } {
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

    private getCatmullBezierSegments(): { p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D }[] {
        const segments: { p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D }[] = [];
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
            const lastSeg = this.catmullRomToBezier(
                this.points[n - 2],
                this.points[n - 1],
                this.points[0],
                this.points[1]
            );
            segments.push(lastSeg);
        }

        return segments;
    }

    private getBezierSegmentsSmooth(): { p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D }[] {
        const segments: { p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D }[] = [];
        const n = this.points.length;

        if (n < 2) return segments;

        for (let i = 0; i < n - 1; i++) {
            const pPrev = i > 0 ? this.points[i - 1] : (this.closed ? this.points[n - 1] : this.points[i]);
            const p0 = this.points[i];
            const p1 = this.points[i + 1];
            const pNext = i + 2 < n ? this.points[i + 2] : (this.closed ? this.points[0] : this.points[i + 1]);

            // Коэффициент гладкости (tension = 0.5)
            const tension = 0.5;

            const cp1: Point2D = {
                x: p0.x + (p1.x - pPrev.x) * tension / 2,
                y: p0.y + (p1.y - pPrev.y) * tension / 2
            };

            const cp2: Point2D = {
                x: p1.x - (pNext.x - p0.x) * tension / 2,
                y: p1.y - (pNext.y - p0.y) * tension / 2
            };

            segments.push({ p0, p1: cp1, p2: cp2, p3: p1 });
        }

        return segments;
    }

    // Вычисление точки на кубической кривой Безье
    private evalCubicBezier(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
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

    getLocalFlattenedPoints(): Point2D[] {
        if (this.points.length === 0) return [];
        if (this.points.length === 1) return [{ ...this.points[0] }];

        const result: Point2D[] = [];

        if (this.mode === 'polyline') {
            // Прямые линии между точками
            for (const p of this.points) {
                result.push({ ...p });
            }
        } else if (this.mode === 'bezier') {
            // Гладкие сегменты между соседними точками (как у одногруппницы)
            const segments = this.getBezierSegmentsSmooth();
            for (const seg of segments) {
                for (let i = 0; i <= this.segmentsPerCurve; i++) {
                    const t = i / this.segmentsPerCurve;
                    const point = this.evalCubicBezier(t, seg.p0, seg.p1, seg.p2, seg.p3);
                    result.push(point);
                }
            }
        } else if (this.mode === 'catmull') {
            // Catmull-Rom сплайн
            const segments = this.getCatmullBezierSegments();
            for (const seg of segments) {
                for (let i = 0; i <= this.segmentsPerCurve; i++) {
                    const t = i / this.segmentsPerCurve;
                    const point = this.evalCubicBezier(t, seg.p0, seg.p1, seg.p2, seg.p3);
                    result.push(point);
                }
            }
        }

        return result;
    }

    getDeviceFlattenedPoints(): Point2D[] {
        return this.getLocalFlattenedPoints().map(p => this.transformPointToDevice(p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDeviceFlattenedPoints();
        const strokeColor = this.colorToRGBA(this.strokeStyle, this.strokeOpacity);

        if (this.strokeWidth > 0 && points.length > 1) {
            for (let i = 0; i < points.length - 1; i++) {
                r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, strokeColor, this.strokeWidth);
            }
        }

        if (this.closed && points.length > 2) {
            r.strokeLine(points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y, strokeColor, this.strokeWidth);
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
        const threshold = Math.max(this.strokeWidth, 10);

        if (points.length < 2) return false;

        for (let i = 0; i < points.length - 1; i++) {
            const dist = this.pointToSegmentDistance(px, py, points[i], points[i + 1]);
            if (dist <= threshold) return true;
        }

        if (this.closed && points.length > 2) {
            const dist = this.pointToSegmentDistance(px, py, points[points.length - 1], points[0]);
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
            type: 'PathBezier',
            id: this.id,
            points: this.points.map(p => ({ ...p })),
            mode: this.mode,
            closed: this.closed,
            transform: { ...this.transform },
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}