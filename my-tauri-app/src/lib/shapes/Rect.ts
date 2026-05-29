import { Shape, type Bounds } from './Shape';
import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';
import type { Point2D } from '../math/mat3';

export class Rect extends Shape {
    width: number;
    height: number;

    constructor(width: number = 100, height: number = 100, id?: string) {
        super(id);
        this.width = width;
        this.height = height;
    }

    protected createClone(): Shape {
        return new Rect(this.width, this.height, this.id);
    }

    // Получить 4 вершины прямоугольника в локальных координатах (центр в 0,0)
    private getLocalVertices(): Point2D[] {
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        return [
            { x: -halfW, y: -halfH },
            { x: halfW, y: -halfH },
            { x: halfW, y: halfH },
            { x: -halfW, y: halfH }
        ];
    }

    // Получить вершины в экранных координатах
    getDeviceVertices(): Point2D[] {
        const localVerts = this.getLocalVertices();
        return localVerts.map(v => this.transformPointToDevice(v.x, v.y));
    }

    drawRaster(r: RasterRenderer): void {
        const vertices = this.getDeviceVertices();
        const fillColor = this.colorToRGBA(this.fillStyle, this.fillOpacity);
        const strokeColor = this.colorToRGBA(this.strokeStyle, this.strokeOpacity);

        // Рисуем заливку
        r.fillPolygon(vertices, fillColor);

        // Рисуем обводку
        if (this.strokeWidth > 0) {
            r.strokePolygon(vertices, strokeColor, this.strokeWidth);
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;

        const halfW = this.width / 2;
        const halfH = this.height / 2;

        return local.x >= -halfW && local.x <= halfW &&
            local.y >= -halfH && local.y <= halfH;
    }

    getLocalBounds(): Bounds {
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        return {
            minX: -halfW,
            minY: -halfH,
            maxX: halfW,
            maxY: halfH
        };
    }

    getBounds(): Bounds {
        const vertices = this.getDeviceVertices();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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
            type: 'Rect',
            id: this.id,
            width: this.width,
            height: this.height,
            transform: { ...this.transform },
            fillStyle: this.fillStyle,
            fillOpacity: this.fillOpacity,
            strokeStyle: this.strokeStyle,
            strokeWidth: this.strokeWidth,
            strokeOpacity: this.strokeOpacity
        };
    }
}