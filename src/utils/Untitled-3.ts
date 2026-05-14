// src/utils/truckCalculations.ts

import { Box, Orientation, Placement, Vehicle } from '../types/truck';

const PALLET_SIZE = 120;
const TRUCK_WIDTH = 240; // 2 pallets
const TRUCK_LENGTH = 840; // 7 pallets
const PALLET_CBM = 1.728;

/* =========================================================
   COLLISION CHECK
========================================================= */
export function hasConflict(
    position: { x: number; y: number },
    orientation: Orientation,
    placements: Placement[]
): boolean {
    for (const p of placements) {
        const noOverlap =
            position.x + orientation.horizontal <= p.position.x ||
            p.position.x + p.orientation.horizontal <= position.x ||
            position.y + orientation.vertical <= p.position.y ||
            p.position.y + p.orientation.vertical <= position.y;

        if (!noOverlap) return true;
    }
    return false;
}

/* =========================================================
   PALLET INDEX CALCULATION
========================================================= */
export function calculateTouchedSpaces(
    position: { x: number; y: number },
    orientation: Orientation,
    vehicle?: Vehicle
): Set<number> {
    const spaces = new Set<number>();
    const PALLET = 120;

    if (vehicle) {
        const numCols = Math.floor(vehicle.truck_width_cm / PALLET);
        const numRows = Math.floor(vehicle.truck_length_cm / PALLET);

        // ✅ FIX: -0.01 instead of -1 (matches jQuery version)
        const startCol = Math.floor(position.x / PALLET);
        const endCol = Math.floor((position.x + orientation.horizontal - 0.01) / PALLET);
        const startRow = Math.floor(position.y / PALLET);
        const endRow = Math.floor((position.y + orientation.vertical - 0.01) / PALLET);

        // ✅ FIX: clamp to valid range (matches jQuery version)
        const sc = Math.max(0, Math.min(startCol, numCols - 1));
        const ec = Math.max(0, Math.min(endCol, numCols - 1));
        const sr = Math.max(0, Math.min(startRow, numRows - 1));
        const er = Math.max(0, Math.min(endRow, numRows - 1));

        for (let r = sr; r <= er; r++)
            for (let c = sc; c <= ec; c++)
                spaces.add(r * numCols + c + 1);

    } else {
        // Original fixed-size fallback (same fix applied)
        const numCols = 2, numRows = 7;

        const startCol = Math.floor(position.x / PALLET);
        const endCol = Math.floor((position.x + orientation.horizontal - 0.01) / PALLET);
        const startRow = Math.floor(position.y / PALLET);
        const endRow = Math.floor((position.y + orientation.vertical - 0.01) / PALLET);

        for (let r = startRow; r <= endRow; r++)
            for (let c = startCol; c <= endCol; c++)
                if (r < numRows && c < numCols)
                    spaces.add(r * numCols + c + 1);
    }

    return spaces;
}

/* =========================================================
   PALLET SPACE CALCULATION (CORE ENGINE)
========================================================= */
export function calculatePalletSpacesOccupied(
    boxes: Box[],
    vehicle?: Vehicle
): number {
    if (boxes.length === 0) return 0;

    const placements: Placement[] = [];
    const TRUCK_W = vehicle ? vehicle.truck_width_cm : 240;
    const TRUCK_L = vehicle ? vehicle.truck_length_cm : 840;

    const sortedBoxes = [...boxes].sort(
        (a, b) => b.length * b.width - a.length * a.width
    );

    for (const box of sortedBoxes) {
        const orientations: Orientation[] = [
            { horizontal: box.width, vertical: box.length, rotated: false },
            { horizontal: box.length, vertical: box.width, rotated: true },
        ];

        let placed = false;

        for (const orientation of orientations) {
            if (orientation.horizontal > TRUCK_W) continue;

            // ✅ FIX: step=5 (was step=1 → mismatch with 3D viz & jQuery)
            for (let y = 0; y <= TRUCK_L - orientation.vertical && !placed; y += 5) {
                for (let x = 0; x <= TRUCK_W - orientation.horizontal && !placed; x += 5) {
                    if (!hasConflict({ x, y }, orientation, placements)) {
                        placements.push({ box, position: { x, y }, orientation });
                        placed = true;
                    }
                }
            }
            if (placed) break;
        }
    }

    const occupied = new Set<number>();
    placements.forEach((p) => {
        const touched = calculateTouchedSpaces(p.position, p.orientation, vehicle);
        touched.forEach((s) => occupied.add(s));
    });

    return occupied.size;
}
/* =========================================================
   PALLET SPACE CALCULATION WITH DETAILS (FOR VISUALIZATION)
========================================================= */

