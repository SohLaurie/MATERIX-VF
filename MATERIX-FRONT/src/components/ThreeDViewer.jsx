import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function Model({ gltf }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.005; // slow spin
  });
  return gltf ? <primitive object={gltf.scene} ref={ref} /> : null;
}

export default function ThreeDViewer() {
  const [gltf, setGltf] = useState(null);

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;

      const loader = new GLTFLoader();
      loader.parse(contents, "", (loadedGltf) => {
        setGltf(loadedGltf);
      });
    };

    reader.readAsArrayBuffer(file); // for binary .glb/.gltf
  };

  return (
    <div style={{ width: "100%", height: "100vh", background: "#222" }}>
      <input
        type="file"
        accept=".gltf,.glb"
        onChange={handleFile}
        style={{ position: "absolute", zIndex: 1 }}
      />
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} />
        {gltf && <Model gltf={gltf} />}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
