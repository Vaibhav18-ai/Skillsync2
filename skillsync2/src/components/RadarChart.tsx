import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface RadarChartProps {
  labels: string[];
  data: number[];
}

export const RadarChart: React.FC<RadarChartProps> = ({ labels, data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (labels.length < 3) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.2)',
            pointBackgroundColor: '#0d9488',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#0d9488',
            borderWidth: 2,
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
              label: (context) => ` Score: ${context.formattedValue} / 10`,
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              display: false,
              stepSize: 2,
            },
            grid: {
              color: '#e2e8f0',
            },
            angleLines: {
              color: '#e2e8f0',
            },
            pointLabels: {
              font: {
                size: 11,
                family: 'Inter, sans-serif',
                weight: 'bold',
              },
              color: '#475569',
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
  }, [labels, data]);

  if (labels.length < 3) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Add at least 3 skills to display radar strength chart.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[220px]">
      <canvas ref={canvasRef} />
    </div>
  );
};
