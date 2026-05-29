import { describe, test, expect } from 'vitest';
import { Rect } from './Rect';
import { Line } from './Line';
import { Oval } from './Oval';

describe('Rect', () => {
    test('hitTest - точка внутри прямоугольника', () => {
        const rect = new Rect(100, 100);
        rect.transform.x = 100;
        rect.transform.y = 100;

        expect(rect.hitTest(100, 100)).toBe(true);
        expect(rect.hitTest(80, 80)).toBe(true);
        expect(rect.hitTest(50, 100)).toBe(true);
    });

    test('hitTest - точка снаружи прямоугольника', () => {
        const rect = new Rect(100, 100);
        rect.transform.x = 100;
        rect.transform.y = 100;

        expect(rect.hitTest(160, 100)).toBe(false);
        expect(rect.hitTest(100, 160)).toBe(false);
        expect(rect.hitTest(30, 30)).toBe(false);
    });

    test('getBounds - возвращает корректные границы', () => {
        const rect = new Rect(80, 60);
        rect.transform.x = 200;
        rect.transform.y = 150;

        const bounds = rect.getBounds();
        expect(bounds.minX).toBeCloseTo(160);
        expect(bounds.maxX).toBeCloseTo(240);
        expect(bounds.minY).toBeCloseTo(120);
        expect(bounds.maxY).toBeCloseTo(180);
    });
});

describe('Line', () => {
    test('hitTest - точка на линии', () => {
        const line = new Line(-50, 0, 50, 0);
        line.transform.x = 200;
        line.transform.y = 200;
        line.strokeWidth = 10;

        expect(line.hitTest(200, 200)).toBe(true);
        expect(line.hitTest(180, 200)).toBe(true);
        expect(line.hitTest(220, 200)).toBe(true);
    });

    test('hitTest - точка далеко от линии', () => {
        const line = new Line(-50, 0, 50, 0);
        line.transform.x = 200;
        line.transform.y = 200;
        line.strokeWidth = 2;

        expect(line.hitTest(200, 250)).toBe(false);
        expect(line.hitTest(150, 230)).toBe(false);
        expect(line.hitTest(250, 250)).toBe(false);
    });

    test('hitTest - точка рядом с линией в пределах толщины', () => {
        const line = new Line(-50, 0, 50, 0);
        line.transform.x = 200;
        line.transform.y = 200;
        line.strokeWidth = 20;

        expect(line.hitTest(200, 210)).toBe(true);
    });
});

describe('Oval', () => {
    test('hitTest - точка внутри эллипса', () => {
        const oval = new Oval(50, 30);
        oval.transform.x = 100;
        oval.transform.y = 100;

        expect(oval.hitTest(100, 100)).toBe(true);
        expect(oval.hitTest(120, 100)).toBe(true);
        expect(oval.hitTest(100, 115)).toBe(true);
        expect(oval.hitTest(149, 100)).toBe(true); // 49px, все еще внутри с допуском
    });

    test('hitTest - точка снаружи эллипса', () => {
        const oval = new Oval(50, 30);
        oval.transform.x = 100;
        oval.transform.y = 100;

        // Точки вне эллипса (значение > 1)
        expect(oval.hitTest(160, 100)).toBe(false);
        expect(oval.hitTest(100, 150)).toBe(false);
        expect(oval.hitTest(100, 50)).toBe(false);
        // 52px > 50, должно быть снаружи
        expect(oval.hitTest(152, 100)).toBe(false);
        expect(oval.hitTest(155, 100)).toBe(false);
    });

    test('getBounds - возвращает корректные границы', () => {
        const oval = new Oval(40, 25);
        oval.transform.x = 300;
        oval.transform.y = 250;

        const bounds = oval.getBounds();
        expect(bounds.minX).toBeCloseTo(260);
        expect(bounds.maxX).toBeCloseTo(340);
        expect(bounds.minY).toBeCloseTo(225);
        expect(bounds.maxY).toBeCloseTo(275);
    });
});