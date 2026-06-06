import { Shape, type Bounds } from './Shape';
import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';
import type { Point2D } from '../math/mat3';

export class Triangle extends Shape {
    p0: Point2D;
    p1: Point2D;
    p2: Point2D;

    constructor(p0?: Point2D, p1?: Point2D, p2?: Point2D, id?: string) {
        super(id);

        if (p0 && p1 && p2) {
            this.p0 = p0;
            this.p1 = p1;
            this.p2 = p2;
        } else {
            this.p0 = { x: -50, y: 30 };
            this.p1 = { x: 50, y: 30 };
            this.p2 = { x: 0, y: -40 };
        }
    }

    protected createClone(): Shape {
        return new Triangle(
            { ...this.p0 },
            { ...this.p1 },
            { ...this.p2 },
            this.id
        );
    }

    getLocalVertices(): Point2D[] {
        return [this.p0, this.p1, this.p2];
    }

    getDeviceVertices(): Point2D[] {
        return this.getLocalVertices().map(v => this.transformPointToDevice(v.x, v.y));
    }

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

    private isLeft(p: Point2D, a: Point2D, b: Point2D): number {
        return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    }

    drawRaster(r: RasterRenderer): void {
        const vertices = this.getDeviceVertices();
        const fillColor = this.colorToRGBA(this.fillStyle, this.fillOpacity);
        const strokeColor = this.colorToRGBA(this.strokeStyle, this.strokeOpacity);

        r.fillPolygon(vertices, fillColor);
        if (this.strokeWidth > 0) {
            r.strokePolygon(vertices, strokeColor, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;

        const left0 = this.isLeft(local, this.p0, this.p1);
        const left1 = this.isLeft(local, this.p1, this.p2);
        const left2 = this.isLeft(local, this.p2, this.p0);

        const hasNeg = (left0 < 0) || (left1 < 0) || (left2 < 0);
        const hasPos = (left0 > 0) || (left1 > 0) || (left2 > 0);

        return !(hasNeg && hasPos);
    }

    getLocalBounds(): Bounds {
        const verts = this.getLocalVertices();
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const v of verts) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }

        return { minX, minY, maxX, maxY };
    }

    getBounds(): Bounds {
        const vertices = this.getDeviceVertices();
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const v of vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        }

        return { minX, minY, maxX, maxY };
    }

    toJSON(): object {
        return {
            type: 'Triangle',
            id: this.id,
            p0: { ...this.p0 },
            p1: { ...this.p1 },
            p2: { ...this.p2 },
            transform: { ...this.transform },
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}