export function calculatePalletSpacesWithDetails(
    boxes: Box[],
    vehicle: Vehicle,
    nonStackable: boolean = false
) {
    if (!vehicle) {
        return { placements: [], occupiedSpaces: [], spaceDetails: {}, spaceCount: 0 };
    }

    const PALLET = 120;
    const TRUCK_W = vehicle.truck_width_cm;
    const TRUCK_L = vehicle.truck_length_cm;
    const TRUCK_H = Math.round(parseFloat(String(vehicle.max_height_m)) * 100) || 260;

    interface P3D {
        box: Box;
        position: { x: number; y: number; z: number };
        orientation: { horizontal: number; vertical: number; rotated: boolean };
    }

    const placements3D: P3D[] = [];
    const hMap: Record<string, number> = {};

    const getH = (x: number, y: number, w: number, d: number) => {
        let max = 0;
        for (let cx = x; cx < x + w; cx += 5)
            for (let cy = y; cy < y + d; cy += 5) {
                const v = hMap[`${Math.round(cx / 5) * 5},${Math.round(cy / 5) * 5}`];
                if (v) max = Math.max(max, v);
            }
        return max;
    };

    const setH = (x: number, y: number, w: number, d: number, h: number) => {
        for (let cx = x; cx < x + w; cx += 5)
            for (let cy = y; cy < y + d; cy += 5)
                hMap[`${Math.round(cx / 5) * 5},${Math.round(cy / 5) * 5}`] = h;
    };

    const collides3D = (x: number, y: number, z: number, w: number, d: number, h: number) => {
        for (const p of placements3D) {
            const { x: px, y: py, z: pz } = p.position;
            const { horizontal: pw, vertical: pd } = p.orientation;
            const ph = p.box.height;

            if (
                x + w > px &&
                px + pw > x &&
                y + d > py &&
                py + pd > y &&
                z + h > pz &&
                pz + ph > z
            ) return true;
        }
        return false;
    };

    const sorted = [...boxes].sort((a, b) => b.length * b.width - a.length * a.width);

    for (const box of sorted) {
        const orients = [
            { horizontal: box.width, vertical: box.length, rotated: false },
            { horizontal: box.length, vertical: box.width, rotated: true },
        ];

        let placed = false;

        for (const o of orients) {
            if (o.horizontal > TRUCK_W || o.vertical > TRUCK_L) continue;

            for (let y = 0; y <= TRUCK_L - o.vertical && !placed; y += 5) {
                for (let x = 0; x <= TRUCK_W - o.horizontal && !placed; x += 5) {

                    let z = 0;

                    // ✅ STACKING MODE
                    if (!nonStackable) {
                        z = getH(x, y, o.horizontal, o.vertical);
                        if (z + box.height > TRUCK_H) continue;

                        if (collides3D(x, y, z, o.horizontal, o.vertical, box.height)) continue;

                        placements3D.push({ box, position: { x, y, z }, orientation: o });
                        setH(x, y, o.horizontal, o.vertical, z + box.height);
                        placed = true;
                    }

                    // ✅ NON-STACKABLE MODE (floor only)
                    else {
                        const has2DConflict = placements3D.some(p => {
                            const { x: px, y: py } = p.position;
                            const { horizontal: pw, vertical: pd } = p.orientation;

                            return (
                                x + o.horizontal > px &&
                                px + pw > x &&
                                y + o.vertical > py &&
                                py + pd > y
                            );
                        });

                        if (has2DConflict) continue;

                        placements3D.push({ box, position: { x, y, z: 0 }, orientation: o });
                        placed = true;
                    }
                }
            }

            if (placed) break;
        }

        if (!placed) console.warn(`⚠️ Box ${box.id} could not be placed`);
    }

    const numCols = Math.floor(TRUCK_W / PALLET);
    const numRows = Math.floor(TRUCK_L / PALLET);

    const occupiedSpaces = new Set<number>();
    const spaceDetails: Record<number, number[]> = {};

    placements3D.forEach(p => {
        const { x, y } = p.position;
        const { horizontal: pw, vertical: pd } = p.orientation;

        const sc = Math.max(0, Math.min(Math.floor(x / PALLET), numCols - 1));
        const ec = Math.max(0, Math.min(Math.floor((x + pw - 0.01) / PALLET), numCols - 1));
        const sr = Math.max(0, Math.min(Math.floor(y / PALLET), numRows - 1));
        const er = Math.max(0, Math.min(Math.floor((y + pd - 0.01) / PALLET), numRows - 1));

        for (let r = sr; r <= er; r++) {
            for (let c = sc; c <= ec; c++) {
                const spaceNum = r * numCols + c + 1;
                occupiedSpaces.add(spaceNum);

                if (!spaceDetails[spaceNum]) spaceDetails[spaceNum] = [];
                spaceDetails[spaceNum].push(p.box.id);
            }
        }
    });

    return {
        placements: placements3D.map(p => ({
            box: p.box,
            position: { x: p.position.x, y: p.position.y },
            orientation: {
                horizontal: p.orientation.horizontal,
                vertical: p.orientation.vertical,
                rotated: p.orientation.rotated,
            },
        })),
        occupiedSpaces: Array.from(occupiedSpaces),
        spaceDetails,
        spaceCount: occupiedSpaces.size,
    };
}

