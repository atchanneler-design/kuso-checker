'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import type { DisplayScores } from '@/lib/score';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

type Props = {
  scores: DisplayScores;
};

export default function RadarChart({ scores }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = Object.entries(scores).map(([k, v]) => [k, `${v}`]);
    const data = Object.values(scores);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: 'rgba(226, 75, 74, 0.2)',
            borderColor: '#E24B4A',
            borderWidth: 2,
            pointBackgroundColor: '#E24B4A',
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: 10,
        },
        animation: {
          duration: 800,
          easing: 'easeInOutQuart',
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 25,
              display: false,
            },
            pointLabels: {
              font: { size: 18, weight: 'bold' },
              color: '#1f2937',
              padding: 15,
            },
            grid: {
              color: 'rgba(0,0,0,0.1)',
            },
            angleLines: {
              color: 'rgba(0,0,0,0.1)',
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw}点`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [scores]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <canvas ref={canvasRef} />
    </div>
  );
}
