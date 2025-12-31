"use client";

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
}

export function Cup3D() {
    const cupGroupRef = useRef<THREE.Group>(null);
    const [particles, setParticles] = useState<Particle[]>([]);
    const particlesRef = useRef<Particle[]>([]);

    // Create cup geometry using lathe
    const cupShape = () => {
        const points: THREE.Vector2[] = [];
        // Define cup profile
        points.push(new THREE.Vector2(0, 0));      // Bottom center
        points.push(new THREE.Vector2(0.8, 0));    // Bottom outer
        points.push(new THREE.Vector2(0.85, 0.1)); // Slight curve
        points.push(new THREE.Vector2(0.9, 0.5));  // Lower body
        points.push(new THREE.Vector2(1, 1.5));    // Upper body
        points.push(new THREE.Vector2(1.1, 2));    // Rim outer
        points.push(new THREE.Vector2(1.05, 2.05));// Rim lip
        points.push(new THREE.Vector2(0.95, 2.05));// Rim inner
        points.push(new THREE.Vector2(0.9, 2));    // Inner wall top
        points.push(new THREE.Vector2(0.85, 1.5)); // Inner wall
        points.push(new THREE.Vector2(0.8, 0.5));  // Inner wall lower
        points.push(new THREE.Vector2(0.75, 0.1)); // Inner bottom

        return points;
    };

    // Handle geometry
    const handleShape = () => {
        const curve = new THREE.EllipseCurve(
            0, 0,           // center x, y
            0.3, 0.5,       // xRadius, yRadius
            0, Math.PI,     // start angle, end angle
            false,          // clockwise
            0               // rotation
        );
        const points = curve.getPoints(50);
        const points3d = points.map(p => new THREE.Vector3(p.x, p.y, 0));
        const curve3d = new THREE.CatmullRomCurve3(points3d);
        return new THREE.TubeGeometry(curve3d, 20, 0.05, 8, false);
    };

    // Animation loop for waterfall effect
    useFrame((state, delta) => {
        if (!cupGroupRef.current) return;

        const group = cupGroupRef.current;

        // Get rotation angles
        const rotationX = group.rotation.x;
        const rotationZ = group.rotation.z;

        // Check if cup is tilted enough for waterfall (more than 30 degrees)
        const tiltAngle = Math.abs(rotationX) + Math.abs(rotationZ);
        const isTilted = tiltAngle > Math.PI / 6;

        if (isTilted) {
            // Calculate pour direction based on rotation
            const pourDirection = new THREE.Vector3();

            if (Math.abs(rotationX) > Math.abs(rotationZ)) {
                pourDirection.set(Math.sign(rotationX), 0, 0);
            } else {
                pourDirection.set(0, 0, Math.sign(rotationZ));
            }

            // Spawn new particles from cup rim
            const worldPos = new THREE.Vector3();
            group.getWorldPosition(worldPos);

            // Create particles at the rim edge
            const spawnPos = new THREE.Vector3(
                pourDirection.x * 0.95,
                2.05,
                pourDirection.z * 0.95
            );
            spawnPos.applyQuaternion(group.quaternion);
            spawnPos.add(worldPos);

            // Add multiple particles per frame for smooth flow
            for (let i = 0; i < 8; i++) {
                const particle: Particle = {
                    position: spawnPos.clone().add(
                        new THREE.Vector3(
                            (Math.random() - 0.5) * 0.2,
                            (Math.random() - 0.5) * 0.08,
                            (Math.random() - 0.5) * 0.2
                        )
                    ),
                    velocity: new THREE.Vector3(
                        pourDirection.x * (2.0 + Math.random() * 1.0),
                        -0.2 + Math.random() * 0.4,
                        pourDirection.z * (2.0 + Math.random() * 1.0)
                    ),
                    life: 2.0
                };
                particlesRef.current.push(particle);
            }
        }

        // Update existing particles
        particlesRef.current = particlesRef.current.filter(particle => {
            // Apply gravity
            particle.velocity.y -= 9.8 * delta;

            // Update position
            particle.position.x += particle.velocity.x * delta;
            particle.position.y += particle.velocity.y * delta;
            particle.position.z += particle.velocity.z * delta;

            // Decrease life
            particle.life -= delta * 2;

            // Remove dead or fallen particles
            return particle.life > 0 && particle.position.y > -5;
        });

        setParticles([...particlesRef.current]);
    });

    return (
        <group ref={cupGroupRef}>
            {/* Cup body */}
            <mesh castShadow receiveShadow>
                <latheGeometry args={[cupShape(), 32]} />
                <meshStandardMaterial
                    color="#ffffff"
                    roughness={0.2}
                    metalness={0.1}
                />
            </mesh>

            {/* Handle */}
            <mesh position={[0.95, 1.0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} castShadow>
                <primitive object={handleShape()} />
                <meshStandardMaterial
                    color="#ffffff"
                    roughness={0.2}
                    metalness={0.1}
                />
            </mesh>

            {/* Water inside the cup */}
            <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.88, 0.82, 1.6, 32]} />
                <meshStandardMaterial
                    color="#4db8ff"
                    transparent
                    opacity={0.6}
                    roughness={0.1}
                    metalness={0.3}
                />
            </mesh>

            {/* Waterfall particles */}
            {particles.map((particle, index) => (
                <mesh key={index} position={particle.position}>
                    <sphereGeometry args={[0.08, 8, 8]} />
                    <meshStandardMaterial
                        color="#4db8ff"
                        transparent
                        opacity={particle.life * 0.5}
                        roughness={0.1}
                        metalness={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
}