/* =========================================================
   VERTICAL CHAIN STRATEGY
========================================================= */
export function calculatePalletSpacesVerticalChain(
    boxes: Box[],
    vehicle?: Vehicle
): number {
    const occupied = new Set<number>();
    const TRUCK_L = vehicle ? vehicle.truck_length_cm : TRUCK_LENGTH;

    boxes.forEach((box, i) => {
        const position = { x: 0, y: i * 120 };
        const orientation = {
            horizontal: 120,
            vertical: 140,
            rotated: false,
        };

        if (position.y + orientation.vertical <= TRUCK_L) {
            const touched = calculateTouchedSpaces(position, orientation, vehicle);
            touched.forEach((s) => occupied.add(s));
        }
    });

    return occupied.size;
}

/* =========================================================
   MULTI STRATEGY OPTIMIZER
========================================================= */
export function calculateEfficientPalletSpaces(
    boxes: Box[],
    vehicle?: Vehicle
): number {
    if (boxes.length === 0) return 0;

    const similar = boxes.every(
        (b) =>
            b.length >= 120 && b.length <= 160 &&
            b.width >= 100 && b.width <= 140
    );

    if (!similar) {
        return calculatePalletSpacesOccupied(boxes, vehicle);
    }

    const standard = calculatePalletSpacesOccupied(boxes, vehicle);
    const vertical = calculatePalletSpacesVerticalChain(boxes, vehicle);

    return Math.min(standard, vertical);
}

/* =========================================================
   EXTRACT BOXES FROM JOB ITEMS
========================================================= */
export function extractBoxesFromJobItems(jobItems: any[]): Box[] {
    let boxes: Box[] = [];
    let boxId = 1;

    jobItems.forEach((item) => {
        const qty = Number(item.quantity || 0);

        // meters → cm
        const length = Number(item.dimension_depth || 0) * 100;
        const width = Number(item.dimension_width || 0) * 100;
        const height = Number(item.dimension_height || 0) * 100;

        if (qty > 0 && length > 0 && width > 0 && height > 0) {
            for (let i = 0; i < qty; i++) {
                boxes.push({
                    id: boxId++,
                    length,
                    width,
                    height,
                });
            }
        }
    });

    return boxes;
}

/* =========================================================
   CALCULATE PALLET SPACES FROM JOB ITEMS
========================================================= */
export function calculatePalletSpacesOccupiedFromData(
    data: any[],
    vehicle?: Vehicle
): number {
    const boxes = extractBoxesFromJobItems(data);
    return calculatePalletSpacesOccupied(boxes, vehicle);
}

/* =========================================================
   FINAL CBM + WEIGHT CALCULATION
========================================================= */
export function calculateFinalWeightCBM(
    job_category_id: any,
    jobItems: any[],
    companyWeight: number,
    vehicle?: Vehicle
): { totalCBM: number; totalWeight: number, occupiedSpaces?: number } {
    const rawCBM = jobItems.reduce(
        (t, i) => t + (i.volume || 0),
        0
    );

    const totalWeight = jobItems.reduce(
        (t, i) => t + (i.quantity || 0) * (i.weight || 0),
        0
    );

    if (rawCBM <= 0) {
        return { totalCBM: 0, totalWeight: 0, occupiedSpaces: 0 };
    }

    let finalCBM = rawCBM;
    let palletSpaces = 0;
    // LCL / Air logic
    if (job_category_id == 1 || job_category_id == 2) {
        if (vehicle) {
            const boxes = extractBoxesFromJobItems(jobItems);
            const result = calculatePalletSpacesWithDetails(boxes, vehicle);
            palletSpaces = result.spaceCount;
            console.log(`Pallet spaces occupied: ${palletSpaces}`);
        } else {

            palletSpaces = calculatePalletSpacesOccupiedFromData(jobItems, vehicle);
            console.log(`Pallet  occupied: ${palletSpaces}`);
        }



        const palletCBM = palletSpaces * PALLET_CBM;
        finalCBM = Math.max(rawCBM, palletCBM);

        // weight → CBM
        if (companyWeight && totalWeight > 0) {
            const weightCBM = totalWeight / companyWeight;
            finalCBM = Math.max(finalCBM, weightCBM);
        }
    }
    console.log(`Pallet  occupied: ${palletSpaces}`);
    console.log(`Final CBM: ${finalCBM.toFixed(3)}, Total Weight: ${totalWeight.toFixed(2)}`);
    return {
        totalCBM: finalCBM ? Number(finalCBM.toFixed(3)) : 0,
        totalWeight: totalWeight ? Number(totalWeight.toFixed(2)) : 0,
        occupiedSpaces: palletSpaces
    };
}