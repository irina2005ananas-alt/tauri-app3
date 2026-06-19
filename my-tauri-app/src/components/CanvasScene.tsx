import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { RasterRenderer, LineAlg, type RGBA } from "../lib/raster/RasterRenderer";
import { RendererAdapter } from "../lib/shapes/RendererAdapter";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { Rect, Line, Oval, Triangle, QuadraticBezier, CubicBezier, PathBezier } from "../lib/shapes";
import type { Point, Bounds } from "../lib/shapes/types";
import type { Shape } from "../lib/shapes/Shape";
import { mat3, type Mat3 } from "../lib/math/mat3";

interface CanvasSceneProps {
    lineAlg: LineAlg;
    onShapesChange?: (shapes: Shape[]) => void;
    onSelectedIdChange?: (id: string | null) => void;
    externalSelectedId?: string | null;
}

type EditorMode = "idle" | "move" | "resize" | "rotate" | "editPoints";
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null;

const HANDLE_SIZE = 8;
const MIN_SIZE = 10;

// ==================== УТИЛИТЫ ====================

function getDeviceCoordinates(clientX: number, clientY: number, canvas: HTMLCanvasElement): Point {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
        x: (clientX - rect.left) * dpr,
        y: (clientY - rect.top) * dpr,
    };
}

function getShapeBoundsCorners(shape: Shape): Point[] {
    const local = shape.getLocalBounds();
    const corners: Point[] = [
        { x: local.minX, y: local.minY },
        { x: local.maxX, y: local.minY },
        { x: local.maxX, y: local.maxY },
        { x: local.minX, y: local.maxY },
    ];
    return corners.map(p => shape.transformPointToDevice(p.x, p.y));
}

function getHandleAtPoint(shape: Shape, px: number, py: number): ResizeHandle | null {
    const corners = getShapeBoundsCorners(shape);
    const handles: [ResizeHandle, Point][] = [
        ["nw", corners[0]],
        ["n", { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 }],
        ["ne", corners[1]],
        ["e", { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2 }],
        ["se", corners[2]],
        ["s", { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2 }],
        ["sw", corners[3]],
        ["w", { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2 }],
    ];

    for (const [handle, pos] of handles) {
        if (Math.hypot(px - pos.x, py - pos.y) <= HANDLE_SIZE) return handle;
    }

    return null;
}

function getPointIndexAtPosition(shape: Shape, px: number, py: number): number | null {
    if (!("getControlPoints" in shape)) return null;
    const pts = (shape as any).getControlPoints() as Point[];
    for (let i = 0; i < pts.length; i++) {
        const d = shape.transformPointToDevice(pts[i].x, pts[i].y);
        if (Math.hypot(px - d.x, py - d.y) <= HANDLE_SIZE + 2) return i;
    }
    return null;
}

function getResizeAnchor(bounds: Bounds, handle: ResizeHandle): Point {
    switch (handle) {
        case "nw": return { x: bounds.maxX, y: bounds.maxY };
        case "n": return { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY };
        case "ne": return { x: bounds.minX, y: bounds.maxY };
        case "e": return { x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 };
        case "se": return { x: bounds.minX, y: bounds.minY };
        case "s": return { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY };
        case "sw": return { x: bounds.maxX, y: bounds.minY };
        case "w": return { x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 };
        default: return { x: bounds.minX, y: bounds.minY };
    }
}

function solveTranslationKeepingAnchor(
    shape: Shape,
    anchorLocal: Point,
    anchorDevice: Point,
    scaleX: number,
    scaleY: number
): Point {
    const r = shape.transform.rotation;
    const cos = Math.cos(r);
    const sin = Math.sin(r);

    const sx = anchorLocal.x * scaleX;
    const sy = anchorLocal.y * scaleY;

    const rotatedX = cos * sx - sin * sy;
    const rotatedY = sin * sx + cos * sy;

    return {
        x: anchorDevice.x - rotatedX,
        y: anchorDevice.y - rotatedY,
    };
}

// ==================== КОМПОНЕНТ ====================

