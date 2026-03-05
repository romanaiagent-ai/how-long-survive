/**
 * On-screen virtual joystick for mobile touch input.
 * Renders a fixed base + movable thumb in the bottom-left quadrant.
 * Exposes dx/dy (-1 to 1) and isActive.
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base!: Phaser.GameObjects.Arc;
  private thumb!: Phaser.GameObjects.Arc;
  private baseX = 0;
  private baseY = 0;
  private readonly RADIUS = 56;
  private readonly THUMB_RADIUS = 26;
  private pointerId: number | null = null;

  dx = 0;
  dy = 0;
  isActive = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    this.bindEvents();
  }

  private build(): void {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;

    this.baseX = this.RADIUS + 24;
    this.baseY = h - this.RADIUS - 24;

    // Base ring
    this.base = this.scene.add.arc(this.baseX, this.baseY, this.RADIUS)
      .setFillStyle(0x000000, 0.35)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setScrollFactor(0)
      .setDepth(200)
      .setInteractive();

    // Thumb
    this.thumb = this.scene.add.arc(this.baseX, this.baseY, this.THUMB_RADIUS)
      .setFillStyle(0xffffff, 0.5)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setScrollFactor(0)
      .setDepth(201);
  }

  private bindEvents(): void {
    const input = this.scene.input;

    input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // Only capture left-half of screen for joystick
      if (p.x > this.scene.cameras.main.width * 0.5) return;
      if (this.pointerId !== null) return;
      this.pointerId = p.id;
      this.isActive = true;
      this.baseX = p.x;
      this.baseY = p.y;
      this.base.setPosition(p.x, p.y);
      this.thumb.setPosition(p.x, p.y);
    });

    input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.pointerId) return;
      const ddx = p.x - this.baseX;
      const ddy = p.y - this.baseY;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      const clamped = Math.min(dist, this.RADIUS);
      const angle = Math.atan2(ddy, ddx);
      const tx = this.baseX + Math.cos(angle) * clamped;
      const ty = this.baseY + Math.sin(angle) * clamped;
      this.thumb.setPosition(tx, ty);
      this.dx = Math.cos(angle) * (clamped / this.RADIUS);
      this.dy = Math.sin(angle) * (clamped / this.RADIUS);
    });

    input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.pointerId) return;
      this.pointerId = null;
      this.isActive = false;
      this.dx = 0;
      this.dy = 0;
      // Reset to default position
      const h = this.scene.cameras.main.height;
      this.baseX = this.RADIUS + 24;
      this.baseY = h - this.RADIUS - 24;
      this.base.setPosition(this.baseX, this.baseY);
      this.thumb.setPosition(this.baseX, this.baseY);
    });
  }

  resize(w: number, h: number): void {
    if (this.pointerId !== null) return; // don't reposition while dragging
    this.baseX = this.RADIUS + 24;
    this.baseY = h - this.RADIUS - 24;
    this.base.setPosition(this.baseX, this.baseY);
    this.thumb.setPosition(this.baseX, this.baseY);
  }

  destroy(): void {
    this.base.destroy();
    this.thumb.destroy();
  }
}
