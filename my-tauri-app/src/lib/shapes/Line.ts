import { Shape, type Bounds } from './Shape';
import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';
import type { Point2D } from '../math/mat3';

export class Line extends Shape {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(x1: number = -50, y1: number = 0, x2: number = 50, y2: number = 0, id?: string) {
        super(id);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    protected createClone(): Shape {
        return new Line(this.x1, this.y1, this.x2, this.y2, this.id);
    }

    // Получить конечные точки в локальных координатах
    private getLocalEndpoints(): Point2D[] {
        return [
            { x: this.x1, y: this.y1 },
            { x: this.x2, y: this.y2 }
        ];
    }

    // Получить конечные точки в экранных координатах
    getDeviceEndpoints(): Point2D[] {
        return this.getLocalEndpoints().map(p => this.transformPointToDevice(p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const [start, end] = this.getDeviceEndpoints();
        const strokeColor = this.colorToRGBA(this.strokeStyle, this.strokeOpacity);

        if (this.strokeWidth > 0) {
            r.strokeLine(start.x, start.y, end.x, end.y, strokeColor, this.strokeWidth);
        }
    }

    // Расстояние от точки до отрезка
    private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const ax = px - x1;
        const ay = py - y1;
        const bx = x2 - x1;
        const by = y2 - y1;

        const dot = ax * bx + ay * by;
        const len2 = bx * bx + by * by;

        if (len2 === 0) return Math.hypot(ax, ay);

        let t = dot / len2;
        t = Math.max(0, Math.min(1, t));

        const projX = x1 + t * bx;
        const projY = y1 + t * by;

        return Math.hypot(px - projX, py - projY);
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;

        const distance = this.pointToSegmentDistance(
            local.x, local.y,
            this.x1, this.y1,
            this.x2, this.y2
        );

        // Упрощенный порог - просто толщина линии в локальных координатах
        const threshold = Math.max(this.strokeWidth, 5);

        return distance <= threshold;
    }

    getLocalBounds(): Bounds {
        return {
            minX: Math.min(this.x1, this.x2),
            minY: Math.min(this.y1, this.y2),
            maxX: Math.max(this.x1, this.x2),
            maxY: Math.max(this.y1, this.y2)
        };
    }

    getBounds(): Bounds {
        const [start, end] = this.getDeviceEndpoints();
        const halfWidth = Math.max(this.strokeWidth, 5);

        return {
            minX: Math.min(start.x, end.x) - halfWidth,
            minY: Math.min(start.y, end.y) - halfWidth,
            maxX: Math.max(start.x, end.x) + halfWidth,
            maxY: Math.max(start.y, end.y) + halfWidth
        };
    }

    toJSON(): object {
        return {
            type: 'Line',
            id: this.id,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
            transform: { ...this.transform },
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}