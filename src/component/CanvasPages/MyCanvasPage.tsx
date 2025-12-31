import React from 'react'
import { Canvas } from "@react-three/fiber";
import { RotatingBox } from '../RotatingBox/RotatingBox';

export default function MyCanvasPage() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <RotatingBox />
            </Canvas>
        </div>
    )
}
