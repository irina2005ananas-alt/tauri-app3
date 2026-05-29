import { Shape, type Bounds } from './Shape';
import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';
import type { Point2D } from '../math/mat3';

export class Oval extends Shape {
    rx: number; // радиус по X
    ry: number; // радиус по Y

    constructor(rx: number = 50, ry: number = 30, id?: string) {
        super(id);
        this.rx = rx;
        this.ry = ry;
    }

    protected createClone(): Shape {
        return new Oval(this.rx, this.ry, this.id);
    }

    // Получить точки эллипса в локальных координатах
    private getLocalPoints(segments: number = 48): Point2D[] {
        const points: Point2D[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI / segments);
            points.push({
                x: Math.cos(angle) * this.rx,
                y: Math.sin(angle) * this.ry
            });
        }
        return points;
    }

    // Получить точки эллипса в экранных координатах
    getDevicePoints(segments: number = 48): Point2D[] {
        return this.getLocalPoints(segments).map(p => this.transformPointToDevice(p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const points = this.getDevicePoints();
        const fillColor = this.colorToRGBA(this.fillStyle, this.fillOpacity);
        const strokeColor = this.colorToRGBA(this.strokeStyle, this.strokeOpacity);

        // Рисуем заливку
        r.fillPolygon(points, fillColor);

        // Рисуем обводку
        if (this.strokeWidth > 0) {
            r.strokePolygon(points, strokeColor, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;

        // Уравнение эллипса: (x/rx)^2 + (y/ry)^2 <= 1
        // Используем небольшой допуск для граничных случаев (0.01 вместо 0.1)
        const tolerance = 0.01;
        const normalized = (local.x * local.x) / (this.rx * this.rx) +
            (local.y * local.y) / (this.ry * this.ry);

        return normalized <= 1 + tolerance;
    }

    getLocalBounds(): Bounds {
        return {
            minX: -this.rx,
            minY: -this.ry,
            maxX: this.rx,
            maxY: this.ry
        };
    }

    getBounds(): Bounds {
        const points = this.getDevicePoints();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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
            type: 'Oval',
            id: this.id,
            rx: this.rx,
            ry: this.ry,
            transform: { ...this.transform },
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}