const CanvasScene = ({
                         lineAlg,
                         onShapesChange,
                         onSelectedIdChange,
                         externalSelectedId
                     }: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<RasterRenderer | null>(null);
    const adapterRef = useRef<RendererAdapter | null>(null);

    const [manager] = useState(() => new ShapeManager());
    const [selectedId, setSelectedId] = useState<string | null>(externalSelectedId || null);
    const initializedRef = useRef(false);

    const [mode, setMode] = useState<EditorMode>("idle");
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);

    const startPointRef = useRef<Point | null>(null);
    const startDataRef = useRef<{
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
        width?: number;
        height?: number;
        startLocalBounds?: Bounds;
        startInvMatrix?: Mat3;
        lineEndIndex?: number;
    } | null>(null);
    const editPointIndexRef = useRef<number | null>(null);
    const rotateCenterRef = useRef<Point | null>(null);

    // ==================== СИНХРОНИЗАЦИЯ ====================

    const syncShapes = useCallback(() => {
        const shapes = manager.getShapes();
        if (onShapesChange) onShapesChange(shapes);
    }, [manager, onShapesChange]);

    useEffect(() => {
        if (externalSelectedId !== undefined) {
            setSelectedId(externalSelectedId);
        }
    }, [externalSelectedId]);

    useEffect(() => {
        if (onSelectedIdChange) {
            onSelectedIdChange(selectedId);
        }
    }, [selectedId, onSelectedIdChange]);

    // ==================== ПУБЛИЧНОЕ API ====================

    useEffect(() => {
        (window as any).__canvasScene = {
            addShape: (shape: Shape) => {
                manager.add(shape);
                syncShapes();
            },
            selectShape: (id: string) => {
                manager.clearSelection();
                manager.select(id);
                setSelectedId(id);
                if (onSelectedIdChange) onSelectedIdChange(id);
            },
            getShapes: () => manager.getShapes(),
            getSelectedId: () => selectedId,
            getManager: () => manager, // 🔑 ДЛЯ СЛОЁВ
        };
    }, [manager, syncShapes, onSelectedIdChange, selectedId]);

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const rect = new Rect(
            "rect1",
            { x: 300, y: 200, rotation: 0.3, scaleX: 1, scaleY: 1 },
            120, 80
        );
        rect.fillColor = { r: 59, g: 130, b: 246, a: 200 };
        rect.strokeColor = { r: 255, g: 255, b: 255, a: 255 };
        rect.strokeWidth = 2;
        manager.add(rect);

        const oval = new Oval(
            "oval1",
            { x: 250, y: 350, rotation: 0, scaleX: 1, scaleY: 1 },
            70, 50
        );
        oval.fillColor = { r: 16, g: 185, b: 129, a: 180 };
        oval.strokeColor = { r: 255, g: 255, b: 255, a: 255 };
        oval.strokeWidth = 2;
        manager.add(oval);

        const line = new Line(
            "line1",
            { x: 550, y: 200, rotation: 0.2, scaleX: 1, scaleY: 1 },
            0, 0, 120, -40
        );
        line.strokeColor = { r: 255, g: 136, b: 0, a: 255 };
        line.strokeWidth = 6;
        manager.add(line);

        const triangle = new Triangle(
            "triangle1",
            { x: 550, y: 400, rotation: 0.4, scaleX: 1, scaleY: 1 },
            { x: -50, y: 30 },
            { x: 50, y: 30 },
            { x: 0, y: -40 }
        );
        triangle.fillColor = { r: 168, g: 85, b: 247, a: 200 };
        triangle.strokeColor = { r: 255, g: 255, b: 255, a: 255 };
        triangle.strokeWidth = 2;
        manager.add(triangle);

        const quadBezier = new QuadraticBezier(
            "quadBezier1",
            { x: 100, y: 500, rotation: 0, scaleX: 1, scaleY: 1 },
            { x: -80, y: 0 },
            { x: 0, y: -50 },
            { x: 80, y: 0 }
        );
        quadBezier.strokeColor = { r: 6, g: 182, b: 212, a: 255 };
        quadBezier.strokeWidth = 3;
        manager.add(quadBezier);

        const cubicBezier = new CubicBezier(
            "cubicBezier1",
            { x: 350, y: 550, rotation: 0.1, scaleX: 1, scaleY: 1 },
            { x: -100, y: 0 },
            { x: -40, y: -50 },
            { x: 40, y: 50 },
            { x: 100, y: 0 }
        );
        cubicBezier.strokeColor = { r: 236, g: 72, b: 153, a: 255 };
        cubicBezier.strokeWidth = 3;
        manager.add(cubicBezier);

        const pathPoints = [
            { x: -120, y: 20 },
            { x: -60, y: -40 },
            { x: 0, y: 100 },
            { x: 60, y: -30 },
            { x: 120, y: 10 }
        ];
        const path = new PathBezier(
            "path1",
            { x: 700, y: 400, rotation: 0, scaleX: 1, scaleY: 1 },
            pathPoints,
            'catmull',
            true
        );
        path.strokeColor = { r: 251, g: 191, b: 36, a: 255 };
        path.strokeWidth = 3;
        manager.add(path);

        syncShapes();
    }, []);

    // ==================== GETTERS ====================

    const getSelectedShape = useCallback(() => {
        return manager.getShape(selectedId || '') || null;
    }, [selectedId]);

    // ==================== ОБРАБОТЧИКИ ====================

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const point = getDeviceCoordinates(e.clientX, e.clientY, canvas);
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);

        const selectedShape = getSelectedShape();

        if (selectedShape) {
            // ===== ПОВОРОТ ЧЕРЕЗ CTRL + КЛИК =====
            if (e.ctrlKey && selectedShape.hitTest(point.x, point.y)) {
                setMode("rotate");
                startPointRef.current = point;
                startDataRef.current = {
                    x: selectedShape.transform.x,
                    y: selectedShape.transform.y,
                    scaleX: selectedShape.transform.scaleX,
                    scaleY: selectedShape.transform.scaleY,
                    rotation: selectedShape.transform.rotation
                };
                rotateCenterRef.current = {
                    x: selectedShape.transform.x,
                    y: selectedShape.transform.y,
                };
                return;
            }

            const handle = getHandleAtPoint(selectedShape, point.x, point.y);

            // ===== RESIZE =====
            if (handle) {
                setMode("resize");
                setResizeHandle(handle);
                startPointRef.current = point;
                const localBounds = selectedShape.getLocalBounds();
                const invMatrix = selectedShape.getDeviceToLocalMatrix();
                startDataRef.current = {
                    x: selectedShape.transform.x,
                    y: selectedShape.transform.y,
                    scaleX: selectedShape.transform.scaleX,
                    scaleY: selectedShape.transform.scaleY,
                    rotation: selectedShape.transform.rotation,
                    width: localBounds.maxX - localBounds.minX,
                    height: localBounds.maxY - localBounds.minY,
                    startLocalBounds: { ...localBounds },
                    startInvMatrix: invMatrix ?? undefined,
                };
                return;
            }

            // ===== КОНТРОЛЬНЫЕ ТОЧКИ =====
            const ptIndex = getPointIndexAtPosition(selectedShape, point.x, point.y);
            if (ptIndex !== null) {
                setMode("editPoints");
                editPointIndexRef.current = ptIndex;
                startPointRef.current = point;
                return;
            }

            // ===== ПЕРЕМЕЩЕНИЕ =====
            if (selectedShape.hitTest(point.x, point.y)) {
                setMode("move");
                startPointRef.current = point;
                startDataRef.current = {
                    x: selectedShape.transform.x,
                    y: selectedShape.transform.y,
                    scaleX: selectedShape.transform.scaleX,
                    scaleY: selectedShape.transform.scaleY,
                    rotation: selectedShape.transform.rotation,
                };
                return;
            }
        }

        // 🔑 Поиск другой фигуры
        const shapes = manager.getShapes();
        let hitShape: Shape | null = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].hitTest(point.x, point.y)) {
                hitShape = shapes[i];
                break;
            }
        }

        if (hitShape) {
            manager.clearSelection();
            manager.select(hitShape.id);
            setSelectedId(hitShape.id);
            if (onSelectedIdChange) onSelectedIdChange(hitShape.id);

            setMode("move");
            startPointRef.current = point;
            startDataRef.current = {
                x: hitShape.transform.x,
                y: hitShape.transform.y,
                scaleX: hitShape.transform.scaleX,
                scaleY: hitShape.transform.scaleY,
                rotation: hitShape.transform.rotation,
            };
            return;
        }

        // 🔑 Клик в пустое место
        manager.clearSelection();
        setSelectedId(null);
        if (onSelectedIdChange) onSelectedIdChange(null);
        setMode("idle");
        startPointRef.current = null;
        startDataRef.current = null;

    }, [manager, onSelectedIdChange, getSelectedShape]);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const point = getDeviceCoordinates(e.clientX, e.clientY, canvas);

        const selectedShape = getSelectedShape();
        if (!selectedShape) return;

        // ===== ПЕРЕМЕЩЕНИЕ =====
        if (mode === "move" && startPointRef.current && startDataRef.current) {
            const dx = point.x - startPointRef.current.x;
            const dy = point.y - startPointRef.current.y;
            selectedShape.transform.x = startDataRef.current.x + dx;
            selectedShape.transform.y = startDataRef.current.y + dy;
            syncShapes();
        }

        // ===== ИЗМЕНЕНИЕ РАЗМЕРА =====
        else if (mode === "resize" && startPointRef.current) {
            const sd = startDataRef.current;
            if (!sd) return;

            if (selectedShape instanceof Line && sd.lineEndIndex !== undefined) {
                const localPt = selectedShape.transformPointToLocal(point.x, point.y);
                if (!localPt) return;
                if (sd.lineEndIndex === 0) {
                    selectedShape.x1 = localPt.x;
                    selectedShape.y1 = localPt.y;
                } else {
                    selectedShape.x2 = localPt.x;
                    selectedShape.y2 = localPt.y;
                }
                syncShapes();
                return;
            }

            if (sd.width === undefined || sd.height === undefined || !sd.startLocalBounds || !sd.startInvMatrix) return;

            const oldW = sd.width;
            const oldH = sd.height;
            if (oldW <= 0 || oldH <= 0) return;

            const inv = sd.startInvMatrix;
            const localStart = mat3.transformPoint(inv, startPointRef.current.x, startPointRef.current.y);
            const localCurrent = mat3.transformPoint(inv, point.x, point.y);
            const dLocalX = localCurrent.x - localStart.x;
            const dLocalY = localCurrent.y - localStart.y;

            let newW = oldW;
            let newH = oldH;

            switch (resizeHandle) {
                case "nw": newW = oldW - dLocalX; newH = oldH - dLocalY; break;
                case "n":  newH = oldH - dLocalY; break;
                case "ne": newW = oldW + dLocalX; newH = oldH - dLocalY; break;
                case "e":  newW = oldW + dLocalX; break;
                case "se": newW = oldW + dLocalX; newH = oldH + dLocalY; break;
                case "s":  newH = oldH + dLocalY; break;
                case "sw": newW = oldW - dLocalX; newH = oldH + dLocalY; break;
                case "w":  newW = oldW - dLocalX; break;
                default: return;
            }

            if (Math.abs(newW) < MIN_SIZE) newW = Math.sign(newW) * MIN_SIZE;
            if (Math.abs(newH) < MIN_SIZE) newH = Math.sign(newH) * MIN_SIZE;

            const newScaleX = sd.scaleX * (newW / oldW);
            const newScaleY = sd.scaleY * (newH / oldH);

            const anchorLocal = getResizeAnchor(sd.startLocalBounds, resizeHandle);
            const anchorWorld = selectedShape.transformPointToDevice(anchorLocal.x, anchorLocal.y);

            const newTranslation = solveTranslationKeepingAnchor(
                selectedShape,
                anchorLocal,
                anchorWorld,
                newScaleX,
                newScaleY
            );

            selectedShape.transform.scaleX = newScaleX;
            selectedShape.transform.scaleY = newScaleY;
            selectedShape.transform.x = newTranslation.x;
            selectedShape.transform.y = newTranslation.y;

            syncShapes();
        }

        // ===== ПОВОРОТ =====
        else if (mode === "rotate" && startPointRef.current && startDataRef.current && rotateCenterRef.current) {
            const cx = rotateCenterRef.current.x;
            const cy = rotateCenterRef.current.y;

            const startAngle = Math.atan2(startPointRef.current.y - cy, startPointRef.current.x - cx);
            const currentAngle = Math.atan2(point.y - cy, point.x - cx);
            let delta = currentAngle - startAngle;

            const maxDelta = 0.15;
            if (delta > maxDelta) delta = maxDelta;
            if (delta < -maxDelta) delta = -maxDelta;

            const shape = selectedShape;
            if (!shape) return;

            const oldX = shape.transform.x;
            const oldY = shape.transform.y;
            const oldRotation = shape.transform.rotation;

            const newRotation = oldRotation + delta;

            const dx = oldX - cx;
            const dy = oldY - cy;
            const cos = Math.cos(delta);
            const sin = Math.sin(delta);
            const newDx = dx * cos - dy * sin;
            const newDy = dx * sin + dy * cos;

            shape.transform.x = cx + newDx;
            shape.transform.y = cy + newDy;
            shape.transform.rotation = newRotation;

            syncShapes();
        }

        // ===== РЕДАКТИРОВАНИЕ КОНТРОЛЬНЫХ ТОЧЕК =====
        else if (mode === "editPoints" && editPointIndexRef.current !== null && startPointRef.current) {
            const localPt = selectedShape.transformPointToLocal(point.x, point.y);
            if (localPt) {
                (selectedShape as any).setControlPoint(editPointIndexRef.current, localPt);
                syncShapes();
            }
        }
    }, [mode, resizeHandle, getSelectedShape, syncShapes]);

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
        setMode("idle");
        setResizeHandle(null);
        startPointRef.current = null;
        startDataRef.current = null;
        editPointIndexRef.current = null;
        rotateCenterRef.current = null;
    }, []);

    // ==================== КЛАВИАТУРА ====================

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedId) {
                    manager.remove(selectedId);
                    setSelectedId(null);
                    if (onSelectedIdChange) onSelectedIdChange(null);
                    syncShapes();
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [selectedId, manager, onSelectedIdChange, syncShapes]);

    // ==================== ОТРИСОВКА ВЫДЕЛЕНИЯ ====================

    const drawSelection = useCallback((r: RasterRenderer, shape: Shape) => {
        const corners = getShapeBoundsCorners(shape);
        if (corners.length < 4) return;

        const selectionColor: RGBA = { r: 0, g: 120, b: 220, a: 200 };
        r.strokePolygon(corners, selectionColor, 2, true);

        const handleColor: RGBA = { r: 255, g: 255, b: 255, a: 255 };
        const [nw, ne, se, sw] = corners;
        const n = { x: (nw.x + ne.x) / 2, y: (nw.y + ne.y) / 2 };
        const e = { x: (ne.x + se.x) / 2, y: (ne.y + se.y) / 2 };
        const s = { x: (se.x + sw.x) / 2, y: (se.y + sw.y) / 2 };
        const w = { x: (sw.x + nw.x) / 2, y: (sw.y + nw.y) / 2 };
        const handlePositions = [nw, n, ne, e, se, s, sw, w];

        for (const pos of handlePositions) {
            r.fillPolygon([
                { x: pos.x - HANDLE_SIZE / 2, y: pos.y - HANDLE_SIZE / 2 },
                { x: pos.x + HANDLE_SIZE / 2, y: pos.y - HANDLE_SIZE / 2 },
                { x: pos.x + HANDLE_SIZE / 2, y: pos.y + HANDLE_SIZE / 2 },
                { x: pos.x - HANDLE_SIZE / 2, y: pos.y + HANDLE_SIZE / 2 },
            ], handleColor);
        }

        // 🚫 ЗЕЛЕНАЯ РУЧКА ПОВОРОТА УБРАНА

        if ("getControlPoints" in shape) {
            const pts = (shape as any).getControlPoints() as Point[];
            const cpColor: RGBA = { r: 255, g: 255, b: 0, a: 255 };
            for (const p of pts) {
                const d = shape.transformPointToDevice(p.x, p.y);
                r.fillCircle(d.x, d.y, 5, cpColor);
            }
        }
    }, []);

    // ==================== РЕНДЕРИНГ ====================

    useEffect(() => {
        const renderer = rendererRef.current;
        if (renderer) renderer.setLineAlgorithm(lineAlg);
    }, [lineAlg]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;
        const adapter = new RendererAdapter(renderer);
        adapterRef.current = adapter;

        const resizeNow = (w: number, h: number) => renderer.resizeTo(w, h);
        const ro = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;
            requestAnimationFrame(() => resizeNow(entry.contentRect.width, entry.contentRect.height));
        });
        ro.observe(container);
        requestAnimationFrame(() => {
            const rect = container.getBoundingClientRect();
            resizeNow(rect.width, rect.height);
        });

        let raf = 0;
        const frame = () => {
            const r = rendererRef.current;
            const a = adapterRef.current;
            if (!r || !a) return;
            r.beginFrame(true);

            const shapes = manager.getShapes();
            for (const shape of shapes) {
                shape.draw(a);
            }

            const selectedShape = getSelectedShape();
            if (selectedShape) {
                drawSelection(r, selectedShape);
            }

            r.commit();
            raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.dispose();
        };
    }, [manager, lineAlg, selectedId, getSelectedShape, drawSelection]);

    // ==================== RENDER ====================

    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "none",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            />
        </div>
    );
};

export default CanvasScene;