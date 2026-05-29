import { mat3, type Mat3, type Point2D } from '../math/mat3';
import type { RasterRenderer, RGBA } from '../raster/RasterRenderer';

export interface Transform {
    x: number;
    y: number;
    rotation: number; // радианы
    scaleX: number;
    scaleY: number;
}

export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export abstract class Shape {
    id: string;
    transform: Transform;
    fillStyle: string;
    fillOpacity: number;
    strokeStyle: string;
    strokeWidth: number;
    strokeOpacity: number;

    constructor(id?: string) {
        this.id = id || crypto.randomUUID();
        this.transform = {
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        };
        this.fillStyle = '#3b82f6';
        this.fillOpacity = 0.5;
        this.strokeStyle = '#ffffff';
        this.strokeWidth = 2;
        this.strokeOpacity = 1;
    }

    // Преобразование цвета с учетом opacity
    protected colorToRGBA(color: string, opacity: number): RGBA {
        const hex = color.startsWith('#') ? color : `#${color}`;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b, a: Math.round(opacity * 255) };
    }

    // Матрица преобразования из локальных координат в экранные
    getLocalToDeviceMatrix(): Mat3 {
        return mat3.fromTransform(
            this.transform.x,
            this.transform.y,
            this.transform.rotation,
            this.transform.scaleX,
            this.transform.scaleY
        );
    }

    // Обратная матрица (экранные -> локальные)
    getDeviceToLocalMatrix(): Mat3 | null {
        return mat3.invert(this.getLocalToDeviceMatrix());
    }

    // Преобразование точки из локальных в экранные
    transformPointToDevice(px: number, py: number): Point2D {
        return mat3.transformPoint(this.getLocalToDeviceMatrix(), px, py);
    }

    // Преобразование точки из экранных в локальные
    transformPointToLocal(px: number, py: number): Point2D | null {
        const inv = this.getDeviceToLocalMatrix();
        if (!inv) return null;
        return mat3.transformPoint(inv, px, py);
    }

    // Получить центр фигуры в экранных координатах
    getCenter(): Point2D {
        const localBounds = this.getLocalBounds();
        const centerX = (localBounds.minX + localBounds.maxX) / 2;
        const centerY = (localBounds.minY + localBounds.maxY) / 2;
        return this.transformPointToDevice(centerX, centerY);
    }

    // Изменить границы фигуры (новые границы в экранных координатах)
    resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
        const localBounds = this.getLocalBounds();
        const localW = localBounds.maxX - localBounds.minX;
        const localH = localBounds.maxY - localBounds.minY;

        const deviceW = maxX - minX;
        const deviceH = maxY - minY;

        // Вычисляем новые масштабы
        const newScaleX = deviceW / localW;
        const newScaleY = deviceH / localH;

        // Вычисляем новый центр в экранных координатах
        const newCenterX = (minX + maxX) / 2;
        const newCenterY = (minY + maxY) / 2;

        // Обновляем трансформацию
        this.transform.scaleX = newScaleX;
        this.transform.scaleY = newScaleY;
        this.transform.x = newCenterX;
        this.transform.y = newCenterY;
    }

    // Установить границы (обертка над resizeFromDeviceAABB)
    setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
        this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
    }

    // Клонировать фигуру
    clone(): Shape {
        const clone = this.createClone();
        clone.transform = { ...this.transform };
        clone.fillStyle = this.fillStyle;
        clone.fillOpacity = this.fillOpacity;
        clone.strokeStyle = this.strokeStyle;
        clone.strokeWidth = this.strokeWidth;
        clone.strokeOpacity = this.strokeOpacity;
        return clone;
    }

    // Абстрактные методы (должны быть реализованы в наследниках)
    protected abstract createClone(): Shape;
    abstract drawRaster(r: RasterRenderer): void;
    abstract hitTest(px: number, py: number): boolean;
    abstract getBounds(): Bounds;
    abstract getLocalBounds(): Bounds;
    abstract toJSON(): object;
}