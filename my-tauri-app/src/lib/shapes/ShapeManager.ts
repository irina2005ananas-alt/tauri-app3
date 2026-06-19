import { Shape } from './Shape';
import { ShapeFactory } from './ShapeFactory';

export class ShapeManager {
    private shapes: Shape[] = [];
    private selectedIds = new Set<string>();

    add(shape: Shape): void {
        this.shapes.push(shape);
    }

    remove(id: string): void {
        this.shapes = this.shapes.filter(s => s.id !== id);
        this.selectedIds.delete(id);
    }

    getShapes(): Shape[] {
        return [...this.shapes];
    }

    getShape(id: string): Shape | undefined {
        return this.shapes.find(s => s.id === id);
    }

    select(id: string, multi = false): void {
        if (!multi) this.selectedIds.clear();
        this.selectedIds.add(id);
    }

    clearSelection(): void {
        this.selectedIds.clear();
    }

    getSelected(): Shape[] {
        return this.shapes.filter(s => this.selectedIds.has(s.id));
    }

    getSelectedId(): string | null {
        return this.selectedIds.size === 1 ? [...this.selectedIds][0] : null;
    }

    // ========== СЛОИ ==========

    moveUp(id: string): void {
        const index = this.shapes.findIndex(s => s.id === id);
        if (index === -1 || index === this.shapes.length - 1) return;
        [this.shapes[index], this.shapes[index + 1]] = [this.shapes[index + 1], this.shapes[index]];
    }

    moveDown(id: string): void {
        const index = this.shapes.findIndex(s => s.id === id);
        if (index === -1 || index === 0) return;
        [this.shapes[index], this.shapes[index - 1]] = [this.shapes[index - 1], this.shapes[index]];
    }

    moveToFront(id: string): void {
        const idx = this.shapes.findIndex(s => s.id === id);
        if (idx === -1) return;
        const [shape] = this.shapes.splice(idx, 1);
        this.shapes.push(shape);
    }

    moveToBack(id: string): void {
        const idx = this.shapes.findIndex(s => s.id === id);
        if (idx === -1) return;
        const [shape] = this.shapes.splice(idx, 1);
        this.shapes.unshift(shape);
    }

    // ========== JSON ==========

    toJSON(): any[] {
        return this.shapes.map(s => s.toJSON());
    }

    loadFromJSON(data: any[]): void {
        this.shapes = data.map(item => ShapeFactory.fromJSON(item));
        this.selectedIds.clear();
    }
}