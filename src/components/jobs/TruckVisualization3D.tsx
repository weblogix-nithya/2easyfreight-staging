"use client";

import {
    Badge,
    Box as ChakraBox,
    Flex,
    HStack,
    SimpleGrid,
    Spinner,
    Text,
} from "@chakra-ui/react";
import { OrbitControls, Text as DreiText } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { Box as BoxType, Vehicle } from "../../types/truck";
import { calculatePalletSpacesWithDetails } from "../../utils/truckCalculations3D";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Placement3D {
    box: BoxType;
    position: { x: number; y: number; z: number };
    orientation: { horizontal: number; vertical: number; height: number; rotated: boolean };
    color: string;
    isStacked: boolean;
}

interface Props {
    vehicle: Vehicle | null;
    boxes: BoxType[];
    isLoading?: boolean;
}

type ViewMode = "3d" | "top" | "left" | "right";

// ─── Scale ────────────────────────────────────────────────────────────────────
const S = 0.01;

const BOX_COLORS = [
    "#E74C3C", "#2ECC71", "#3498DB", "#F39C12", "#9B59B6",
    "#1ABC9C", "#E67E22", "#E91E63", "#00BCD4", "#8BC34A",
    "#FF5722", "#673AB7", "#009688", "#FFC107", "#F44336",
    "#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#03A9F4",
];

function getBoxColor(idx: number) {
    return BOX_COLORS[idx % BOX_COLORS.length];
}

// ─── Height Map (fast Float32Array instead of string-key object) ──────────────

function makeHMap(W: number, L: number, step: number) {
    const cols = Math.ceil(W / step);
    const rows = Math.ceil(L / step);
    const data = new Float32Array(cols * rows);

    const get = (x: number, y: number, w: number, d: number): number => {
        let max = 0;
        const x1 = Math.floor(x / step);
        const x2 = Math.floor((x + w - 1) / step);
        const y1 = Math.floor(y / step);
        const y2 = Math.floor((y + d - 1) / step);
        for (let r = y1; r <= y2; r++)
            for (let c = x1; c <= x2; c++) {
                const v = data[r * cols + c];
                if (v > max) max = v;
            }
        return max;
    };

    const set = (x: number, y: number, w: number, d: number, h: number) => {
        const x1 = Math.floor(x / step);
        const x2 = Math.floor((x + w - 1) / step);
        const y1 = Math.floor(y / step);
        const y2 = Math.floor((y + d - 1) / step);
        for (let r = y1; r <= y2; r++)
            for (let c = x1; c <= x2; c++)
                data[r * cols + c] = h;
    };

    return { get, set };
}

// ─── Packing Engine ───────────────────────────────────────────────────────────

