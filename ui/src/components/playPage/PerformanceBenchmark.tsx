/**
 * Performance Benchmark Component
 *
 * Measures and compares performance between Grid and Legacy layouts.
 * Tracks:
 * - Initial render time
 * - Re-render count
 * - Layout shift (CLS)
 * - Frame rate (FPS)
 * - Memory usage
 *
 * Usage: Add to debug panel for real-time performance monitoring
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  // Timing metrics
  initialRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;

  // Render count
  renderCount: number;

  // Frame rate
  currentFPS: number;
  averageFPS: number;

  // Memory (if available)
  memoryUsage: number | null;

  // Layout metrics
  layoutShifts: number;

  // Timestamp
  timestamp: number;
}

interface PerformanceBenchmarkProps {
  layoutType: 'grid' | 'legacy';
  tableSize: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceBenchmark: React.FC<PerformanceBenchmarkProps> = ({
  layoutType,
  tableSize,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    initialRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    renderCount: 0,
    currentFPS: 60,
    averageFPS: 60,
    memoryUsage: null,
    layoutShifts: 0,
    timestamp: Date.now()
  });

  const renderTimesRef = useRef<number[]>([]);
  const fpsFramesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const initialRenderTimeRef = useRef<number | null>(null);
  const renderCountRef = useRef<number>(0);
  const layoutShiftObserverRef = useRef<PerformanceObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Measure render time
  const measureRenderTime = useCallback(() => {
    const renderTime = performance.now();

    if (initialRenderTimeRef.current === null) {
      initialRenderTimeRef.current = renderTime;
    }

    const timeSinceLastRender = renderTime - lastFrameTimeRef.current;
    renderTimesRef.current.push(timeSinceLastRender);

    // Keep only last 100 render times
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift();
    }

    const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;

    lastFrameTimeRef.current = renderTime;
    renderCountRef.current++;

    return {
      lastRenderTime: timeSinceLastRender,
      averageRenderTime,
      renderCount: renderCountRef.current
    };
  }, []);

  // Measure FPS
  const measureFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;

    if (delta > 0) {
      const fps = 1000 / delta;
      fpsFramesRef.current.push(fps);

      // Keep only last 60 frames
      if (fpsFramesRef.current.length > 60) {
        fpsFramesRef.current.shift();
      }

      const averageFPS = fpsFramesRef.current.reduce((a, b) => a + b, 0) / fpsFramesRef.current.length;

      return {
        currentFPS: Math.round(fps),
        averageFPS: Math.round(averageFPS)
      };
    }

    return {
      currentFPS: 60,
      averageFPS: 60
    };
  }, []);

  // Measure memory usage
  const measureMemory = useCallback((): number | null => {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return null;
  }, []);

  // Update metrics
  const updateMetrics = useCallback(() => {
    const renderMetrics = measureRenderTime();
    const fpsMetrics = measureFPS();
    const memoryUsage = measureMemory();

    const newMetrics: PerformanceMetrics = {
      initialRenderTime: initialRenderTimeRef.current || 0,
      averageRenderTime: renderMetrics.averageRenderTime,
      lastRenderTime: renderMetrics.lastRenderTime,
      renderCount: renderMetrics.renderCount,
      currentFPS: fpsMetrics.currentFPS,
      averageFPS: fpsMetrics.averageFPS,
      memoryUsage,
      layoutShifts: metrics.layoutShifts,
      timestamp: Date.now()
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    // Schedule next measurement
    animationFrameRef.current = requestAnimationFrame(updateMetrics);
  }, [measureRenderTime, measureFPS, measureMemory, metrics.layoutShifts, onMetricsUpdate]);

  // Track layout shifts (CLS)
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      try {
        layoutShiftObserverRef.current = new PerformanceObserver((list) => {
          let shifts = 0;
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              shifts++;
            }
          }

          if (shifts > 0) {
            setMetrics(prev => ({
              ...prev,
              layoutShifts: prev.layoutShifts + shifts
            }));
          }
        });

        layoutShiftObserverRef.current.observe({
          entryTypes: ['layout-shift']
        });
      } catch (e) {
        console.warn('Layout shift observer not supported:', e);
      }
    }

    return () => {
      layoutShiftObserverRef.current?.disconnect();
    };
  }, []);

  // Start FPS monitoring
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateMetrics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateMetrics]);

  // Track render count
  useEffect(() => {
    renderCountRef.current++;
  });

  return (
    <div className="bg-gray-800 rounded p-3 text-xs">
      <div className="font-bold mb-2 text-yellow-400">
        Performance Metrics ({layoutType.toUpperCase()} - {tableSize}p)
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Render Metrics */}
        <div>
          <div className="text-gray-400">Renders:</div>
          <div className="font-mono text-white">{metrics.renderCount}</div>
        </div>

        <div>
          <div className="text-gray-400">Avg Render:</div>
          <div className="font-mono text-white">{metrics.averageRenderTime.toFixed(2)}ms</div>
        </div>

        {/* FPS Metrics */}
        <div>
          <div className="text-gray-400">Current FPS:</div>
          <div className={`font-mono ${metrics.currentFPS >= 55 ? 'text-green-400' : metrics.currentFPS >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
            {metrics.currentFPS}
          </div>
        </div>

        <div>
          <div className="text-gray-400">Avg FPS:</div>
          <div className={`font-mono ${metrics.averageFPS >= 55 ? 'text-green-400' : metrics.averageFPS >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
            {metrics.averageFPS}
          </div>
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage !== null && (
          <>
            <div>
              <div className="text-gray-400">Memory:</div>
              <div className="font-mono text-white">{metrics.memoryUsage} MB</div>
            </div>
          </>
        )}

        {/* Layout Shifts */}
        <div>
          <div className="text-gray-400">Layout Shifts:</div>
          <div className={`font-mono ${metrics.layoutShifts === 0 ? 'text-green-400' : metrics.layoutShifts < 5 ? 'text-yellow-400' : 'text-red-400'}`}>
            {metrics.layoutShifts}
          </div>
        </div>
      </div>

      {/* Performance Grade */}
      <div className="mt-3 pt-2 border-t border-gray-700">
        <div className="text-gray-400 mb-1">Performance Grade:</div>
        <div className={`font-bold ${
          metrics.averageFPS >= 55 && metrics.layoutShifts < 5 ? 'text-green-400' :
          metrics.averageFPS >= 30 && metrics.layoutShifts < 10 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {metrics.averageFPS >= 55 && metrics.layoutShifts < 5 ? '✅ Excellent' :
           metrics.averageFPS >= 30 && metrics.layoutShifts < 10 ? '⚠️ Good' :
           '❌ Needs Improvement'}
        </div>
      </div>
    </div>
  );
};

export default PerformanceBenchmark;
