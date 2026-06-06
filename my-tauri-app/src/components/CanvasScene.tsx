import { useEffect, useRef, useState, useCallback } from 'react';
import { RasterRenderer, type LineAlg, type RGBA } from '../lib/raster/RasterRenderer';
import { Rect, Line, Oval, Triangle, QuadraticBezier, CubicBezier, PathBezier } from '../lib/shapes';
import type { Shape } from '../lib/shapes/Shape';
import type { Point2D } from '../lib/math/mat3';

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

interface ControlPointHandle {
    shapeId: string;
    pointIndex: number;
}


//    'polyline' - ломаная (5 точек)
//    'bezier'   - кубические кривые Безье (7 точек = 2 сегмента)
//    'catmull'  - гладкий сплайн через все точки (5 точек)
const PATH_MODE: 'polyline' | 'bezier' | 'catmull' = 'bezier';


export const CanvasScene = ({ lineAlg }: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const shapesRef = useRef<Shape[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [debug, setDebug] = useState('');

    const draggingRef = useRef<{
        active: boolean;
        shapeId: string | null;
        pointIndex: number;
    }>({ active: false, shapeId: null, pointIndex: -1 });

    // Инициализация фигур
    useEffect(() => {
        const shapes: Shape[] = [];

        // 1. Прямоугольник (синий)
        const rect = new Rect(120, 80);
        rect.transform.x = 200;
        rect.transform.y = 150;
        rect.fillStyle = '#3b82f6';
        rect.fillOpacity = 0.6;
        rect.strokeStyle = '#ffffff';
        rect.strokeWidth = 3;
        shapes.push(rect);

        // 2. Линия (оранжевая)
        const line = new Line(-60, 0, 60, 0);
        line.transform.x = 450;
        line.transform.y = 150;
        line.transform.rotation = Math.PI / 4;
        line.strokeStyle = '#ff8800';
        line.strokeWidth = 8;
        shapes.push(line);

        // 3. Овал (зеленый)
        const oval = new Oval(70, 45);
        oval.transform.x = 350;
        oval.transform.y = 350;
        oval.transform.scaleX = 1.2;
        oval.transform.scaleY = 0.8;
        oval.fillStyle = '#10b981';
        oval.fillOpacity = 0.5;
        oval.strokeStyle = '#ffffff';
        oval.strokeWidth = 2;
        shapes.push(oval);

        // 4. Треугольник (фиолетовый)
        const triangle = new Triangle(
            { x: -50, y: 30 },
            { x: 50, y: 30 },
            { x: 0, y: -40 }
        );
        triangle.transform.x = 600;
        triangle.transform.y = 380;
        triangle.transform.rotation = 0.3;
        triangle.fillStyle = '#a855f7';
        triangle.fillOpacity = 0.6;
        triangle.strokeStyle = '#ffffff';
        triangle.strokeWidth = 3;
        shapes.push(triangle);

        // 5. Квадратичная кривая Безье (голубая)
        const quadBezier = new QuadraticBezier(
            { x: -80, y: 0 },
            { x: 0, y: -40 },
            { x: 80, y: 0 }
        );
        quadBezier.transform.x = 200;
        quadBezier.transform.y = 450;
        quadBezier.strokeStyle = '#06b6d4';
        quadBezier.strokeWidth = 4;
        shapes.push(quadBezier);

        // 6. Кубическая кривая Безье (розовая)
        const cubicBezier = new CubicBezier(
            { x: -100, y: 0 },
            { x: -40, y: -30 },
            { x: 40, y: 30 },
            { x: 100, y: 0 }
        );
        cubicBezier.transform.x = 500;
        cubicBezier.transform.y = 520;
        cubicBezier.strokeStyle = '#ec4899';
        cubicBezier.strokeWidth = 4;
        shapes.push(cubicBezier);

        // 7. PathBezier (желтый) - РЕЖИМ МЕНЯЕТСЯ ЧЕРЕЗ PATH_MODE
        // Для режима 'bezier' нужно количество точек = 3n+1 (4, 7, 10, 13...)
        // 7 точек = 2 сегмента Безье (без дублирования средней точки)
        const pathPoints = PATH_MODE === 'bezier'
            ? [  // 7 точек для bezier (2 полных сегмента)
                { x: -120, y: 20 },  // P0 - начало сегмента 1
                { x: -80, y: -30 },  // P1 - управляющая 1
                { x: -40, y: -10 },  // P2 - управляющая 2
                { x: 0, y: 10 },     // P3 - конец сегмента 1 / начало сегмента 2
                { x: 40, y: 30 },    // P1 - управляющая 1 (для сегмента 2)
                { x: 80, y: 20 },    // P2 - управляющая 2 (для сегмента 2)
                { x: 120, y: -10 }   // P3 - конец сегмента 2
            ]
            : [  // 5 точек для polyline и catmull
                { x: -120, y: 20 },
                { x: -60, y: -30 },
                { x: 0, y: 10 },
                { x: 60, y: 40 },
                { x: 120, y: -10 }
            ];

        const path = new PathBezier(
            pathPoints,
            PATH_MODE,
            false  // замкнутый? (false - открытый)
        );
        path.transform.x = 700;
        path.transform.y = 300;
        path.strokeStyle = '#fbbf24';
        path.strokeWidth = 4;
        shapes.push(path);

        shapesRef.current = shapes;
    }, []);

    const getControlPointsWorld = useCallback((shape: Shape): { point: Point2D; index: number }[] => {
        if ('getControlPoints' in shape) {
            const points = (shape as any).getControlPoints() as Point2D[];
            return points.map((pt, idx) => ({
                point: shape.transformPointToDevice(pt.x, pt.y),
                index: idx
            }));
        }
        return [];
    }, []);

    const hitTestControlPoint = useCallback((shape: Shape, mouseX: number, mouseY: number, threshold: number = 12): { index: number } | null => {
        if (!('getControlPoints' in shape)) return null;

        const points = (shape as any).getControlPoints() as Point2D[];
        for (let i = 0; i < points.length; i++) {
            const worldPt = shape.transformPointToDevice(points[i].x, points[i].y);
            const dx = worldPt.x - mouseX;
            const dy = worldPt.y - mouseY;
            if (Math.hypot(dx, dy) <= threshold) {
                return { index: i };
            }
        }
        return null;
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const renderer = rendererRef.current;
        if (!canvas || !renderer) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = renderer.width / rect.width;
        const scaleY = renderer.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        if (selectedId) {
            const selectedShape = shapesRef.current.find(s => s.id === selectedId);
            if (selectedShape && 'getControlPoints' in selectedShape) {
                const hit = hitTestControlPoint(selectedShape, mouseX, mouseY);
                if (hit) {
                    draggingRef.current = {
                        active: true,
                        shapeId: selectedId,
                        pointIndex: hit.index
                    };
                    e.preventDefault();
                    return;
                }
            }
        }

        let hitId: string | null = null;
        for (let i = shapesRef.current.length - 1; i >= 0; i--) {
            if (shapesRef.current[i].hitTest(mouseX, mouseY)) {
                hitId = shapesRef.current[i].id;
                break;
            }
        }

        setSelectedId(hitId);
        setDebug(`Клик: (${Math.round(mouseX)}, ${Math.round(mouseY)}) | Выбрано: ${hitId?.slice(0, 8) || 'нет'}`);
    }, [selectedId, hitTestControlPoint]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggingRef.current.active) return;

        const canvas = canvasRef.current;
        const renderer = rendererRef.current;
        if (!canvas || !renderer) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = renderer.width / rect.width;
        const scaleY = renderer.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const shape = shapesRef.current.find(s => s.id === draggingRef.current.shapeId);
        if (shape && 'setControlPoint' in shape) {
            const localPt = shape.transformPointToLocal(mouseX, mouseY);
            if (localPt) {
                (shape as any).setControlPoint(draggingRef.current.pointIndex, localPt);
                setDebug(`Перетаскивание: точка ${draggingRef.current.pointIndex} | (${Math.round(mouseX)}, ${Math.round(mouseY)})`);
            }
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        if (draggingRef.current.active) {
            draggingRef.current = { active: false, shapeId: null, pointIndex: -1 };
            setDebug(prev => prev.replace('Перетаскивание', 'Завершено'));
        }
    }, []);

    useEffect(() => {
        const renderer = rendererRef.current;
        if (renderer) renderer.setLineAlgorithm(lineAlg);
    }, [lineAlg]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;

        const doResize = () => {
            renderer.resize();
            setDebug(`w=${renderer.width}, h=${renderer.height}`);
        };

        doResize();
        setTimeout(doResize, 100);
        setTimeout(doResize, 500);

        const ro = new ResizeObserver(() => doResize());
        ro.observe(container);

        let animationId: number;

        const frame = () => {
            const r = rendererRef.current;
            if (r && r.width > 0 && r.height > 0) {
                r.beginFrame(true);

                for (const shape of shapesRef.current) {
                    shape.drawRaster(r);
                }

                if (selectedId) {
                    const selectedShape = shapesRef.current.find(s => s.id === selectedId);
                    if (selectedShape) {
                        const bounds = selectedShape.getBounds();
                        const selectionColor: RGBA = { r: 255, g: 215, b: 0, a: 255 };
                        const padding = 8;
                        r.strokePolygon([
                            { x: bounds.minX - padding, y: bounds.minY - padding },
                            { x: bounds.maxX + padding, y: bounds.minY - padding },
                            { x: bounds.maxX + padding, y: bounds.maxY + padding },
                            { x: bounds.minX - padding, y: bounds.maxY + padding },
                        ], selectionColor, 3);
                    }
                }

                if (selectedId) {
                    const selectedShape = shapesRef.current.find(s => s.id === selectedId);
                    if (selectedShape && ('getControlPoints' in selectedShape)) {
                        const controlPoints = getControlPointsWorld(selectedShape);
                        const controlPointColor: RGBA = { r: 255, g: 100, b: 100, a: 255 };
                        const controlPointDraggingColor: RGBA = { r: 255, g: 200, b: 0, a: 255 };

                        for (let i = 0; i < controlPoints.length; i++) {
                            const pt = controlPoints[i].point;
                            const isDragging = draggingRef.current.active &&
                                draggingRef.current.shapeId === selectedId &&
                                draggingRef.current.pointIndex === i;
                            const color = isDragging ? controlPointDraggingColor : controlPointColor;

                            for (let dy = -6; dy <= 6; dy++) {
                                for (let dx = -6; dx <= 6; dx++) {
                                    if (dx * dx + dy * dy <= 25) {
                                        const px = pt.x + dx;
                                        const py = pt.y + dy;
                                        if (px >= 0 && px < r.width && py >= 0 && py < r.height) {
                                            r.setPixel(px, py, color);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            r?.commit();
            animationId = requestAnimationFrame(frame);
        };

        frame();

        return () => {
            cancelAnimationFrame(animationId);
            ro.disconnect();
            renderer.dispose();
        };
    }, [lineAlg, selectedId, getControlPointsWorld]);

    const getModeName = () => {
        switch (PATH_MODE) {
            case 'polyline': return 'Ломаная (polyline) - 5 точек';
            case 'bezier': return 'Безье (bezier) - 7 точек (2 сегмента)';
            case 'catmull': return 'Сплайн (catmull) - 5 точек';
            default: return PATH_MODE;
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: '#1a1a2e'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: draggingRef.current.active ? 'grabbing' : 'pointer'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
            <div style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#a5f3c3',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                borderRadius: '6px',
                zIndex: 100,
                pointerEvents: 'none',
                border: '1px solid #334155'
            }}>
                {debug} | {lineAlg === 'wu' ? 'Сглаженные (Ву)' : 'Чёткие (Брезенхем)'} | PathBezier: {getModeName()}
                {draggingRef.current.active && ' | 🔴 Перетаскивание'}
            </div>
        </div>
    );
};