function buildPlacements3D(boxes: BoxType[], vehicle: Vehicle, nonStackable = false): Placement3D[] {
    const truckW = vehicle.truck_width_cm;
    const truckL = vehicle.truck_length_cm;
    const truckH = Math.round(parseFloat(String(vehicle.max_height_m)) * 100) || 260;
    const STEP = 5;
    const result: Placement3D[] = [];
    const hmap = makeHMap(truckW, truckL, STEP);

    // ✅ FIX: pure 2D collision for non-stackable, 3D only for stackable
    const collides2D = (x: number, y: number, w: number, d: number) => {
        for (const p of result) {
            const { x: px, y: py } = p.position;
            const { horizontal: pw, vertical: pd } = p.orientation;
            if (x + w > px && px + pw > x && y + d > py && py + pd > y) return true;
        }
        return false;
    };

    const collides3D = (x: number, y: number, z: number, w: number, d: number, h: number) => {
        for (const p of result) {
            const { x: px, y: py, z: pz } = p.position;
            const { horizontal: pw, vertical: pd, height: ph } = p.orientation;
            if (x + w > px && px + pw > x && y + d > py && py + pd > y && z + h > pz && pz + ph > z)
                return true;
        }
        return false;
    };

    for (const box of [...boxes].sort((a, b) => b.length * b.width - a.length * a.width)) {
        const orients = [
            { horizontal: box.width, vertical: box.length, height: box.height, rotated: false },
            { horizontal: box.length, vertical: box.width, height: box.height, rotated: true },
        ];
        let placed = false;

        for (const o of orients) {
            if (o.horizontal > truckW || o.vertical > truckL) continue;

            for (let y = 0; y <= truckL - o.vertical && !placed; y += STEP) {
                for (let x = 0; x <= truckW - o.horizontal && !placed; x += STEP) {

                    if (nonStackable) {
                        // ✅ FIX: 2D-only check, always z=0, no height map needed
                        if (collides2D(x, y, o.horizontal, o.vertical)) continue;
                        result.push({
                            box,
                            position: { x, y, z: 0 },
                            orientation: o,
                            color: getBoxColor(box.id - 1),
                            isStacked: false,
                        });
                        placed = true;

                    } else {
                        // ✅ FIX: fast Float32Array height map
                        const z = hmap.get(x, y, o.horizontal, o.vertical);
                        if (z + o.height > truckH) continue;
                        if (collides3D(x, y, z, o.horizontal, o.vertical, o.height)) continue;
                        result.push({
                            box,
                            position: { x, y, z },
                            orientation: o,
                            color: getBoxColor(box.id - 1),
                            isStacked: z > 0,
                        });
                        hmap.set(x, y, o.horizontal, o.vertical, z + o.height);
                        placed = true;
                    }
                }
            }
            if (placed) break;
        }
    }
    return result;
}

// ─── Camera Controller ────────────────────────────────────────────────────────

function CameraController({ view, W, L, H }: { view: ViewMode; W: number; L: number; H: number }) {
    const { camera, size } = useThree();
    const controlsRef = useRef<any>(null);

    const cx = W / 2;
    const cy = H / 2;
    const cz = L / 2;

    useEffect(() => {
        const ctrl = controlsRef.current;
        const cam = camera as THREE.PerspectiveCamera;
        const fovRad = cam.fov * (Math.PI / 180);
        const aspect = size.width / size.height;

        const fitDist = (objW: number, objH: number, pad = 1.5) => {
            const byH = (objH / 2) / Math.tan(fovRad / 2);
            const byW = (objW / 2) / (Math.tan(fovRad / 2) * aspect);
            return Math.max(byH, byW) * pad;
        };

        if (view === "top") {
            const dist = fitDist(L, W, 2.8);
            camera.position.set(cx, dist, cz);
            camera.up.set(1, 0, 0);
            camera.lookAt(cx, 0, cz);
            camera.updateMatrixWorld(true);
            if (ctrl) {
                ctrl.enableRotate = false;
                ctrl.enablePan = false;
                ctrl.enableZoom = false;
                ctrl.target.set(cx, 0, cz);
                ctrl.update();
            }
        } else if (view === "3d") {
            camera.up.set(0, 1, 0);
            const dist = fitDist(L, Math.max(H, W), 2.2);
            camera.position.set(cx - dist * 0.7, cy + H * 1.0, cz + dist * 0.8);
            camera.lookAt(cx, cy, cz);
            camera.updateMatrixWorld(true);
            if (ctrl) {
                ctrl.enableRotate = true;
                ctrl.enablePan = true;
                ctrl.enableZoom = false;
                ctrl.target.set(cx, cy, cz);
                ctrl.update();
            }
        } else if (view === "left") {
            camera.up.set(0, 1, 0);
            const dist = fitDist(L, H, 2.0);
            camera.position.set(-dist, cy, cz);
            camera.lookAt(cx, cy, cz);
            camera.updateMatrixWorld(true);
            if (ctrl) {
                ctrl.enableRotate = false;
                ctrl.enablePan = false;
                ctrl.enableZoom = false;
                ctrl.target.set(cx, cy, cz);
                ctrl.update();
            }
        } else if (view === "right") {
            camera.up.set(0, 1, 0);
            const dist = fitDist(L, H, 2.0);
            camera.position.set(W + dist, cy, cz);
            camera.lookAt(cx, cy, cz);
            camera.updateMatrixWorld(true);
            if (ctrl) {
                ctrl.enableRotate = false;
                ctrl.enablePan = false;
                ctrl.enableZoom = false;
                ctrl.target.set(cx, cy, cz);
                ctrl.update();
            }
        }
    }, [view, W, L, H, size, camera, cx, cz, cy]);

    return (
        <OrbitControls
            ref={controlsRef}
            enableDamping={false}
            enableRotate={view === "3d"}
            enableZoom={false}
            enablePan={view === "3d"}
        />
    );
}

