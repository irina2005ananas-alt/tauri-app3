import { Shape } from './Shape';
import type { Transform, Bounds, Point, IRenderer } from './types';

export class Triangle extends Shape {
    public p0: Point;
    public p1: Point;
    public p2: Point;

    constructor(id: string, transform: Transform, p0: Point, p1: Point, p2: Point) {
        super(id, transform);
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    override getLocalBounds(): Bounds {
        const pts = [this.p0, this.p1, this.p2];
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
        const device = [this.p0, this.p1, this.p2].map(p => this.transformPointToDevice(p.x, p.y));
        const xs = device.map(p => p.x);
        const ys = device.map(p => p.y);
        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
        };
    }

    override draw(r: IRenderer): void {
        const device = [this.p0, this.p1, this.p2].map(p => this.transformPointToDevice(p.x, p.y));

        const fill = this.getEffectiveFillColor();
        if (fill) r.fillPolygon(device, fill);

        const stroke = this.getEffectiveStrokeColor();
        if (stroke && this.strokeWidth > 0) {
            r.strokePolygon(device, stroke, this.strokeWidth);
        }
    }

    private isLeft(p: Point, a: Point, b: Point): number {
        return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    }

    override hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;

        const left0 = this.isLeft(local, this.p0, this.p1);
        const left1 = this.isLeft(local, this.p1, this.p2);
        const left2 = this.isLeft(local, this.p2, this.p0);

        const hasNeg = (left0 < 0) || (left1 < 0) || (left2 < 0);
        const hasPos = (left0 > 0) || (left1 > 0) || (left2 > 0);

        return !(hasNeg && hasPos);
    }

    override clone(): Triangle {
        const cloned = new Triangle(
            this.id + '_copy',
            { ...this.transform },
            { ...this.p0 },
            { ...this.p1 },
            { ...this.p2 }
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
            type: 'triangle',
            transform: { ...this.transform },
            p0: { ...this.p0 },
            p1: { ...this.p1 },
            p2: { ...this.p2 },
            fillStyle: this.fillColor ? `rgba(${this.fillColor.r},${this.fillColor.g},${this.fillColor.b},${this.fillOpacity})` : null,
            strokeStyle: this.strokeColor ? `rgba(${this.strokeColor.r},${this.strokeColor.g},${this.strokeColor.b},${this.strokeOpacity})` : null,
            strokeWidth: this.strokeWidth,
        };
    }
}