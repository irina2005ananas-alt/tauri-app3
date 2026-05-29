import { useEffect, useRef, useState } from 'react';
import { RasterRenderer, type LineAlg, type RGBA } from '../lib/raster/RasterRenderer';
import { Rect } from '../lib/shapes/Rect';
import { Line } from '../lib/shapes/Line';
import { Oval } from '../lib/shapes/Oval';
import type { Shape } from '../lib/shapes/Shape';

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export const CanvasScene = ({ lineAlg }: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const shapesRef = useRef<Shape[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [debug, setDebug] = useState('');

    // Инициализация фигур
    useEffect(() => {
        // Прямоугольник синий (полупрозрачный)
        const rect = new Rect(120, 80);
        rect.transform.x = 300;
        rect.transform.y = 200;
        rect.fillStyle = '#3b82f6';
        rect.fillOpacity = 0.6;
        rect.strokeStyle = '#ffffff';
        rect.strokeWidth = 3;

        // Линия оранжевая (повернутая)
        const line = new Line(-60, 0, 60, 0);
        line.transform.x = 550;
        line.transform.y = 250;
        line.transform.rotation = Math.PI / 4;
        line.strokeStyle = '#ff8800';
        line.strokeWidth = 8;
        line.strokeOpacity = 1;

        // Овал зеленый
        const oval = new Oval(70, 45);
        oval.transform.x = 450;
        oval.transform.y = 400;
        oval.transform.scaleX = 1.2;
        oval.transform.scaleY = 0.8;
        oval.fillStyle = '#10b981';
        oval.fillOpacity = 0.5;
        oval.strokeStyle = '#ffffff';
        oval.strokeWidth = 2;

        // Прямоугольник красный
        const rect2 = new Rect(100, 100);
        rect2.transform.x = 150;
        rect2.transform.y = 450;
        rect2.fillStyle = '#ef4444';
        rect2.fillOpacity = 0.5;
        rect2.strokeStyle = '#ffffff';
        rect2.strokeWidth = 2;

        shapesRef.current = [rect, line, oval, rect2];
    }, []);

    // Обработка клика по холсту
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const renderer = rendererRef.current;
        if (!canvas || !renderer) return;

        // Получаем размеры и масштаб
        const rect = canvas.getBoundingClientRect();
        const scaleX = renderer.width / rect.width;
        const scaleY = renderer.height / rect.height;

        // Координаты мыши в физических пикселях
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        console.log('Click at:', { mouseX, mouseY, rendererSize: { w: renderer.width, h: renderer.height } });

        // Проверяем попадание в фигуры
        let hitId: string | null = null;
        for (let i = shapesRef.current.length - 1; i >= 0; i--) {
            const shape = shapesRef.current[i];
            const hit = shape.hitTest(mouseX, mouseY);
            console.log(`Shape ${shape.id.slice(0,8)} hit: ${hit}`);
            if (hit) {
                hitId = shape.id;
                break;
            }
        }

        setSelectedId(hitId);
        setDebug(`Клик: (${Math.round(mouseX)}, ${Math.round(mouseY)}) | Выбрано: ${hitId?.slice(0, 8) || 'нет'}`);
    };

    // Обновление алгоритма линий у рендерера
    useEffect(() => {
        const renderer = rendererRef.current;
        if (renderer) {
            renderer.setLineAlgorithm(lineAlg);
        }
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
            setDebug(prev => {
                const info = `w=${renderer.width}, h=${renderer.height}`;
                return prev.includes(info) ? prev : info;
            });
        };

        doResize();

        // Несколько resize для надежности
        setTimeout(doResize, 100);
        setTimeout(doResize, 500);

        const ro = new ResizeObserver(() => {
            doResize();
        });
        ro.observe(container);

        let animationId: number;

        const frame = () => {
            const r = rendererRef.current;
            if (r && r.width > 0 && r.height > 0) {
                r.beginFrame(true);

                // Рисуем все фигуры
                for (const shape of shapesRef.current) {
                    shape.drawRaster(r);
                }

                // Рисуем рамку вокруг выбранной фигуры
                if (selectedId) {
                    const selectedShape = shapesRef.current.find(s => s.id === selectedId);
                    if (selectedShape) {
                        const bounds = selectedShape.getBounds();
                        const selectionColor: RGBA = { r: 255, g: 215, b: 0, a: 255 };
                        const padding = 8;
                        // Рисуем пунктирную рамку
                        r.strokePolygon([
                            { x: bounds.minX - padding, y: bounds.minY - padding },
                            { x: bounds.maxX + padding, y: bounds.minY - padding },
                            { x: bounds.maxX + padding, y: bounds.maxY + padding },
                            { x: bounds.minX - padding, y: bounds.maxY + padding },
                        ], selectionColor, 3);
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
    }, [lineAlg, selectedId]);

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
                    cursor: 'pointer'
                }}
                onClick={handleCanvasClick}
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
                {debug} | {lineAlg === 'wu' ? 'Сглаженные (Ву)' : 'Чёткие (Брезенхем)'}
            </div>
        </div>
    );
};