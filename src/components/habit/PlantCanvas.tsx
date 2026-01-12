import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { PlantType } from '@/types/habit';

interface PlantCanvasProps {
  health: number;
  totalStreak: number;
  plantType?: PlantType;
}

type PlantStage = 'seed' | 'sprout' | 'small' | 'medium' | 'flourishing';

const getPlantStage = (totalStreak: number): PlantStage => {
  if (totalStreak < 3) return 'seed';
  if (totalStreak < 7) return 'sprout';
  if (totalStreak < 14) return 'small';
  if (totalStreak < 30) return 'medium';
  return 'flourishing';
};

const getStageLabel = (stage: PlantStage, plantType: PlantType): string => {
  const labels: Record<PlantType, Record<PlantStage, string>> = {
    flower: { seed: '🌰 Seed', sprout: '🌱 Sprout', small: '🌿 Budding', medium: '🌷 Blooming', flourishing: '🌸 Flourishing' },
    vegetable: { seed: '🌰 Seed', sprout: '🌱 Sprout', small: '🥬 Growing', medium: '🥕 Maturing', flourishing: '🥗 Harvest Ready' },
    fruit_tree: { seed: '🌰 Seed', sprout: '🌱 Sapling', small: '🌿 Young Tree', medium: '🌳 Growing', flourishing: '🍎 Fruit Bearing' },
  };
  return labels[plantType][stage];
};

export const PlantCanvas = ({ health, totalStreak, plantType = 'flower' }: PlantCanvasProps) => {
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

      ctx.fillStyle = 'hsl(20, 30%, 38%)';
      ctx.fillRect(potX, potY - 8, potWidth, 12);

      ctx.fillStyle = 'hsl(25, 35%, 30%)';
      ctx.beginPath();
      ctx.ellipse(width / 2, potY + 5, potWidth / 2 - 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      const wiltFactor = Math.max(0, 1 - health / 100);
      const sway = Math.sin(time * 0.002) * 3 * (1 - wiltFactor * 0.5);
      const droopAngle = wiltFactor * 0.3;

      // Plant colors based on type
      let hue = 142;
      if (plantType === 'flower') hue = 330;
      else if (plantType === 'vegetable') hue = 30;
      else if (plantType === 'fruit_tree') hue = 142;

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

      // Draw based on stage and plant type
      if (stage === 'seed') {
        ctx.fillStyle = 'hsl(25, 35%, 28%)';
        ctx.beginPath();
        ctx.ellipse(0, -5, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (stage === 'sprout') {
        ctx.strokeStyle = plantColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway, -15, sway * 0.5, -30);
        ctx.stroke();

        ctx.fillStyle = plantColor;
        drawLeaf(ctx, sway * 0.5, -25, 12, 8, 0.3 + sway * 0.02);
        drawLeaf(ctx, sway * 0.5, -20, 12, 8, -0.3 + sway * 0.02);
      } else {
        // Medium/flourishing - draw based on plant type
        ctx.strokeStyle = plantType === 'fruit_tree' ? 'hsl(25, 30%, 35%)' : darkPlantColor;
        ctx.lineWidth = stage === 'flourishing' ? 10 : 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const stemHeight = stage === 'flourishing' ? -130 : stage === 'medium' ? -100 : -60;
        ctx.quadraticCurveTo(sway * 2, stemHeight / 2, sway * 1.5, stemHeight);
        ctx.stroke();

        // Foliage/flowers based on type
        ctx.fillStyle = plantColor;
        const foliageY = stemHeight;

        if (plantType === 'flower' && stage === 'flourishing') {
          // Draw flower petals
          const petalColors = ['hsl(330, 70%, 70%)', 'hsl(280, 60%, 70%)', 'hsl(45, 80%, 70%)'];
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 0.001;
            ctx.fillStyle = petalColors[i % 3];
            ctx.beginPath();
            ctx.ellipse(
              sway * 1.5 + Math.cos(angle) * 20,
              foliageY + Math.sin(angle) * 15,
              12, 8, angle, 0, Math.PI * 2
            );
            ctx.fill();
          }
          ctx.fillStyle = 'hsl(45, 80%, 55%)';
          ctx.beginPath();
          ctx.arc(sway * 1.5, foliageY, 10, 0, Math.PI * 2);
          ctx.fill();
        } else if (plantType === 'vegetable') {
          // Draw vegetables
          for (let i = 0; i < 5; i++) {
            drawLeaf(ctx, sway + (i - 2) * 15, foliageY + i * 5, 20, 12, (i - 2) * 0.2);
          }
          if (stage === 'flourishing') {
            ctx.fillStyle = 'hsl(30, 80%, 55%)';
            ctx.beginPath();
            ctx.ellipse(sway, foliageY + 20, 8, 20, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Fruit tree - draw foliage clusters
          const clusters = [
            { x: sway * 1.5, y: foliageY, r: 25 },
            { x: sway * 1.5 + 30, y: foliageY + 20, r: 18 },
            { x: sway * 1.5 - 30, y: foliageY + 15, r: 20 },
          ];
          clusters.forEach(c => {
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              drawLeaf(ctx, c.x + Math.cos(angle) * c.r * 0.5, c.y + Math.sin(angle) * c.r * 0.3, c.r * 0.6, c.r * 0.4, angle);
            }
          });
          if (stage === 'flourishing' && health > 70) {
            ctx.fillStyle = 'hsl(0, 70%, 50%)';
            clusters.slice(0, 2).forEach(c => {
              ctx.beginPath();
              ctx.arc(c.x + 5, c.y + 8, 6, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }
      }

      ctx.restore();

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

    const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(w * 0.5, -h, w, 0);
      ctx.quadraticCurveTo(w * 0.5, h * 0.5, 0, 0);
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [stage, health, plantType]);

  return (
    <Card className="p-4 overflow-hidden">
      <div className="text-center mb-3">
        <h3 className="font-display text-lg font-semibold text-foreground">Your Garden</h3>
        <p className="text-sm text-muted-foreground">{getStageLabel(stage, plantType)} • {health}% healthy</p>
      </div>
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-b from-[hsl(200,40%,85%)] to-[hsl(45,30%,96%)]">
        <canvas ref={canvasRef} width={280} height={260} className="w-full h-auto" />
      </div>
      <div className="mt-3 flex justify-center gap-2 text-xs text-muted-foreground">
        <span>🔥 {totalStreak} total streak days</span>
      </div>
    </Card>
  );
};
