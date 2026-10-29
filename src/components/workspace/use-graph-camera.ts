'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Owns viewport sizing, fit, zoom and pointer panning without resetting camera on data polling. */
export function useGraphCamera(
  width: number,
  height: number,
  scope: string,
  entry: { x: number; y: number },
) {
  const container = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);
  /** Fits the full graph on demand; initial phone framing keeps its first task readable. */
  const fit = useCallback(
    (readable = false) => {
      const element = container.current;
      if (!element) return;
      const overview = Math.min(
        element.clientWidth / width,
        element.clientHeight / height,
        1,
      );
      const phone = readable && element.clientWidth < 640;
      const scale = phone ? Math.max(0.85, overview) : overview;
      setCamera({
        x: phone
          ? 20 - entry.x * scale
          : Math.max(0, (element.clientWidth - width * scale) / 2),
        y: phone
          ? 52 - entry.y * scale
          : Math.max(0, (element.clientHeight - height * scale) / 2),
        scale,
      });
    },
    [width, height, entry.x, entry.y],
  );
  const fitRef = useRef(fit);
  useEffect(() => {
    fitRef.current = fit;
  }, [fit]);
  useEffect(() => {
    const observer = new ResizeObserver(() => fitRef.current(true));
    if (container.current) observer.observe(container.current);
    fitRef.current(true);
    return () => observer.disconnect();
  }, [scope]);
  /** Zooms around the canvas centre while retaining the current pan offset. */
  function zoom(factor: number) {
    setCamera((previous) => {
      const scale = Math.min(1.8, Math.max(0.2, previous.scale * factor));
      const cx = (container.current?.clientWidth ?? 0) / 2;
      const cy = (container.current?.clientHeight ?? 0) / 2;
      return {
        x: cx - ((cx - previous.x) * scale) / previous.scale,
        y: cy - ((cy - previous.y) * scale) / previous.scale,
        scale,
      };
    });
  }
  /** Starts background-only panning; task controls retain their normal activation. */
  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (
      (event.target as HTMLElement).closest('button, a, input, [role="button"]')
    )
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      originX: camera.x,
      originY: camera.y,
    };
  }
  /** Updates the camera only during an active pointer gesture. */
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (active)
      setCamera((previous) => ({
        ...previous,
        x: active.originX + event.clientX - active.x,
        y: active.originY + event.clientY - active.y,
      }));
  }
  /** Ends an active pan on release, cancellation or lost capture. */
  function pointerUp() {
    drag.current = null;
  }
  return { container, camera, fit, zoom, pointerDown, pointerMove, pointerUp };
}
