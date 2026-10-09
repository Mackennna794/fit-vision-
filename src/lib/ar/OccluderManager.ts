/**
 * Real-Time Depth Occlusion System (Preventing Garment Clipping)
 * 
 * Generates invisible capsule geometries for user's arms, forearms, and torso.
 * Configured with `colorWrite = false` and `depthWrite = true` on renderOrder = 0.
 * Writes depth to the WebGL depth buffer prior to garment rendering (renderOrder = 1),
 * naturally occluding the digital shirt whenever user's real arms pass in front of torso.
 */

import * as THREE from "three";
import { KeyLandmarkSet } from "./PoseTracker";

export class OccluderManager {
  public group: THREE.Group;

  private leftUpperArmCapsule: THREE.Mesh;
  private rightUpperArmCapsule: THREE.Mesh;
  private leftForearmCapsule: THREE.Mesh;
  private rightForearmCapsule: THREE.Mesh;
  private depthMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = "AR_Depth_Occluder_Group";

    // Occluder depth-only material: invisible in color buffer, writes to depth buffer
    this.depthMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      side: THREE.DoubleSide,
    });

    // Create 4 procedural arm capsule colliders
    this.leftUpperArmCapsule = this.createCapsuleMesh();
    this.rightUpperArmCapsule = this.createCapsuleMesh();
    this.leftForearmCapsule = this.createCapsuleMesh();
    this.rightForearmCapsule = this.createCapsuleMesh();

    this.group.add(
      this.leftUpperArmCapsule,
      this.rightUpperArmCapsule,
      this.leftForearmCapsule,
      this.rightForearmCapsule
    );

    // Set renderOrder = 0 (Garment rendered at renderOrder = 1)
    this.group.renderOrder = 0;
  }

  private createCapsuleMesh(): THREE.Mesh {
    // Standard cylinder as capsule surrogate: radius 0.045m (~9cm arm thickness)
    const geometry = new THREE.CylinderGeometry(0.045, 0.045, 1, 16);
    geometry.translate(0, 0.5, 0); // Move origin to top joint
    const mesh = new THREE.Mesh(geometry, this.depthMaterial);
    mesh.renderOrder = 0;
    mesh.frustumCulled = false;
    return mesh;
  }

  /**
   * Align and scale a capsule cylinder between two 3D points
   */
  private updateSegment(
    mesh: THREE.Mesh,
    start: THREE.Vector3,
    end: THREE.Vector3,
    thicknessRadius: number = 0.045
  ): void {
    const dir = new THREE.Vector3().subVectors(end, start);
    const length = dir.length();

    if (length < 1e-4) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    mesh.position.copy(start);

    // Orient cylinder (default aligned along +Y) to match dir vector
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    mesh.quaternion.copy(quat);

    // Scale Y to match segment length, X & Z for arm thickness
    mesh.scale.set(thicknessRadius * 2, length, thicknessRadius * 2);
  }

  /**
   * Update all occluder capsules from PoseTracker landmark data in 3D scene space
   */
  public updateFromLandmarks(
    keyLandmarks: KeyLandmarkSet,
    landmarksToWorld: (lm: { x: number; y: number; z: number }) => THREE.Vector3
  ): void {
    const ls = landmarksToWorld(keyLandmarks.leftShoulder);
    const rs = landmarksToWorld(keyLandmarks.rightShoulder);
    const le = landmarksToWorld(keyLandmarks.leftElbow);
    const re = landmarksToWorld(keyLandmarks.rightElbow);
    const lw = landmarksToWorld(keyLandmarks.leftWrist);
    const rw = landmarksToWorld(keyLandmarks.rightWrist);

    // Position occluder capsules slightly in front of user's arms for tight occlusion threshold
    const armThickness = 0.05;

    this.updateSegment(this.leftUpperArmCapsule, ls, le, armThickness);
    this.updateSegment(this.rightUpperArmCapsule, rs, re, armThickness);
    this.updateSegment(this.leftForearmCapsule, le, lw, armThickness * 0.9);
    this.updateSegment(this.rightForearmCapsule, re, rw, armThickness * 0.9);
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  public destroy(): void {
    this.depthMaterial.dispose();
    this.group.clear();
  }
}