// ─── Box3D ────────────────────────────────────────────────────────────────────

function Box3D({ p, selected, onClick }: { p: Placement3D; selected: boolean; onClick: () => void }) {
    if (!p || !p.position) return null;
    const w = p.orientation.horizontal * S;
    const d = p.orientation.vertical * S;
    const h = p.orientation.height * S;
    const px = p.position.x * S + w / 2;
    const py = p.position.z * S + h / 2;
    const pz = p.position.y * S + d / 2;
    const col = new THREE.Color(p.color);
    return (
        <group position={[px, py, pz]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial
                    color={col} transparent
                    opacity={selected ? 1.0 : p.isStacked ? 0.85 : 0.95}
                    roughness={0.3} metalness={0.05}
                    emissive={selected ? col : new THREE.Color(0x000000)}
                    emissiveIntensity={selected ? 0.3 : 0}
                />
            </mesh>
            <lineSegments scale={[1.01, 1.01, 1.01]} renderOrder={999}>
                <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} />
            </lineSegments>
            {(w > 0.25 && d > 0.25 && h > 0.25) && (
                <DreiText position={[0, 0, 0]} fontSize={Math.min(w, d, h) * 0.4}
                    color="white" anchorX="center" anchorY="middle"
                    outlineWidth={0.008} outlineColor="#ffffff">
                    {`B${p.box.id}`}
                </DreiText>
            )}
        </group>
    );
}

// ─── Truck Shell ──────────────────────────────────────────────────────────────

function TruckShell({ W, L, H }: { W: number; L: number; H: number }) {
    const T = 0.012;
    return (
        <group>
            <mesh position={[W / 2, 0, L / 2]} receiveShadow>
                <boxGeometry args={[W, T, L]} />
                <meshStandardMaterial color="#607D8B" roughness={0.9} />
            </mesh>
            {[
                { pos: [0, H / 2, L / 2] as [number, number, number], size: [T, H, L] as [number, number, number] },
                { pos: [W, H / 2, L / 2] as [number, number, number], size: [T, H, L] as [number, number, number] },
                { pos: [W / 2, H / 2, 0] as [number, number, number], size: [W, H, T] as [number, number, number] },
                { pos: [W / 2, H, L / 2] as [number, number, number], size: [W, T, L] as [number, number, number] },
            ].map((wall, i) => (
                <mesh key={i} position={wall.pos}>
                    <boxGeometry args={wall.size} />
                    <meshStandardMaterial color="#90A4AE" transparent opacity={i === 3 ? 0.08 : 0.15} />
                </mesh>
            ))}
            <lineSegments position={[W / 2, H / 2, L / 2]}>
                <edgesGeometry args={[new THREE.BoxGeometry(W, H, L)]} />
                <lineBasicMaterial color="#ffffff" linewidth={2} depthTest={false} />
            </lineSegments>
        </group>
    );
}

// ─── Pallet Grid ──────────────────────────────────────────────────────────────

