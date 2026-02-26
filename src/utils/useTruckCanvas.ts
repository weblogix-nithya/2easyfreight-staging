

import { useEffect, useRef } from 'react';

import { Placement, Vehicle } from '../types/truck';

const PALLET_SIZE = 120;

export function useTruckCanvas(
    vehicle: Vehicle | null,
    placements: Placement[]
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !vehicle) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = vehicle.truck_length_cm;
        canvas.height = vehicle.truck_width_cm;

        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        drawGrid(ctx, vehicle);

        // Draw pallet numbers
        drawPalletNumbers(ctx, vehicle);

        // Draw boxes
        if (placements.length > 0) {
            drawBoxes(ctx, placements);
        }

    }, [vehicle, placements]);

    return canvasRef;
}

function drawGrid(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
    const numRows = vehicle.truck_length_cm / PALLET_SIZE;
    const numCols = vehicle.truck_width_cm / PALLET_SIZE;

    ctx.strokeStyle = '#CBD5E0';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= numRows; i++) {
        ctx.beginPath();
        ctx.moveTo(i * PALLET_SIZE, 0);
        ctx.lineTo(i * PALLET_SIZE, vehicle.truck_width_cm);
        ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= numCols; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * PALLET_SIZE);
        ctx.lineTo(vehicle.truck_length_cm, i * PALLET_SIZE);
        ctx.stroke();
    }
}

function drawPalletNumbers(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
    const numRows = vehicle.truck_length_cm / PALLET_SIZE;
    const numCols = vehicle.truck_width_cm / PALLET_SIZE;

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const spaceNum = row * numCols + col + 1;
            const x = row * PALLET_SIZE + PALLET_SIZE / 2;
            const y = col * PALLET_SIZE + PALLET_SIZE / 2;
            ctx.fillText(String(spaceNum), x, y);
        }
    }
}

function drawBoxes(ctx: CanvasRenderingContext2D, placements: Placement[]) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
        '#a8edea', '#fed6e3', '#c471ed', '#12c2e9'
    ];

    placements.forEach((placement, index) => {
        const pos = placement.position;
        const orient = placement.orientation;
        const box = placement.box;

        // Rotate coordinates
        const rotated = {
            x: pos.y,
            y: pos.x,
            width: orient.vertical,
            height: orient.horizontal
        };

        // Draw box
        const boxColor = colors[index % colors.length];
        ctx.fillStyle = boxColor;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(rotated.x, rotated.y, rotated.width, rotated.height);

        // Draw border
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(rotated.x, rotated.y, rotated.width, rotated.height);

        // Draw label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = rotated.x + rotated.width / 2;
        const centerY = rotated.y + rotated.height / 2;

        ctx.fillText(`Box ${box.id}`, centerX, centerY - 15);
        ctx.font = '12px Arial';
        ctx.fillText(
            `${box.length}×${box.width}×${box.height}`,
            centerX,
            centerY + 5
        );

        if (orient.rotated) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ffeb3b';
            ctx.fillText('↻', centerX, centerY + 20);
        }
    });
}