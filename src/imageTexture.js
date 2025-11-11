import * as THREE from "three";

/**
 * Creates a simple image material that maps texture 1:1 to mesh
 * KHÔNG SỬA UV - để nguyên UV từ model, chỉ flip texture nếu cần
 */
function createImageMaterial(textureUrl, meshAspect = 1 / 1, geometry) {
  // Log UV để debug (không sửa gì cả)
  if (geometry && geometry.attributes.uv) {
    const uvs = geometry.attributes.uv.array;
    console.log("📊 Current UV mapping:", {
      count: uvs.length / 2,
      sample: Array.from(uvs.slice(0, Math.min(12, uvs.length))),
    });
  }

  const ImageMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(textureUrl, function (texture) {
    // Clamp to prevent any repeat - ảnh không bị lặp lại
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // Filter để ảnh sắc nét hơn và giảm blur
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16; // Tăng anisotropy để giảm blur ở góc

    // Tính toán aspect ratio để căn giữa và tránh kéo giãn
    const imageAspect = texture.image.width / texture.image.height;

    // Kiểm tra xem aspect ratio có khớp không
    const aspectDiff = Math.abs(imageAspect - meshAspect);

    // Nếu aspect khớp hoàn hảo (sai số < 1%), không scale
    // Nếu không khớp, scale nhẹ để fit
    let scale = 1.0;
    if (aspectDiff > 0.01) {
      // Có sai số → scale nhẹ để tránh blur
      scale = 0.98;
      console.warn("⚠️ Aspect mismatch detected, applying scale:", scale);
    }

    texture.repeat.set(scale, scale);

    // Căn giữa texture
    texture.offset.set(
      (1 - scale) / 2, // Căn giữa theo X
      (1 - scale) / 2 // Căn giữa theo Y
    );

    texture.center.set(0.5, 0.5); // Pivot ở giữa
    texture.rotation = 0; // Không xoay

    // Đảm bảo texture được encode đúng
    texture.colorSpace = THREE.SRGBColorSpace;

    ImageMaterial.map = texture;
    ImageMaterial.needsUpdate = true;

    console.log("✅ Texture loaded:", {
      size: `${texture.image.width}x${texture.image.height}`,
      imageAspect: imageAspect.toFixed(3),
      meshAspect: meshAspect.toFixed(3),
      scale: scale,
      offset: `(${((1 - scale) / 2).toFixed(3)}, ${((1 - scale) / 2).toFixed(
        3
      )})`,
      match:
        Math.abs(imageAspect - meshAspect) < 0.01 ? "✓ Perfect" : "⚠ Mismatch",
    });
  });

  return ImageMaterial;
}

export default createImageMaterial;
