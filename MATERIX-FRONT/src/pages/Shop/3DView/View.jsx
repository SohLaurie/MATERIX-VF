import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useLocation } from 'react-router-dom';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

function Model({ objPath, mtlPath }) {
  const materials = useLoader(MTLLoader, mtlPath);
  const obj = useLoader(OBJLoader, objPath, (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  return <primitive object={obj} scale={0.01} />; // Adjust scale as needed
}

const View = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const obj = queryParams.get('obj');
  const mtl = queryParams.get('mtl');
  console.log('Obj %s and mtl %s found',obj,mtl);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f0f0f0' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={null}>
          {obj && mtl ? (
            <Model objPath={`${obj}`} mtlPath={`${mtl}`} />
          ) : (
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="hotpink" />
            </mesh>
          )}
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default View;