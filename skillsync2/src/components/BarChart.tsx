import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface BarChartProps {
  labels: string[];
  data: number[];
  labelName?: string;
  minY?: number;
  maxY?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  labels,
  data,
  labelName = 'Value',
  minY,
  maxY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: labelName,
            data,
            backgroundColor: '#0d9488',
            hoverBackgroundColor: '#0f766e',
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${labelName}: ${context.formattedValue}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter, sans-serif', size: 11 },
              color: '#64748b',
            },
          },
          y: {
            beginAtZero: minY === undefined,
            min: minY,
            max: maxY,
            grid: {
              color: '#f1f5f9',
            },
            ticks: {
              font: { family: 'Inter, sans-serif', size: 11 },
              color: '#64748b',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [labels, data, labelName, minY, maxY]);

  return (
    <div className="relative w-full h-full min-h-[220px]">
      <canvas ref={canvasRef} />
    </div>
  );
};
