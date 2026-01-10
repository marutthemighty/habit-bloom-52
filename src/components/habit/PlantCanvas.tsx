import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface PlantCanvasProps {
  health: number; // 0-100
  totalStreak: number;
}

type PlantStage = 'seed' | 'sprout' | 'small' | 'medium' | 'flourishing';

const getPlantStage = (totalStreak: number): PlantStage => {
  if (totalStreak < 3) return 'seed';
  if (totalStreak < 7) return 'sprout';
  if (totalStreak < 14) return 'small';
  if (totalStreak < 30) return 'medium';
  return 'flourishing';
};

const getStageLabel = (stage: PlantStage): string => {
  const labels: Record<PlantStage, string> = {
    seed: '🌰 Seed',
    sprout: '🌱 Sprout',
    small: '🌿 Growing',
    medium: '🌳 Thriving',
    flourishing: '🌲 Flourishing',
  };
  return labels[stage];
};

export const PlantCanvas = ({ health, totalStreak }: PlantCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<PlantStage>('seed');
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    setStage(getPlantStage(totalStreak));
  }, [totalStreak]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const drawPlant = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      skyGradient.addColorStop(0, 'hsl(200, 40%, 85%)');
      skyGradient.addColorStop(1, 'hsl(45, 30%, 96%)');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height * 0.7);

      // Ground
      const groundGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
      groundGradient.addColorStop(0, 'hsl(25, 35%, 35%)');
      groundGradient.addColorStop(1, 'hsl(25, 35%, 25%)');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, height * 0.7, width, height * 0.3);

      // Pot
      const potWidth = 80;
      const potHeight = 60;
      const potX = width / 2 - potWidth / 2;
      const potY = height * 0.68;

      ctx.fillStyle = 'hsl(20, 30%, 45%)';
      ctx.beginPath();
      ctx.moveTo(potX + 5, potY);
      ctx.lineTo(potX + potWidth - 5, potY);
      ctx.lineTo(potX + potWidth - 15, potY + potHeight);
      ctx.lineTo(potX + 15, potY + potHeight);
      ctx.closePath();
      ctx.fill();

      // Pot rim
      ctx.fillStyle = 'hsl(20, 30%, 38%)';
      ctx.fillRect(potX, potY - 8, potWidth, 12);

      // Soil in pot
      ctx.fillStyle = 'hsl(25, 35%, 30%)';
      ctx.beginPath();
      ctx.ellipse(width / 2, potY + 5, potWidth / 2 - 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Calculate wilting effect
      const wiltFactor = Math.max(0, 1 - health / 100);
      const sway = Math.sin(time * 0.002) * 3 * (1 - wiltFactor * 0.5);
      const droopAngle = wiltFactor * 0.3;

      // Healthy color to wilting color
      const greenHue = 142 - wiltFactor * 50;
      const greenSat = 50 - wiltFactor * 20;
      const greenLight = 40 + wiltFactor * 15;
      const plantColor = `hsl(${greenHue}, ${greenSat}%, ${greenLight}%)`;
      const darkPlantColor = `hsl(${greenHue}, ${greenSat - 10}%, ${greenLight - 10}%)`;

      const centerX = width / 2;
      const baseY = potY;

      ctx.save();
      ctx.translate(centerX, baseY);
      ctx.rotate(droopAngle * Math.sin(time * 0.001));

      if (stage === 'seed') {
        // Just a small mound
        ctx.fillStyle = 'hsl(25, 35%, 28%)';
        ctx.beginPath();
        ctx.ellipse(0, -5, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (stage === 'sprout') {
        // Small sprout
        ctx.strokeStyle = plantColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway, -15, sway * 0.5, -30);
        ctx.stroke();

        // Two small leaves
        ctx.fillStyle = plantColor;
        drawLeaf(ctx, sway * 0.5, -25, 12, 8, 0.3 + sway * 0.02);
        drawLeaf(ctx, sway * 0.5, -20, 12, 8, -0.3 + sway * 0.02);
      } else if (stage === 'small') {
        // Taller stem
        ctx.strokeStyle = darkPlantColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 1.5, -30, sway, -60);
        ctx.stroke();

        // Multiple leaves
        ctx.fillStyle = plantColor;
        drawLeaf(ctx, sway, -55, 18, 12, 0.4 + sway * 0.02);
        drawLeaf(ctx, sway, -50, 16, 10, -0.4 + sway * 0.02);
        drawLeaf(ctx, sway * 0.8, -40, 14, 9, 0.5 + sway * 0.02);
        drawLeaf(ctx, sway * 0.8, -35, 14, 9, -0.5 + sway * 0.02);
      } else if (stage === 'medium') {
        // Thicker trunk
        ctx.strokeStyle = darkPlantColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 2, -50, sway * 1.5, -100);
        ctx.stroke();

        // Branches
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sway * 1.2, -60);
        ctx.quadraticCurveTo(sway * 2 + 20, -70, sway * 2 + 30, -65);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sway * 1.4, -80);
        ctx.quadraticCurveTo(sway * 2 - 25, -90, sway * 2 - 35, -85);
        ctx.stroke();

        // Leaves
        ctx.fillStyle = plantColor;
        drawLeaf(ctx, sway * 1.5, -95, 22, 14, 0.3 + sway * 0.015);
        drawLeaf(ctx, sway * 1.5, -90, 20, 12, -0.3 + sway * 0.015);
        drawLeaf(ctx, sway * 2 + 30, -65, 18, 11, 0.5);
        drawLeaf(ctx, sway * 2 - 35, -85, 18, 11, -0.5);
        drawLeaf(ctx, sway * 1.2, -70, 16, 10, 0.6 + sway * 0.02);
        drawLeaf(ctx, sway * 1.4, -65, 16, 10, -0.6 + sway * 0.02);
      } else {
        // Flourishing tree
        ctx.strokeStyle = 'hsl(25, 30%, 35%)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 2, -60, sway * 1.5, -130);
        ctx.stroke();

        // Main branches
        ctx.lineWidth = 5;
        const branches = [
          { startY: -70, angle: 0.4, length: 45 },
          { startY: -90, angle: -0.5, length: 40 },
          { startY: -110, angle: 0.3, length: 35 },
          { startY: -120, angle: -0.35, length: 30 },
        ];

        branches.forEach((branch) => {
          const startX = sway * (1 + Math.abs(branch.startY) / 100);
          ctx.beginPath();
          ctx.moveTo(startX, branch.startY);
          ctx.quadraticCurveTo(
            startX + Math.cos(branch.angle) * branch.length * 0.5,
            branch.startY + Math.sin(branch.angle) * branch.length * 0.3 - 10,
            startX + Math.cos(branch.angle) * branch.length,
            branch.startY + Math.sin(branch.angle) * branch.length * 0.5
          );
          ctx.stroke();
        });

        // Foliage clusters (circles of leaves)
        ctx.fillStyle = plantColor;
        const foliageClusters = [
          { x: sway * 1.5, y: -135, r: 25 },
          { x: sway * 1.5 + 35, y: -80, r: 20 },
          { x: sway * 1.5 - 40, y: -95, r: 22 },
          { x: sway * 1.5 + 25, y: -115, r: 18 },
          { x: sway * 1.5 - 30, y: -125, r: 18 },
        ];

        foliageClusters.forEach((cluster) => {
          // Draw overlapping leaves in a cluster
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 0.001;
            const leafX = cluster.x + Math.cos(angle) * cluster.r * 0.6;
            const leafY = cluster.y + Math.sin(angle) * cluster.r * 0.4;
            drawLeaf(ctx, leafX, leafY, cluster.r * 0.8, cluster.r * 0.5, angle);
          }
        });

        // Add some flowers/fruits if very healthy
        if (health > 80) {
          ctx.fillStyle = 'hsl(45, 80%, 55%)';
          foliageClusters.slice(0, 3).forEach((cluster) => {
            ctx.beginPath();
            ctx.arc(cluster.x + 5, cluster.y + 5, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      ctx.restore();

      // Add sparkles for high health
      if (health > 70) {
        const sparkleCount = Math.floor((health - 70) / 10);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        for (let i = 0; i < sparkleCount; i++) {
          const sparkleX = centerX + Math.sin(time * 0.003 + i * 2) * 50;
          const sparkleY = height * 0.4 + Math.cos(time * 0.002 + i * 3) * 30;
          const sparkleSize = 2 + Math.sin(time * 0.005 + i) * 1;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawLeaf = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(width * 0.5, -height, width, 0);
      ctx.quadraticCurveTo(width * 0.5, height * 0.5, 0, 0);
      ctx.fill();
      ctx.restore();
    };

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      drawPlant(timestamp);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stage, health]);

  return (
    <Card className="p-4 overflow-hidden">
      <div className="text-center mb-3">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Your Garden
        </h3>
        <p className="text-sm text-muted-foreground">
          {getStageLabel(stage)} • {health}% healthy
        </p>
      </div>
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-b from-[hsl(200,40%,85%)] to-[hsl(45,30%,96%)]">
        <canvas
          ref={canvasRef}
          width={280}
          height={260}
          className="w-full h-auto"
        />
      </div>
      <div className="mt-3 flex justify-center gap-2 text-xs text-muted-foreground">
        <span>🔥 {totalStreak} total streak days</span>
      </div>
    </Card>
  );
};
