// src/lib/shapes/Transform.ts
export class Transform {
    x: number = 0;
    y: number = 0;
    rotation: number = 0;  // в радианах
    scaleX: number = 1;
    scaleY: number = 1;

    constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
    }

    clone(): Transform {
        return new Transform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);
    }
}