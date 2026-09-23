import { useEffect, useRef } from "react";

interface Props {
  channelData: Float32Array;
  playheadSeconds?: number;
  durationSeconds: number;
  height?: number;
}

export default function Waveform({ channelData, playheadSeconds, durationSeconds, height = 90 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 600;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    const mid = height / 2;
    const samplesPerPixel = Math.max(1, Math.floor(channelData.length / width));

    ctx.fillStyle = "rgba(176, 107, 255, 0.55)";
    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      let min = 0;
      let max = 0;
      for (let i = 0; i < samplesPerPixel; i++) {
        const s = channelData[start + i] ?? 0;
        if (s < min) min = s;
        if (s > max) max = s;
      }
      const y1 = mid + min * mid;
      const y2 = mid + max * mid;
      ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }

    if (playheadSeconds !== undefined && durationSeconds > 0) {
      const x = (playheadSeconds / durationSeconds) * width;
      ctx.strokeStyle = "#ffb648";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [channelData, playheadSeconds, durationSeconds, height]);

  return <canvas ref={canvasRef} className="waveform" style={{ height }} />;
}
