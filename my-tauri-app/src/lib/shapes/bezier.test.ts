import { describe, test, expect } from 'vitest';
import { QuadraticBezier } from './QuadraticBezier';
import { CubicBezier } from './CubicBezier';
import { PathBezier } from './PathBezier';
import type { Point2D } from '../math/mat3';

describe('QuadraticBezier (квадратичная кривая Безье)', () => {
    test('evalLocal - точка в начале (t=0)', () => {
        const bezier = new QuadraticBezier(
            { x: 0, y: 0 },
            { x: 50, y: 100 },
            { x: 100, y: 0 }
        );

        const p = bezier.evalLocal(0);
        expect(p.x).toBeCloseTo(0);
        expect(p.y).toBeCloseTo(0);
    });

    test('evalLocal - точка в конце (t=1)', () => {
        const bezier = new QuadraticBezier(
            { x: 0, y: 0 },
            { x: 50, y: 100 },
            { x: 100, y: 0 }
        );

        const p = bezier.evalLocal(1);
        expect(p.x).toBeCloseTo(100);
        expect(p.y).toBeCloseTo(0);
    });

    test('evalLocal - середина кривой (t=0.5)', () => {
        const bezier = new QuadraticBezier(
            { x: 0, y: 0 },
            { x: 50, y: 100 },
            { x: 100, y: 0 }
        );

        const p = bezier.evalLocal(0.5);
        // Формула: (1-t)²*P0 + 2(1-t)t*P1 + t²*P2
        // При t=0.5: 0.25*(0,0) + 0.5*(50,100) + 0.25*(100,0) = (25+25, 0+50+0) = (50,50)
        expect(p.x).toBeCloseTo(50);
        expect(p.y).toBeCloseTo(50);
    });

    test('getControlPoints - возвращает 3 точки', () => {
        const bezier = new QuadraticBezier();
        const points = bezier.getControlPoints();
        expect(points.length).toBe(3);
    });

    test('setControlPoint - изменяет управляющую точку', () => {
        const bezier = new QuadraticBezier(
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        );

        const newPoint = { x: 60, y: 80 };
        bezier.setControlPoint(1, newPoint);

        const points = bezier.getControlPoints();
        expect(points[1].x).toBe(60);
        expect(points[1].y).toBe(80);
    });

    test('getBounds - границы корректны', () => {
        const bezier = new QuadraticBezier(
            { x: 0, y: 0 },
            { x: 50, y: 100 },
            { x: 100, y: 0 }
        );

        const bounds = bezier.getLocalBounds();
        expect(bounds.minX).toBeLessThanOrEqual(0);
        expect(bounds.maxX).toBeGreaterThanOrEqual(100);
        expect(bounds.minY).toBeLessThanOrEqual(0);
        expect(bounds.maxY).toBeGreaterThanOrEqual(50); // максимальная Y примерно 50
    });
});

describe('CubicBezier (кубическая кривая Безье)', () => {
    test('evalLocal - точка в начале (t=0)', () => {
        const bezier = new CubicBezier(
            { x: 0, y: 0 },
            { x: 30, y: 50 },
            { x: 70, y: 50 },
            { x: 100, y: 0 }
        );

        const p = bezier.evalLocal(0);
        expect(p.x).toBeCloseTo(0);
        expect(p.y).toBeCloseTo(0);
    });

    test('evalLocal - точка в конце (t=1)', () => {
        const bezier = new CubicBezier(
            { x: 0, y: 0 },
            { x: 30, y: 50 },
            { x: 70, y: 50 },
            { x: 100, y: 0 }
        );

        const p = bezier.evalLocal(1);
        expect(p.x).toBeCloseTo(100);
        expect(p.y).toBeCloseTo(0);
    });

    test('evalLocal - середина кривой (t=0.5)', () => {
        const bezier = new CubicBezier(
            { x: 0, y: 0 },
            { x: 0, y: 100 },
            { x: 100, y: 100 },
            { x: 100, y: 0 }
        );

        const p = bezier.evalLocal(0.5);
        // Симметричная кривая: середина должна быть примерно (50, 75)
        expect(p.x).toBeCloseTo(50);
        expect(p.y).toBeCloseTo(75);
    });

    test('getControlPoints - возвращает 4 точки', () => {
        const bezier = new CubicBezier();
        const points = bezier.getControlPoints();
        expect(points.length).toBe(4);
    });

    test('setControlPoint - изменяет управляющую точку', () => {
        const bezier = new CubicBezier(
            { x: 0, y: 0 },
            { x: 30, y: 50 },
            { x: 70, y: 50 },
            { x: 100, y: 0 }
        );

        const newPoint = { x: 40, y: 60 };
        bezier.setControlPoint(2, newPoint);

        const points = bezier.getControlPoints();
        expect(points[2].x).toBe(40);
        expect(points[2].y).toBe(60);
    });

    test('getBounds - границы корректны', () => {
        const bezier = new CubicBezier(
            { x: 0, y: 0 },
            { x: 30, y: 100 },
            { x: 70, y: 100 },
            { x: 100, y: 0 }
        );

        const bounds = bezier.getLocalBounds();
        expect(bounds.minX).toBeLessThanOrEqual(0);
        expect(bounds.maxX).toBeGreaterThanOrEqual(100);
        expect(bounds.minY).toBeLessThanOrEqual(0);
        expect(bounds.maxY).toBeGreaterThanOrEqual(75);
    });
});