function PalletGrid({ truckW, truckL }: { truckW: number; truckL: number }) {
    const ps = 120 * S;
    const W = truckW * S, L = truckL * S;
    const numR = truckL / 120, numC = truckW / 120;
    const Y = 0.003;
    const lines = useMemo(() => {
        const mat = new THREE.LineBasicMaterial({ color: "#546E7A", transparent: true, opacity: 0.55 });
        const out: THREE.Line[] = [];
        for (let i = 0; i <= numC; i++) {
            const x = i * ps;
            out.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, Y, 0), new THREE.Vector3(x, Y, L)]), mat));
        }
        for (let i = 0; i <= numR; i++) {
            const z = i * ps;
            out.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, Y, z), new THREE.Vector3(W, Y, z)]), mat));
        }
        return out;
    }, [numC, ps, L, numR, W]);
    return (
        <group>
            {lines.map((l, i) => <primitive key={i} object={l} />)}
            {Array.from({ length: numR }, (_, r) =>
                Array.from({ length: numC }, (_, c) => (
                    <DreiText key={`${r}-${c}`}
                        position={[c * ps + ps / 2, Y + 0.01, r * ps + ps / 2]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={ps * 0.2} color="#546E7A" anchorX="center" anchorY="middle">
                        {String(r * numC + c + 1)}
                    </DreiText>
                ))
            )}
        </group>
    );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({ placements, vehicle, view, selectedId, onSelect }: {
    placements: Placement3D[]; vehicle: Vehicle; view: ViewMode;
    selectedId: number | null; onSelect: (id: number | null) => void;
}) {
    if (!placements) return null;
    const truckW = vehicle.truck_width_cm;
    const truckL = vehicle.truck_length_cm;
    const truckH = Math.round(parseFloat(String(vehicle.max_height_m)) * 100) || 260;
    const W = truckW * S, L = truckL * S, H = truckH * S;
    return (
        <>
            <ambientLight intensity={0.65} />
            <directionalLight position={[W * 3, H * 5, L * 3]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-W * 2, H * 2, -L]} intensity={0.3} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, -0.01, L / 2]} receiveShadow>
                <planeGeometry args={[W * 8, L * 8]} />
                <shadowMaterial opacity={0.12} />
            </mesh>
            <TruckShell W={W} L={L} H={H} />
            <PalletGrid truckW={truckW} truckL={truckL} />
            {placements.map((p) => (
                <Box3D key={p.box.id} p={p} selected={selectedId === p.box.id}
                    onClick={() => onSelect(selectedId === p.box.id ? null : p.box.id)} />
            ))}
            <mesh position={[W / 2, -0.02, L / 2]} rotation={[-Math.PI / 2, 0, 0]} onClick={() => onSelect(null)}>
                <planeGeometry args={[W * 10, L * 10]} />
                <meshBasicMaterial visible={false} />
            </mesh>
            <CameraController view={view} W={W} L={L} H={H} />
        </>
    );
}

// ─── View Sidebar Button ──────────────────────────────────────────────────────

function ViewBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
    return (
        <ChakraBox as="button" onClick={onClick}
            display="flex" flexDirection="column" alignItems="center" justifyContent="center"
            w="70px" py={2} borderRadius="md"
            bg={active ? "blue.600" : "gray.700"} color={active ? "white" : "gray.300"}
            border="2px solid" borderColor={active ? "blue.300" : "transparent"}
            cursor="pointer" _hover={{ bg: active ? "blue.500" : "gray.600" }}
            transition="all 0.15s" gap={1}>
            <Text fontSize="20px" lineHeight={1}>{icon}</Text>
            <Text fontSize="9px" fontWeight="700" letterSpacing="tight">{label}</Text>
        </ChakraBox>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TruckVisualization3D({ vehicle, boxes, isLoading = false }: Props) {
    const [nonStackable, setNonStackable] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [view, setView] = useState<ViewMode>("3d");

    // ✅ FIX: use the fixed buildPlacements3D with fast hmap + correct collision
    const placements = useMemo(() => {
        if (!vehicle || boxes.length === 0) return [];
        return buildPlacements3D(boxes, vehicle, nonStackable);
    }, [vehicle, boxes, nonStackable]);

    // ✅ FIX: pass nonStackable so pallet count matches the 3D view
    const palletResult = useMemo(() => {
        if (!vehicle || boxes.length === 0) return { spaceCount: 0 };
        return calculatePalletSpacesWithDetails(boxes, vehicle, nonStackable);
    }, [vehicle, boxes, nonStackable]);

    const sel = placements?.find((p) => p.box.id === selectedId);
    const stacked = placements.filter((p) => p.isStacked).length;
    const floor = placements.length - stacked;
    const truckH = vehicle ? Math.round(parseFloat(String(vehicle.max_height_m)) * 100) : 260;
    const totalWeight = boxes.reduce((s, b) => s + ((b as any).weight || 0) * ((b as any).quantity || 1), 0);

    if (isLoading) return (
        <ChakraBox p={4} borderWidth="1px" borderRadius="md" textAlign="center">
            <Spinner size="lg" color="blue.500" />
            <Text mt={4} color="gray.600">Loading 3D visualization…</Text>
        </ChakraBox>
    );

    if (!vehicle) return (
        <ChakraBox p={4} borderWidth="1px" borderRadius="md">
            <Text color="gray.500">No vehicle selected.</Text>
        </ChakraBox>
    );

    const initCamX = (vehicle.truck_width_cm * S) * 0.1;
    const initCamY = (truckH * S) * 2.2;
    const initCamZ = (vehicle.truck_length_cm * S) / 2 + (vehicle.truck_length_cm * S) * 1.2;

    return (
        <ChakraBox borderWidth="1px" borderRadius="lg" bg="white" overflow="hidden" width="100%">

            {/* Stats bar */}
            <ChakraBox px={5} py={3} bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
                    <HStack spacing={4}>
                        {[
                            { label: "Floor", value: floor },
                            { label: "Stacked", value: stacked },
                            { label: "Total Weight", value: `${totalWeight} kg` },
                        ].map((s) => (
                            <ChakraBox key={s.label} bg="white" borderRadius="md" borderWidth="1px"
                                borderColor="gray.200" px={4} py={1.5} textAlign="center" minW="70px">
                                <Text fontSize="11px" color="gray.500">{s.label}</Text>
                                <Text fontSize="16px" fontWeight="700" color="gray.800">{s.value}</Text>
                            </ChakraBox>
                        ))}
                    </HStack>
                    <HStack>
                        <input type="checkbox" id="ns3d" checked={nonStackable}
                            onChange={(e) => setNonStackable(e.target.checked)}
                            style={{ width: 15, height: 15, cursor: "pointer" }} />
                        <label htmlFor="ns3d" style={{ fontSize: 13, cursor: "pointer", color: "#4A5568" }}>Non-stackable</label>
                    </HStack>
                </Flex>
            </ChakraBox>

            {/* Canvas + Sidebar */}
            <Flex>
                <ChakraBox flex={1} h="480px" position="relative">
                    <Canvas
                        shadows
                        camera={{
                            fov: 45,
                            near: 0.001,
                            far: 1000,
                            position: [initCamX, initCamY, initCamZ],
                            up: [0, 1, 0],
                        }}
                        style={{ background: "linear-gradient(150deg, #cfd8dc 0%, #b0bec5 100%)" }}
                    >
                        <Suspense fallback={null}>
                            <Scene placements={placements} vehicle={vehicle} view={view}
                                selectedId={selectedId} onSelect={setSelectedId} />
                        </Suspense>
                    </Canvas>

                    <ChakraBox position="absolute" bottom={3} left="50%" transform="translateX(-50%)"
                        bg="whiteAlpha.900" px={4} py={1} borderRadius="full" pointerEvents="none" boxShadow="sm">
                        <Text fontSize="11px" color="gray.700" fontWeight="500" whiteSpace="nowrap">
                            {vehicle.truck_length_cm}cm (L) × {vehicle.truck_width_cm}cm (W) × {truckH}cm (H) – {vehicle.vehicle_name}
                        </Text>
                    </ChakraBox>

                    <ChakraBox position="absolute" bottom={3} left={3} bg="blackAlpha.400" px={2} py={1}
                        borderRadius="md" pointerEvents="none">
                        <Text fontSize="10px" color="whiteAlpha.800">Drag rotate · Scroll zoom · Right-click pan</Text>
                    </ChakraBox>
                </ChakraBox>

                {/* Right sidebar */}
                <ChakraBox w="86px" bg="gray.800" display="flex" flexDirection="column"
                    alignItems="center" py={4} gap={2}>
                    <Text fontSize="9px" color="gray.400" fontWeight="700" letterSpacing="widest" mb={1}>VIEWS</Text>
                    <ViewBtn active={view === "3d"} onClick={() => setView("3d")} icon="📦" label="3D View" />
                    <ViewBtn active={view === "top"} onClick={() => setView("top")} icon="📐" label="Top" />
                    <ViewBtn active={view === "left"} onClick={() => setView("left")} icon="◀" label="Left Side" />
                    <ViewBtn active={view === "right"} onClick={() => setView("right")} icon="▶" label="Right Side" />
                </ChakraBox>
            </Flex>

            {placements.length < boxes.length && (
                <ChakraBox px={5} py={2} bg="red.50" borderTopWidth="1px" borderColor="red.200">
                    <Text fontSize="sm" color="red.600">⚠️ {boxes.length - placements.length} box(es) could not be placed.</Text>
                </ChakraBox>
            )}

            {sel && sel.position && (
                <ChakraBox px={5} py={2} bg="blue.50" borderTopWidth="1px" borderColor="blue.200">
                    <HStack spacing={4} flexWrap="wrap">
                        <HStack>
                            <ChakraBox w="14px" h="14px" bg={sel.color} borderRadius="2px" flexShrink={0} />
                            <Text fontWeight="700" color="blue.800" fontSize="sm">Box {sel.box.id}</Text>
                            {sel.isStacked && <Badge colorScheme="red" fontSize="10px">↑ {sel.position.z}cm</Badge>}
                        </HStack>
                        <Text fontSize="sm" color="blue.700">{sel.box.length}×{sel.box.width}×{sel.box.height}cm</Text>
                        <Text fontSize="sm" color="blue.700">X:{sel.position?.x} Y:{sel.position?.y} Z:{sel.position?.z}cm</Text>
                        {sel.orientation?.rotated && <Text fontSize="sm" color="blue.700">Rotated ↻</Text>}
                    </HStack>
                </ChakraBox>
            )}

            <ChakraBox px={5} py={3} borderTopWidth="1px" borderColor="gray.200">
                <Text fontSize="sm" color="blue.600" fontWeight="600" mb={2}>
                    Pallet Spaces: {palletResult.spaceCount} &nbsp;·&nbsp; Placed: {placements.length}/{boxes.length}
                </Text>
                <SimpleGrid columns={[2, 3, 5]} spacing={1}>
                    {placements.map((p) => (
                        <HStack key={p.box.id} spacing={1.5} py={0.5} px={2} borderRadius="sm" cursor="pointer"
                            bg={selectedId === p.box.id ? "blue.50" : "transparent"}
                            _hover={{ bg: "gray.50" }}
                            onClick={() => setSelectedId(selectedId === p.box.id ? null : p.box.id)}>
                            <ChakraBox w="10px" h="10px" flexShrink={0} bg={p.color} borderRadius="2px"
                                border="1px solid" borderColor="gray.400" />
                            <Text fontSize="11px" color="gray.700" noOfLines={1}>
                                <b>B{p.box.id}</b>: {p.box.length}×{p.box.width}×{p.box.height}{p.isStacked ? " ▲" : ""}
                            </Text>
                        </HStack>
                    ))}
                </SimpleGrid>
            </ChakraBox>

        </ChakraBox>
    );
}