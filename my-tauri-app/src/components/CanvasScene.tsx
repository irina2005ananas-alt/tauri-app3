// src/components/CanvasScene.tsx
import { useEffect, useRef, useState } from 'react';
import { RasterRenderer, type LineAlg, type RGBA } from '../lib/raster/RasterRenderer';

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

export const CanvasScene = ({ lineAlg }: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [debug, setDebug] = useState('');

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

        const ro = new ResizeObserver(() => {
            doResize();
        });
        ro.observe(container);

        let animationId: number;

        const drawPolyline = (r: RasterRenderer, points: { x: number; y: number }[], color: RGBA, width: number) => {
            if (points.length < 2) return;
            for (let i = 0; i < points.length - 1; i++) {
                r.strokeLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color, width);
            }
        };

        const frame = () => {
            const r = rendererRef.current;
            if (r && r.width > 0 && r.height > 0) {
                r.beginFrame(true);

                const w = r.width;
                const h = r.height;
                const cx = w / 2;
                const cy = h / 2;

                const red: RGBA = { r: 255, g: 0, b: 0, a: 255 };
                const semiRed: RGBA = { r: 255, g: 0, b: 0, a: 128 };
                const white: RGBA = { r: 255, g: 255, b: 255, a: 255 };
                const blue: RGBA = { r: 0, g: 0, b: 255, a: 255 };
                const solidBlue: RGBA = { r: 0, g: 0, b: 255, a: 255 };
                const orange: RGBA = { r: 255, g: 128, b: 0, a: 255 };
                const purple: RGBA = { r: 128, g: 0, b: 128, a: 255 };
                const yellow: RGBA = { r: 255, g: 255, b: 0, a: 255 };
                const cyan: RGBA = { r: 0, g: 255, b: 255, a: 255 };

                const radius = 80;

                // 1. Красный круг с белой обводкой
                for (let y = -radius; y <= radius; y++) {
                    for (let x = -radius; x <= radius; x++) {
                        if (x * x + y * y <= radius * radius) {
                            const px = cx + x;
                            const py = cy + y;
                            if (px >= 0 && px < w && py >= 0 && py < h) {
                                r.setPixel(px, py, red);
                            }
                        }
                    }
                }
                r.strokeCircle(cx, cy, radius, white, 5);

                //  2. Тест прозрачности через blendPixel
                const squareSize = 100;
                const squareX = cx - 200;
                const squareY = cy - 50;

                // Синий квадрат
                for (let y = 0; y < squareSize; y++) {
                    for (let x = 0; x < squareSize; x++) {
                        const px = squareX + x;
                        const py = squareY + y;
                        if (px >= 0 && px < w && py >= 0 && py < h) {
                            r.setPixel(px, py, solidBlue);
                        }
                    }
                }

                // Полупрозрачный красный круг через blendPixel
                const testRadius = 40;
                const testCx = squareX + squareSize - 20;
                const testCy = squareY + squareSize / 2;

                for (let y = -testRadius; y <= testRadius; y++) {
                    for (let x = -testRadius; x <= testRadius; x++) {
                        if (x * x + y * y <= testRadius * testRadius) {
                            const px = testCx + x;
                            const py = testCy + y;
                            if (px >= 0 && px < w && py >= 0 && py < h) {
                                r.blendPixel(px, py, semiRed, 1);
                            }
                        }
                    }
                }

                //  3. Синий треугольник
                const triangle = [
                    { x: cx - 150, y: cy + 100 },
                    { x: cx - 50, y: cy + 200 },
                    { x: cx - 250, y: cy + 200 },
                ];
                r.fillPolygon(triangle, blue);
                r.strokePolygon(triangle, white, 2);

                //  4. Ломаные линии
                const orangePolyline = [
                    { x: cx + 50, y: cy + 100 },
                    { x: cx + 120, y: cy + 130 },
                    { x: cx + 180, y: cy + 100 },
                    { x: cx + 220, y: cy + 150 },
                    { x: cx + 280, y: cy + 120 },
                ];
                drawPolyline(r, orangePolyline, orange, 10);

                const cyanPolyline = [
                    { x: cx + 50, y: cy + 150 },
                    { x: cx + 120, y: cy + 180 },
                    { x: cx + 180, y: cy + 150 },
                    { x: cx + 220, y: cy + 200 },
                    { x: cx + 280, y: cy + 170 },
                ];
                drawPolyline(r, cyanPolyline, cyan, 15);

                //  5. Пятиугольник
                const pentagonRadius = 50;
                const pentagonCenterX = cx + 180;
                const pentagonCenterY = cy - 100;
                const pentagon: { x: number; y: number }[] = [];
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 72 * Math.PI / 180);
                    pentagon.push({
                        x: pentagonCenterX + Math.cos(angle) * pentagonRadius,
                        y: pentagonCenterY + Math.sin(angle) * pentagonRadius,
                    });
                }
                r.fillPolygon(pentagon, purple);
                r.strokePolygon(pentagon, yellow, 2);
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
    }, [lineAlg]);

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
                    display: 'block'
                }}
            />
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'lime',
                padding: '4px 8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                zIndex: 100,
                pointerEvents: 'none'
            }}>
                {debug} | {lineAlg === 'wu' ? 'Сглаженные (Ву)' : 'Чёткие (Брезенхем)'}
            </div>
        </div>
    );
};