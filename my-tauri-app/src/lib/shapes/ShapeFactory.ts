import { Shape } from './Shape';
import { Rect } from './Rect';
import { Line } from './Line';
import { Oval } from './Oval';
import { Triangle } from './Triangle';
import { QuadraticBezier } from './QuadraticBezier';
import { CubicBezier } from './CubicBezier';
import { PathBezier } from './PathBezier';
import type { Transform } from './types';

export class ShapeFactory {
    static fromJSON(data: any): Shape {
        const { id, type, transform, ...rest } = data;
        const t: Transform = transform;

        switch (type) {
            case 'rect':
                return new Rect(id, t, rest.width, rest.height);
            case 'line':
                return new Line(id, t, rest.x1, rest.y1, rest.x2, rest.y2);
            case 'oval':
                return new Oval(id, t, rest.radiusX, rest.radiusY);
            case 'triangle':
                return new Triangle(id, t, rest.p0, rest.p1, rest.p2);
            case 'quadraticBezier':
                return new QuadraticBezier(id, t, rest.p0, rest.p1, rest.p2);
            case 'cubicBezier':
                return new CubicBezier(id, t, rest.p0, rest.p1, rest.p2, rest.p3);
            case 'pathBezier':
                return new PathBezier(id, t, rest.points, rest.mode, rest.closed);
            default:
                throw new Error(`Unknown shape type: ${type}`);
        }
    }

    static createRect(id: string, transform: Transform, width: number, height: number): Rect {
        return new Rect(id, transform, width, height);
    }

    static createLine(id: string, transform: Transform, x1: number, y1: number, x2: number, y2: number): Line {
        return new Line(id, transform, x1, y1, x2, y2);
    }

    static createOval(id: string, transform: Transform, radiusX: number, radiusY: number): Oval {
        return new Oval(id, transform, radiusX, radiusY);
    }

    static createTriangle(id: string, transform: Transform, p0: Point, p1: Point, p2: Point): Triangle {
        return new Triangle(id, transform, p0, p1, p2);
    }

    static createQuadraticBezier(id: string, transform: Transform, p0: Point, p1: Point, p2: Point): QuadraticBezier {
        return new QuadraticBezier(id, transform, p0, p1, p2);
    }

    static createCubicBezier(id: string, transform: Transform, p0: Point, p1: Point, p2: Point, p3: Point): CubicBezier {
        return new CubicBezier(id, transform, p0, p1, p2, p3);
    }

    static createPathBezier(id: string, transform: Transform, points: Point[], mode: PathMode = 'polyline', closed: boolean = false): PathBezier {
        return new PathBezier(id, transform, points, mode, closed);
    }
}