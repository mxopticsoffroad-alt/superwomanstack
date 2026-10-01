/**
 * Explicit named re-exports so the bundler can tree-shake three.js down to what we actually use.
 * (A bare `import('three')` pulls the whole library.)
 */
export {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Object3D, Mesh, Points, Sprite,
  PlaneGeometry, BufferGeometry, BufferAttribute, Float32BufferAttribute,
  MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, PointsMaterial, SpriteMaterial,
  CanvasTexture, Texture, Color, Vector3, Box3, DirectionalLight, AmbientLight, HemisphereLight,
  PMREMGenerator, NoToneMapping, SRGBColorSpace, DoubleSide, FrontSide,
  NormalBlending, AdditiveBlending, LinearMipmapLinearFilter, LinearFilter, MathUtils,
} from 'three';