describe('PathBezier (составной путь)', () => {
    test('getControlPoints - возвращает все опорные точки', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        const controlPoints = path.getControlPoints();
        expect(controlPoints.length).toBe(3);
        expect(controlPoints[0].x).toBe(0);
        expect(controlPoints[1].x).toBe(50);
        expect(controlPoints[2].x).toBe(100);
    });

    test('addPoint - добавляет новую точку в конец', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        path.addPoint({ x: 50, y: 50 });

        const controlPoints = path.getControlPoints();
        expect(controlPoints.length).toBe(3);
        expect(controlPoints[2].x).toBe(50);
        expect(controlPoints[2].y).toBe(50);
    });

    test('addPoint - добавляет точку по индексу', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        path.addPoint({ x: 50, y: 50 }, 1);

        const controlPoints = path.getControlPoints();
        expect(controlPoints.length).toBe(3);
        expect(controlPoints[1].x).toBe(50);
        expect(controlPoints[1].y).toBe(50);
    });

    test('removePoint - удаляет точку', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        path.removePoint(1);

        const controlPoints = path.getControlPoints();
        expect(controlPoints.length).toBe(2);
        expect(controlPoints[1].x).toBe(100);
    });

    test('removePoint - не удаляет точку если меньше 3 точек', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        path.removePoint(0);

        const controlPoints = path.getControlPoints();
        expect(controlPoints.length).toBe(2); // не удалилось
    });

    test('setControlPoint - изменяет опорную точку', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        path.setControlPoint(1, { x: 60, y: 70 });

        const controlPoints = path.getControlPoints();
        expect(controlPoints[1].x).toBe(60);
        expect(controlPoints[1].y).toBe(70);
    });

    test('getBounds - границы для полилинии', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 100, y: 50 },
            { x: 200, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        const bounds = path.getLocalBounds();

        expect(bounds.minX).toBeCloseTo(0);
        expect(bounds.maxX).toBeCloseTo(200);
        expect(bounds.minY).toBeCloseTo(0);
        expect(bounds.maxY).toBeCloseTo(50);
    });

    test('режим polyline - количество точек не меняется', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'polyline', false);
        const flattened = path.getLocalFlattenedPoints();

        // Для полилинии точки не аппроксимируются дополнительными сегментами
        expect(flattened.length).toBe(3);
    });

    test('режим catmull - создает больше точек для гладкости', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'catmull', false);
        const flattened = path.getLocalFlattenedPoints();

        // Для сплайна должно быть больше точек (аппроксимация)
        expect(flattened.length).toBeGreaterThan(3);
    });
});

describe('Сериализация (toJSON)', () => {
    test('QuadraticBezier - toJSON возвращает корректный объект', () => {
        const bezier = new QuadraticBezier(
            { x: 10, y: 20 },
            { x: 30, y: 40 },
            { x: 50, y: 60 },
            'test-id'
        );

        const json = bezier.toJSON();
        expect(json).toHaveProperty('type', 'QuadraticBezier');
        expect(json).toHaveProperty('id', 'test-id');
        expect(json).toHaveProperty('p0');
        expect(json).toHaveProperty('p1');
        expect(json).toHaveProperty('p2');
    });

    test('CubicBezier - toJSON возвращает корректный объект', () => {
        const bezier = new CubicBezier(
            { x: 10, y: 20 },
            { x: 30, y: 40 },
            { x: 50, y: 60 },
            { x: 70, y: 80 },
            'test-id'
        );

        const json = bezier.toJSON();
        expect(json).toHaveProperty('type', 'CubicBezier');
        expect(json).toHaveProperty('id', 'test-id');
        expect(json).toHaveProperty('p0');
        expect(json).toHaveProperty('p1');
        expect(json).toHaveProperty('p2');
        expect(json).toHaveProperty('p3');
    });

    test('PathBezier - toJSON возвращает корректный объект', () => {
        const points: Point2D[] = [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 }
        ];
        const path = new PathBezier(points, 'catmull', true, 'test-id');

        const json = path.toJSON();
        expect(json).toHaveProperty('type', 'PathBezier');
        expect(json).toHaveProperty('id', 'test-id');
        expect(json).toHaveProperty('mode', 'catmull');
        expect(json).toHaveProperty('closed', true);
        expect(json).toHaveProperty('points');
        expect(Array.isArray(json.points)).toBe(true);
        expect(json.points.length).toBe(3);
    });
});