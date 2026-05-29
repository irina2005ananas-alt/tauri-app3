// src/lib/raster/RasterRenderer.ts

export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = 'bresenham' | 'wu';

export function clampByte(v: number): number {
    return Math.min(255, Math.max(0, Math.round(v)));
}

export function hexToRGBA(hex: string, alpha = 255): RGBA {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(c => c + c).join('');
    }
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return { r, g, b, a: clampByte(alpha) };
}

export class RasterRenderer {
    private ctx: CanvasRenderingContext2D;
    private imageData: ImageData | null = null;
    private buf!: Uint8ClampedArray;

    width = 0;
    height = 0;
    dpr = 1;

    private canvas: HTMLCanvasElement;
    private _onWindowResize: () => void;
    private lineAlg: LineAlg = 'bresenham';

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No 2D context');
        }
        this.ctx = ctx;
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
        this.resize();
    }

    dispose() {
        window.removeEventListener('resize', this._onWindowResize);
    }

    setLineAlgorithm(a: LineAlg) {
        this.lineAlg = a;
    }

    getLineAlgorithm(): LineAlg {
        return this.lineAlg;
    }

    drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        if (this.lineAlg === 'wu') {
            this.drawLineWu(x0, y0, x1, y1, color);
        } else {
            this.drawLineBrassenham(x0, y0, x1, y1, color);
        }
    }

    private idx(x: number, y: number): number {
        return (Math.floor(y) * this.width + Math.floor(x)) * 4;
    }

    setPixel(x: number, y: number, color: RGBA) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return;
        const i = this.idx(ix, iy);
        this.buf[i] = clampByte(color.r);
        this.buf[i + 1] = clampByte(color.g);
        this.buf[i + 2] = clampByte(color.b);
        this.buf[i + 3] = clampByte(color.a);
    }

    public blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return;

        const i = this.idx(ix, iy);

        const srcA = (color.a / 255) * alphaFactor;
        const srcR = (color.r / 255) * srcA;
        const srcG = (color.g / 255) * srcA;
        const srcB = (color.b / 255) * srcA;

        const dstR = this.buf[i] / 255;
        const dstG = this.buf[i + 1] / 255;
        const dstB = this.buf[i + 2] / 255;
        const dstA = this.buf[i + 3] / 255;

        const outA = srcA + dstA * (1 - srcA);

        if (outA < 0.001) {
            this.buf[i] = 0;
            this.buf[i + 1] = 0;
            this.buf[i + 2] = 0;
            this.buf[i + 3] = 0;
            return;
        }

        const outR = (srcR + dstR * (1 - srcA)) / outA;
        const outG = (srcG + dstG * (1 - srcA)) / outA;
        const outB = (srcB + dstB * (1 - srcA)) / outA;

        this.buf[i] = clampByte(outR * 255);
        this.buf[i + 1] = clampByte(outG * 255);
        this.buf[i + 2] = clampByte(outB * 255);
        this.buf[i + 3] = clampByte(outA * 255);
    }

    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        // this.dpr = window.devicePixelRatio || 1;
        this.dpr = window.devicePixelRatio || 1;

        this.width = Math.floor(rect.width * this.dpr);
        this.height = Math.floor(rect.height * this.dpr);

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        this.imageData = new ImageData(this.width, this.height);
        this.buf = this.imageData.data;
    }

    beginFrame(clear = true) {
        if (clear && this.buf) {
            for (let i = 0; i < this.buf.length; i++) {
                this.buf[i] = 0;
            }
        }
    }

    commit() {
        if (this.imageData) {
            this.ctx.putImageData(this.imageData, 0, 0);
        }
    }

    drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let x = x0, y = y0;
        while (true) {
            this.setPixel(x, y, color);
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
        }
    }

    drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
        const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        let ax0 = x0, ay0 = y0, ax1 = x1, ay1 = y1;
        if (steep) { [ax0, ay0] = [ay0, ax0]; [ax1, ay1] = [ay1, ax1]; }
        if (ax0 > ax1) { [ax0, ax1] = [ax1, ax0]; [ay0, ay1] = [ay1, ay0]; }
        const dx = ax1 - ax0;
        const dy = ay1 - ay0;
        const gradient = dx === 0 ? 1 : dy / dx;
        const drawPixel = (x: number, y: number, intensity: number) => {
            const blendedColor = { ...color, a: Math.floor(color.a * intensity) };
            if (steep) this.blendPixel(y, x, blendedColor);
            else this.blendPixel(x, y, blendedColor);
        };
        let xend = Math.round(ax0);
        let yend = ay0 + gradient * (xend - ax0);
        const xgap = 1 - (ax0 + 0.5 - Math.floor(ax0));
        const xpxl1 = xend;
        const ypxl1 = Math.floor(yend);
        drawPixel(xpxl1, ypxl1, (1 - (yend - ypxl1)) * xgap);
        drawPixel(xpxl1, ypxl1 + 1, (yend - ypxl1) * xgap);
        let intery = yend + gradient;
        xend = Math.round(ax1);
        yend = ay1 + gradient * (xend - ax1);
        const xgap2 = (ax1 + 0.5 - Math.floor(ax1));
        const xpxl2 = xend;
        const ypxl2 = Math.floor(yend);
        drawPixel(xpxl2, ypxl2, (1 - (yend - ypxl2)) * xgap2);
        drawPixel(xpxl2, ypxl2 + 1, (yend - ypxl2) * xgap2);
        for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
            drawPixel(x, Math.floor(intery), 1 - (intery - Math.floor(intery)));
            drawPixel(x, Math.floor(intery) + 1, intery - Math.floor(intery));
            intery += gradient;
        }
    }

    private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
        const yInt = Math.floor(y);
        if (yInt < 0 || yInt >= this.height) return;
        const start = Math.floor(Math.min(x0, x1));
        const end = Math.floor(Math.max(x0, x1));
        for (let x = start; x <= end; x++) {
            if (x >= 0 && x < this.width) {
                this.setPixel(x, yInt, color);
            }
        }
    }

    fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
        const r = Math.abs(radius);
        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                if (x * x + y * y <= r * r) {
                    const px = Math.floor(cx + x);
                    const py = Math.floor(cy + y);
                    if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                        this.setPixel(px, py, color);
                    }
                }
            }
        }
    }

    fillPolygon(points: { x: number; y: number }[], color: RGBA) {
        if (points.length < 3) return;
        let minY = Math.min(...points.map(p => p.y));
        let maxY = Math.max(...points.map(p => p.y));
        for (let y = minY; y <= maxY; y++) {
            const intersections: number[] = [];
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                    const x = p1.x + (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y);
                    intersections.push(x);
                }
            }
            intersections.sort((a, b) => a - b);
            for (let i = 0; i < intersections.length; i += 2) {
                if (i + 1 < intersections.length) {
                    this.drawHSpan(y, intersections[i], intersections[i + 1], color);
                }
            }
        }
    }

    strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1) {
        if (width <= 1) {
            this.drawLine(x0, y0, x1, y1, color);
            return;
        }
        const half = width / 2;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) {
            this.fillCircle(x0, y0, half, color);
            return;
        }
        const nx = -dy / len;
        const ny = dx / len;
        const p1 = { x: x0 + nx * half, y: y0 + ny * half };
        const p2 = { x: x0 - nx * half, y: y0 - ny * half };
        const p3 = { x: x1 - nx * half, y: y1 - ny * half };
        const p4 = { x: x1 + nx * half, y: y1 + ny * half };
        this.fillPolygon([p1, p2, p3, p4], color);
        this.fillCircle(x0, y0, half, color);
        this.fillCircle(x1, y1, half, color);
    }

    strokeCircle(cx: number, cy: number, radius: number, color: RGBA, width = 1) {
        const segments = Math.max(48, Math.floor(radius * 2));
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI / segments);
            points.push({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
            });
        }
        this.strokePolygon(points, color, width);
    }

    strokePolygon(points: { x: number; y: number }[], color: RGBA, width = 1) {
        if (points.length < 2) return;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            this.strokeLine(p1.x, p1.y, p2.x, p2.y, color, width);
        }
    }
}