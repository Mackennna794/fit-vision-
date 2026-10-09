/**
 * High-Precision Real-Time 2D Deformable Garment Fitting Engine
 * 
 * Implements 6-Point Piecewise Affine Warping across a 2D Triangular Mesh.
 * Bends, stretches, and conforms garment PNG to human kinematics in real time
 * without 3D WebGL inversion bugs or rigid box artifacts.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface ControlPoints2D {
  neckCollar: Point2D;   // P0: Mid-Clavicle / Collar base
  leftShoulder: Point2D; // P1: Left Shoulder (11)
  rightShoulder: Point2D;// P2: Right Shoulder (12)
  leftElbow: Point2D;    // P3: Left Elbow (13)
  rightElbow: Point2D;   // P4: Right Elbow (14)
  leftHip: Point2D;      // P5: Left Hip (23)
  rightHip: Point2D;     // P6: Right Hip (24)
  midChest: Point2D;     // P7: Torso Midpoint / Centroid
}

export interface Triangle2D {
  src: [Point2D, Point2D, Point2D];
  dst: [Point2D, Point2D, Point2D];
}

export class DeformableGarmentEngine {
  private garmentImage: HTMLImageElement | null = null;
  private isLoaded = false;

  // Last confident control points for temporal extrapolation (<3 frame hold)
  private lastValidControlPoints: ControlPoints2D | null = null;
  private lostFrameCount = 0;

  constructor() {}

  /**
   * Load Garment Texture Image (PNG with transparency)
   */
  public async loadGarmentImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.garmentImage = img;
        this.isLoaded = true;
        resolve(true);
      };
      img.onerror = (err) => {
        console.warn("[DeformableGarmentEngine] Failed to load garment image:", err);
        this.isLoaded = false;
        resolve(false);
      };
      img.src = url;
    });
  }

  /**
   * Set custom HTMLImageElement directly
   */
  public setGarmentImageElement(img: HTMLImageElement): void {
    this.garmentImage = img;
    this.isLoaded = true;
  }

  /**
   * Calculate 6-Point Control Points from MediaPipe Pose Landmarks
   */
  public computeControlPoints(
    landmarks: { x: number; y: number; visibility?: number }[],
    canvasWidth: number,
    canvasHeight: number,
    isMirrored = true
  ): ControlPoints2D | null {
    if (!landmarks || landmarks.length < 25) return this.handleLostFrame();

    const ls = landmarks[11]; // Left Shoulder
    const rs = landmarks[12]; // Right Shoulder
    const le = landmarks[13] || ls; // Left Elbow
    const re = landmarks[14] || rs; // Right Elbow
    const lh = landmarks[23]; // Left Hip
    const rh = landmarks[24]; // Right Hip

    const visL = ls.visibility ?? 1;
    const visR = rs.visibility ?? 1;

    if (visL < 0.45 || visR < 0.45) {
      return this.handleLostFrame();
    }

    // Reset lost frame counter on confident detection
    this.lostFrameCount = 0;

    // Convert normalized [0, 1] to Canvas pixel coordinates (considering horizontal mirroring)
    const toCanvasPt = (lm: { x: number; y: number }): Point2D => {
      const px = isMirrored ? (1 - lm.x) * canvasWidth : lm.x * canvasWidth;
      const py = lm.y * canvasHeight;
      return { x: px, y: py };
    };

    const pLeftShoulder = toCanvasPt(ls);
    const pRightShoulder = toCanvasPt(rs);
    const pLeftElbow = toCanvasPt(le);
    const pRightElbow = toCanvasPt(re);
    const pLeftHip = toCanvasPt(lh);
    const pRightHip = toCanvasPt(rh);

    // Collarbone / Suprasternal notch: (11 + 12) / 2
    const midShoulder: Point2D = {
      x: (pLeftShoulder.x + pRightShoulder.x) / 2,
      y: (pLeftShoulder.y + pRightShoulder.y) / 2,
    };

    const midHip: Point2D = {
      x: (pLeftHip.x + pRightHip.x) / 2,
      y: (pLeftHip.y + pRightHip.y) / 2,
    };

    const torsoHeight = Math.hypot(midHip.x - midShoulder.x, midHip.y - midShoulder.y);

    // Collar Alignment: Pin neckline directly to mid-clavicle point with upward vertical offset (12-15% of torso height)
    const collarOffset = torsoHeight * 0.14;
    const neckCollar: Point2D = {
      x: midShoulder.x,
      y: midShoulder.y - collarOffset,
    };

    // Torso Mid-Chest / Centroid
    const midChest: Point2D = {
      x: (midShoulder.x + midHip.x) / 2,
      y: (midShoulder.y + midHip.y) / 2,
    };

    const currentPts: ControlPoints2D = {
      neckCollar,
      leftShoulder: pLeftShoulder,
      rightShoulder: pRightShoulder,
      leftElbow: pLeftElbow,
      rightElbow: pRightElbow,
      leftHip: pLeftHip,
      rightHip: pRightHip,
      midChest,
    };

    this.lastValidControlPoints = currentPts;
    return currentPts;
  }

  private handleLostFrame(): ControlPoints2D | null {
    this.lostFrameCount++;
    if (this.lostFrameCount <= 3 && this.lastValidControlPoints) {
      // Hold/extrapolate last valid control points for up to 3 frames
      return this.lastValidControlPoints;
    }
    this.lastValidControlPoints = null;
    return null;
  }

  /**
   * Solve 2D Affine Transformation Matrix (a, b, c, d, e, f) mapping source triangle to destination triangle
   */
  private drawAffineTriangle(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    src: [Point2D, Point2D, Point2D],
    dst: [Point2D, Point2D, Point2D]
  ): void {
    const [u0, u1, u2] = [src[0].x, src[1].x, src[2].x];
    const [v0, v1, v2] = [src[0].y, src[1].y, src[2].y];

    const [x0, x1, x2] = [dst[0].x, dst[1].x, dst[2].x];
    const [y0, y1, y2] = [dst[0].y, dst[1].y, dst[2].y];

    const delta = (u0 - u2) * (v1 - v2) - (u1 - u2) * (v0 - v2);
    if (Math.abs(delta) < 1e-5) return; // Degenerate triangle safeguard

    const a = ((x0 - x2) * (v1 - v2) - (x1 - x2) * (v0 - v2)) / delta;
    const b = ((y0 - y2) * (v1 - v2) - (y1 - y2) * (v0 - v2)) / delta;
    const c = ((x1 - x2) * (u0 - u2) - (x0 - x2) * (u1 - u2)) / delta;
    const d = ((y1 - y2) * (u0 - u2) - (y0 - y2) * (u1 - u2)) / delta;
    const e = x0 - a * u0 - c * v0;
    const f = y0 - b * u0 - d * v0;

    ctx.save();

    // Clip to target destination triangle path
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.clip();

    // Apply affine transform and render image slice
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);

    ctx.restore();
  }

  /**
   * Render 6-Point Piecewise Affine Warped Garment on Canvas
   */
  public renderDeformedGarment(
    ctx: CanvasRenderingContext2D,
    ctrlPts: ControlPoints2D,
    opacity = 1.0
  ): void {
    if (!this.garmentImage || !this.isLoaded) return;

    const w = this.garmentImage.width || 500;
    const h = this.garmentImage.height || 600;

    // Define standard texture UV points on garment image (pixels)
    const srcNeck: Point2D = { x: w * 0.5, y: h * 0.05 };
    const srcLShoulder: Point2D = { x: w * 0.18, y: h * 0.16 };
    const srcRShoulder: Point2D = { x: w * 0.82, y: h * 0.16 };
    const srcLElbow: Point2D = { x: w * 0.02, y: h * 0.42 };
    const srcRElbow: Point2D = { x: w * 0.98, y: h * 0.42 };
    const srcLHip: Point2D = { x: w * 0.22, y: h * 0.95 };
    const srcRHip: Point2D = { x: w * 0.78, y: h * 0.95 };
    const srcMidChest: Point2D = { x: w * 0.5, y: h * 0.5 };

    // Build 6 Triangles mapping texture UV -> Human Kinematic Control Points
    const triangles: Triangle2D[] = [
      // T1: Upper Left Chest
      {
        src: [srcNeck, srcLShoulder, srcMidChest],
        dst: [ctrlPts.neckCollar, ctrlPts.leftShoulder, ctrlPts.midChest],
      },
      // T2: Upper Right Chest
      {
        src: [srcNeck, srcRShoulder, srcMidChest],
        dst: [ctrlPts.neckCollar, ctrlPts.rightShoulder, ctrlPts.midChest],
      },
      // T3: Lower Left Torso
      {
        src: [srcLShoulder, srcLHip, srcMidChest],
        dst: [ctrlPts.leftShoulder, ctrlPts.leftHip, ctrlPts.midChest],
      },
      // T4: Lower Right Torso
      {
        src: [srcRShoulder, srcRHip, srcMidChest],
        dst: [ctrlPts.rightShoulder, ctrlPts.rightHip, ctrlPts.midChest],
      },
      // T5: Left Sleeve & Flank
      {
        src: [srcLShoulder, srcLElbow, srcLHip],
        dst: [ctrlPts.leftShoulder, ctrlPts.leftElbow, ctrlPts.leftHip],
      },
      // T6: Right Sleeve & Flank
      {
        src: [srcRShoulder, srcRElbow, srcRHip],
        dst: [ctrlPts.rightShoulder, ctrlPts.rightElbow, ctrlPts.rightHip],
      },
    ];

    ctx.save();
    ctx.globalAlpha = opacity;

    // Render each piecewise affine transformed triangle
    for (const tri of triangles) {
      this.drawAffineTriangle(ctx, this.garmentImage, tri.src, tri.dst);
    }

    ctx.restore();
  }
}
