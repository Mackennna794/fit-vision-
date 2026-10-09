/**
 * Production-Grade Skeletal Rigging & Garment Deformations Engine
 * 
 * Implements precise mathematical garment root normalization, neck anchoring,
 * NDC unprojected coordinate mapping, proportional scaling, and roll/pitch/yaw alignment.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KeyLandmarkSet } from "./PoseTracker";

export interface GarmentCalibration {
  scaleMultiplier: number; // User manual scale adjustment (default: 1.0)
  offsetY: number;          // Vertical shift adjustment (default: 0.0)
  offsetZ: number;          // Depth shift adjustment (default: 0.0)
  chestWidthMultiplier: number;
}

export interface GarmentBones {
  root?: THREE.Object3D;
  spineLower?: THREE.Object3D;
  spineUpper?: THREE.Object3D;
  neck?: THREE.Object3D;
  shoulderL?: THREE.Object3D;
  upperArmL?: THREE.Object3D;
  forearmL?: THREE.Object3D;
  shoulderR?: THREE.Object3D;
  upperArmR?: THREE.Object3D;
  forearmR?: THREE.Object3D;
}

export class GarmentFitter {
  public sceneGroup: THREE.Group;
  public shirtPivot: THREE.Group | null = null;
  public garmentMesh: THREE.Object3D | null = null;
  public bones: GarmentBones = {};
  public modelSize: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  
  private loader = new GLTFLoader();
  private calibration: GarmentCalibration = {
    scaleMultiplier: 1.0,
    offsetY: 0.0,
    offsetZ: 0.0,
    chestWidthMultiplier: 1.0,
  };

  // Internal smooth transforms
  private currentPos = new THREE.Vector3();
  private targetPos = new THREE.Vector3();
  private currentScale = new THREE.Vector3(1, 1, 1);
  private targetScale = new THREE.Vector3(1, 1, 1);
  private currentQuat = new THREE.Quaternion();
  private targetQuat = new THREE.Quaternion();

  private isProcedural = false;
  private proceduralPlaneGeo: THREE.PlaneGeometry | null = null;

  constructor() {
    this.sceneGroup = new THREE.Group();
    this.sceneGroup.name = "AR_3D_Garment_Group";
    this.sceneGroup.renderOrder = 1; // Render after depth occluder (renderOrder = 0)
  }

  /**
   * Configure physical fabric material properties (MeshStandardMaterial / MeshPhysicalMaterial)
   */
  public applyFabricMaterial(mesh: THREE.Object3D, texture?: THREE.Texture): void {
    mesh.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const m = node as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        m.renderOrder = 1;

        const fabricMat = new THREE.MeshPhysicalMaterial({
          map: texture || (m.material as THREE.MeshStandardMaterial)?.map || null,
          color: (m.material as THREE.MeshStandardMaterial)?.color || new THREE.Color("#2563EB"),
          roughness: 0.8,         // Micro-roughness for woven cotton/denim weave
          metalness: 0.0,         // Zero metalness for natural fabric
          clearcoat: 0.15,        // Subtle fabric sheen
          clearcoatRoughness: 0.4,
          side: THREE.DoubleSide,
          depthWrite: true,
          depthTest: true,
        });

        m.material = fabricMat;
      }
    });
  }

  /**
   * Load 3D Garment from GLTF/GLB file, normalize origin to neck/collar center, and wrap in shirtPivot
   */
  public async loadGLTF(url: string, textureUrl?: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.loader.load(
        url,
        (gltf) => {
          this.clearCurrentGarment();
          const model = gltf.scene;
          this.garmentMesh = model;
          this.isProcedural = false;

          // 1. Calculate Bounding Box and Dimensions
          const bbox = new THREE.Box3().setFromObject(model);
          const size = bbox.getSize(new THREE.Vector3());
          const center = bbox.getCenter(new THREE.Vector3());

          // Re-center model so its origin (0, 0, 0) is precisely at NECK/COLLAR center (bbox.max.y)
          model.position.sub(new THREE.Vector3(center.x, bbox.max.y, center.z));
          this.modelSize.copy(size.x > 0 ? size : new THREE.Vector3(1, 1, 1));

          // Wrap shirt inside a parent pivot
          this.shirtPivot = new THREE.Group();
          this.shirtPivot.name = "Shirt_Pivot_Group";
          this.shirtPivot.add(model);

          // Map bones in armature
          this.findBones(model);

          // Apply fabric material
          if (textureUrl) {
            new THREE.TextureLoader().load(textureUrl, (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              this.applyFabricMaterial(model, tex);
            });
          } else {
            this.applyFabricMaterial(model);
          }

          this.sceneGroup.add(this.shirtPivot);
          resolve(true);
        },
        undefined,
        (err) => {
          console.warn("[GarmentFitter] GLTF load failed, building procedural 3D garment:", err);
          this.createProceduralGarment(textureUrl);
          resolve(false);
        }
      );
    });
  }

  /**
   * Automatically search GLTF hierarchy for standardized armature bone names
   */
  private findBones(rootNode: THREE.Object3D): void {
    this.bones = {};
    rootNode.traverse((child) => {
      const name = child.name.toLowerCase();
      if (name.includes("root") || name.includes("pelvis")) this.bones.root = child;
      else if (name.includes("spine_lower") || name.includes("spine01")) this.bones.spineLower = child;
      else if (name.includes("spine_upper") || name.includes("spine02")) this.bones.spineUpper = child;
      else if (name.includes("neck") || name.includes("collar")) this.bones.neck = child;
      else if (name.includes("shoulder_l") || name.includes("clavicle_l")) this.bones.shoulderL = child;
      else if (name.includes("upper_arm_l") || name.includes("arm_l")) this.bones.upperArmL = child;
      else if (name.includes("forearm_l")) this.bones.forearmL = child;
      else if (name.includes("shoulder_r") || name.includes("clavicle_r")) this.bones.shoulderR = child;
      else if (name.includes("upper_arm_r") || name.includes("arm_r")) this.bones.upperArmR = child;
      else if (name.includes("forearm_r")) this.bones.forearmR = child;
    });
  }

  /**
   * Build high-fidelity 3D procedural garment geometry centered at neck/collar
   */
  public createProceduralGarment(textureUrl?: string): void {
    this.clearCurrentGarment();
    this.isProcedural = true;

    const torsoGeo = new THREE.PlaneGeometry(1.0, 1.2, 15, 15);
    this.proceduralPlaneGeo = torsoGeo;

    const group = new THREE.Group();
    group.name = "Procedural_3D_Shirt";

    const torsoMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#2563EB"),
      roughness: 0.8,
      metalness: 0.0,
      clearcoat: 0.15,
      side: THREE.DoubleSide,
    });

    if (textureUrl) {
      new THREE.TextureLoader().load(textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        torsoMat.map = tex;
        torsoMat.needsUpdate = true;
      });
    }

    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoMesh.renderOrder = 1;

    // Add procedural sleeve geometries
    const sleeveGeoL = new THREE.CylinderGeometry(0.18, 0.16, 0.45, 16);
    sleeveGeoL.rotateZ(-Math.PI / 3);
    sleeveGeoL.translate(-0.35, 0.35, 0);

    const sleeveGeoR = new THREE.CylinderGeometry(0.18, 0.16, 0.45, 16);
    sleeveGeoR.rotateZ(Math.PI / 3);
    sleeveGeoR.translate(0.35, 0.35, 0);

    const sleeveMeshL = new THREE.Mesh(sleeveGeoL, torsoMat);
    const sleeveMeshR = new THREE.Mesh(sleeveGeoR, torsoMat);
    sleeveMeshL.renderOrder = 1;
    sleeveMeshR.renderOrder = 1;

    group.add(torsoMesh, sleeveMeshL, sleeveMeshR);

    // Calculate bbox and center origin at neck/collar
    const bbox = new THREE.Box3().setFromObject(group);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());

    group.position.sub(new THREE.Vector3(center.x, bbox.max.y, center.z));
    this.modelSize.copy(size.x > 0 ? size : new THREE.Vector3(1, 1.2, 0.5));

    this.garmentMesh = group;

    // Wrap in parent shirtPivot
    this.shirtPivot = new THREE.Group();
    this.shirtPivot.name = "Shirt_Pivot_Group";
    this.shirtPivot.add(group);

    this.sceneGroup.add(this.shirtPivot);
  }

  /**
   * Main Real-Time Fitting Solver: Anchors shirtPivot to Mid-Shoulder, scales proportionally, and aligns torso
   */
  public updateFitting(
    keyLandmarks: KeyLandmarkSet,
    landmarksToWorld: (lm: { x: number; y: number; z: number }) => THREE.Vector3,
    visibilityOpacity: number
  ): void {
    if (!this.shirtPivot || visibilityOpacity <= 0.01) {
      if (this.shirtPivot) this.shirtPivot.visible = false;
      this.sceneGroup.visible = false;
      return;
    }

    // Check shoulder tracking confidence threshold (Landmarks 11 & 12 visibility < 0.65)
    const visL = keyLandmarks.leftShoulder.visibility ?? 1;
    const visR = keyLandmarks.rightShoulder.visibility ?? 1;

    if (visL < 0.65 || visR < 0.65) {
      this.shirtPivot.visible = false;
      this.sceneGroup.visible = false;
      return;
    }

    this.shirtPivot.visible = true;
    this.sceneGroup.visible = true;

    // 1. Convert Shoulder and Hip landmarks to Three.js World Coordinates
    const posShoulderL = landmarksToWorld(keyLandmarks.leftShoulder);
    const posShoulderR = landmarksToWorld(keyLandmarks.rightShoulder);
    const posMidHip = landmarksToWorld(keyLandmarks.midHip);

    // 2. Anchor to Torso Midpoint (Mid-Shoulder)
    const midShoulder = new THREE.Vector3().addVectors(posShoulderL, posShoulderR).multiplyScalar(0.5);

    this.targetPos.copy(midShoulder);
    this.targetPos.y += this.calibration.offsetY;
    this.targetPos.z += this.calibration.offsetZ;

    this.currentPos.lerp(this.targetPos, 0.35);
    this.shirtPivot.position.copy(this.currentPos);

    // 3. Real-World Proportional Scale
    const shoulderDist = posShoulderL.distanceTo(posShoulderR);
    const modelWidth = this.modelSize.x || 1.0;

    // Uniform target scale based on shoulder distance: targetScale = (shoulderDist / size.x) * multipliers
    const targetScaleVal = (shoulderDist / modelWidth) * this.calibration.chestWidthMultiplier * this.calibration.scaleMultiplier;
    this.targetScale.set(targetScaleVal, targetScaleVal, targetScaleVal);

    this.currentScale.lerp(this.targetScale, 0.35);
    this.shirtPivot.scale.copy(this.currentScale);

    // 4. Torso Alignment & Rotation (Roll Z-axis + Yaw & Pitch)
    const angleZ = Math.atan2(posShoulderR.y - posShoulderL.y, posShoulderR.x - posShoulderL.x);

    // Direction vectors for full 3D orientation
    const shoulderDir = new THREE.Vector3().subVectors(posShoulderR, posShoulderL).normalize();
    const spineDir = new THREE.Vector3().subVectors(posMidHip, midShoulder).normalize();
    const chestNormal = new THREE.Vector3().crossVectors(shoulderDir, spineDir).normalize();

    const rotMatrix = new THREE.Matrix4();
    rotMatrix.makeBasis(shoulderDir, spineDir.clone().negate(), chestNormal);
    this.targetQuat.setFromRotationMatrix(rotMatrix);

    this.currentQuat.slerp(this.targetQuat, 0.35);
    this.shirtPivot.quaternion.copy(this.currentQuat);

    // 5. Arm & Sleeve Bone Tracking (if GLTF model has armature bones)
    if (this.bones.upperArmL) {
      const le = landmarksToWorld(keyLandmarks.leftElbow);
      const armLDir = new THREE.Vector3().subVectors(le, posShoulderL).normalize();
      this.bones.upperArmL.quaternion.setFromUnitVectors(new THREE.Vector3(-1, 0, 0), armLDir);
    }
    if (this.bones.upperArmR) {
      const re = landmarksToWorld(keyLandmarks.rightElbow);
      const armRDir = new THREE.Vector3().subVectors(re, posShoulderR).normalize();
      this.bones.upperArmR.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), armRDir);
    }

    // 6. Handle opacity fade
    this.sceneGroup.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mat = (node as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
        if (mat) {
          mat.transparent = true;
          mat.opacity = visibilityOpacity;
        }
      }
    });
  }

  public setCalibration(calibration: Partial<GarmentCalibration>): void {
    this.calibration = { ...this.calibration, ...calibration };
  }

  private clearCurrentGarment(): void {
    if (this.shirtPivot) {
      this.sceneGroup.remove(this.shirtPivot);
      this.shirtPivot = null;
    }
    if (this.garmentMesh) {
      this.garmentMesh = null;
    }
    if (this.proceduralPlaneGeo) {
      this.proceduralPlaneGeo.dispose();
      this.proceduralPlaneGeo = null;
    }
    this.bones = {};
  }

  public destroy(): void {
    this.clearCurrentGarment();
    this.sceneGroup.clear();
  }
}
