import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, UTCTimestamp } from 'lightweight-charts';

export interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ChartProps {
  data: CandlestickData[];
  height?: number;
  width?: number;
  symbol?: string;
}

export const Chart: React.FC<ChartProps> = ({ 
  data, 
  height = 400, 
  width = 800, 
  symbol = 'Symbol' 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { color: '#1f2937' }, // Gray-800
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: '#374151' }, // Gray-700
        horzLines: { color: '#374151' }, // Gray-700
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: '#4b5563', // Gray-600
      },
      timeScale: {
        borderColor: '#4b5563', // Gray-600
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981', // Emerald-500
      downColor: '#ef4444', // Red-500
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    // Store references
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const { width: containerWidth, height: containerHeight } = 
          chartContainerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({
          width: containerWidth,
          height: containerHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, [width, height]);

  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      setIsLoading(true);
      try {
        // Convert data to the format expected by lightweight-charts
        const formattedData = data.map(item => ({
          time: (typeof item.time === 'string' ? 
            Math.floor(new Date(item.time).getTime() / 1000) : 
            item.time) as UTCTimestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        })).sort((a, b) => (a.time as number) - (b.time as number));

        candlestickSeriesRef.current.setData(formattedData);
        
        // Fit content to view
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [data]);

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{symbol} Price Chart</h3>
        {isLoading && (
          <div className="text-sm text-gray-400">Loading chart data...</div>
        )}
      </div>
      <div 
        ref={chartContainerRef} 
        className="rounded-lg border border-gray-600 bg-gray-800"
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
};

export default Chart;
