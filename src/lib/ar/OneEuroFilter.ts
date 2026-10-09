/**
 * 1-Euro Adaptive Low-Pass Filter
 * 
 * Provides jitter-free signal filtering with zero latency during fast motions.
 * Automatically adjusts cutoff frequency based on derivative (velocity).
 * 
 * Paper: Casiez et al., "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
 */

import * as THREE from "three";

export interface OneEuroParams {
  minCutoff?: number; // Min cutoff frequency (Hz) for stationary state (default: 1.0)
  beta?: number;      // Speed coefficient to eliminate latency during fast moves (default: 0.007)
  dCutoff?: number;   // Cutoff frequency for derivative calculation (default: 1.0)
}

class LowPassFilter {
  private alpha: number = 1.0;
  private s: number | null = null;

  public filter(x: number, alpha: number): number {
    this.alpha = alpha;
    if (this.s === null) {
      this.s = x;
    } else {
      this.s = alpha * x + (1.0 - alpha) * this.s;
    }
    return this.s;
  }

  public lastValue(): number | null {
    return this.s;
  }

  public reset(): void {
    this.s = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(params?: OneEuroParams) {
    this.minCutoff = params?.minCutoff ?? 1.0;
    this.beta = params?.beta ?? 0.007;
    this.dCutoff = params?.dCutoff ?? 1.0;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  public filter(x: number, timestamp: number): number {
    if (this.lastTime === null || timestamp === this.lastTime) {
      this.lastTime = timestamp;
      return this.xFilter.filter(x, 1.0);
    }

    // dt in seconds
    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 1e-5);
    this.lastTime = timestamp;

    // Estimate derivative
    const prevX = this.xFilter.lastValue() ?? x;
    const dx = (x - prevX) / dt;

    // Filter derivative
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));

    // Calculate adaptive cutoff
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    // Filter signal
    return this.xFilter.filter(x, this.alpha(cutoff, dt));
  }

  public reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/**
 * 3D Vector 1-Euro Filter for (x, y, z) coordinates
 */
export class OneEuroFilter3D {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;
  private zFilter: OneEuroFilter;

  constructor(params?: OneEuroParams) {
    this.xFilter = new OneEuroFilter(params);
    this.yFilter = new OneEuroFilter(params);
    this.zFilter = new OneEuroFilter(params);
  }

  public filter(vec: { x: number; y: number; z: number }, timestamp: number): { x: number; y: number; z: number } {
    return {
      x: this.xFilter.filter(vec.x, timestamp),
      y: this.yFilter.filter(vec.y, timestamp),
      z: this.zFilter.filter(vec.z, timestamp),
    };
  }

  public filterVector3(vec: THREE.Vector3, timestamp: number, target = new THREE.Vector3()): THREE.Vector3 {
    target.set(
      this.xFilter.filter(vec.x, timestamp),
      this.yFilter.filter(vec.y, timestamp),
      this.zFilter.filter(vec.z, timestamp)
    );
    return target;
  }

  public reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
  }
}

/**
 * Quaternion 1-Euro Filter with Slerp interpolation to prevent orientation gimbal lock or jitter
 */
export class OneEuroFilterQuaternion {
  private qCurrent = new THREE.Quaternion();
  private qTarget = new THREE.Quaternion();
  private filter3D: OneEuroFilter3D;
  private initialized = false;

  constructor(params?: OneEuroParams) {
    this.filter3D = new OneEuroFilter3D(params);
  }

  public filter(qInput: THREE.Quaternion, timestamp: number, target = new THREE.Quaternion()): THREE.Quaternion {
    if (!this.initialized) {
      this.qCurrent.copy(qInput);
      this.initialized = true;
      target.copy(qInput);
      return target;
    }

    // Convert quaternion imaginary part to 3D representation for smooth 1-euro velocity evaluation
    // Ensuring shortest path w alignment
    const qIn = qInput.clone();
    if (this.qCurrent.dot(qIn) < 0) {
      qIn.x = -qIn.x;
      qIn.y = -qIn.y;
      qIn.z = -qIn.z;
      qIn.w = -qIn.w;
    }

    const filtered = this.filter3D.filter({ x: qIn.x, y: qIn.y, z: qIn.z }, timestamp);
    // Reconstruct W from unit quaternion property
    const w2 = 1.0 - (filtered.x * filtered.x + filtered.y * filtered.y + filtered.z * filtered.z);
    const w = Math.sqrt(Math.max(0, w2)) * (qIn.w < 0 ? -1 : 1);

    this.qTarget.set(filtered.x, filtered.y, filtered.z, w).normalize();
    this.qCurrent.slerp(this.qTarget, 0.45); // Smooth slerp towards filtered target
    target.copy(this.qCurrent);
    return target;
  }

  public reset(): void {
    this.filter3D.reset();
    this.initialized = false;
  }
}
