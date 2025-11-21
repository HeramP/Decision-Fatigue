import React, { useEffect, useState, useRef } from 'react';
import { Option } from '../types';
import { ChevronDown } from 'lucide-react';

interface WheelProps {
  options: Option[];
  isSpinning: boolean;
  onSpinEnd: (winner: Option) => void;
  forcedWinnerIndex?: number | null;
}

export const Wheel: React.FC<WheelProps> = ({ options, isSpinning, onSpinEnd, forcedWinnerIndex }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  const segmentAngle = 360 / options.length;

  useEffect(() => {
    if (isSpinning && options.length > 0) {
      const winningIndex = forcedWinnerIndex !== null && forcedWinnerIndex !== undefined 
        ? forcedWinnerIndex 
        : Math.floor(Math.random() * options.length);

      // Calculate where the center of the winning segment is currently (without new rotation)
      // Segment i starts at i*angle. Center is (i + 0.5) * angle.
      const winningSegmentCenter = (winningIndex * segmentAngle) + (segmentAngle / 2);
      
      // We want to rotate the wheel so that winningSegmentCenter ends up at 0deg (12 o'clock).
      // The wheel is already rotated by `rotation`.
      // The current visual angle of the winner's center is: (winningSegmentCenter + rotation) % 360
      const currentVisualAngle = (winningSegmentCenter + rotation) % 360;
      
      // Calculate the distance needed to reach the next 0/360 mark
      let angleNeeded = 360 - currentVisualAngle;
      
      // Ensure positive rotation for consistent clockwise spin
      if (angleNeeded < 0) angleNeeded += 360;
      
      const extraSpins = 1800; // 5 full spins (5 * 360)
      
      // Add random offset strictly within safe bounds of the segment
      // Bounds are +/- segmentAngle/2. We use 0.4 to keep the pointer safely inside the color slice.
      const randomOffset = (Math.random() * segmentAngle * 0.8) - (segmentAngle * 0.4);

      const totalRotationToAdd = extraSpins + angleNeeded + randomOffset;
      const finalRotation = rotation + totalRotationToAdd;

      setRotation(finalRotation);

      // Notify parent after animation finishes
      const timeout = setTimeout(() => {
        onSpinEnd(options[winningIndex]);
      }, 4000); // Match CSS transition duration

      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning]);

  const conicGradient = `conic-gradient(${options
    .map((opt, i) => `${opt.color} ${i * (100 / options.length)}% ${(i + 1) * (100 / options.length)}%`)
    .join(', ')})`;

  return (
    <div className={`relative flex justify-center items-center py-8 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSpinning ? 'scale-105' : 'scale-100'}`}>
      {/* Pointer - Positioned to point at the top center of the wheel */}
      <div className="absolute top-2 z-20 text-white drop-shadow-lg filter drop-shadow-md">
         <ChevronDown size={48} fill="white" className="text-slate-900" />
      </div>

      {/* Wheel Container */}
      <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full shadow-2xl border-4 border-slate-800 overflow-hidden bg-slate-800">
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full relative"
          style={{
            background: conicGradient,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          }}
        >
          {options.map((opt, i) => {
            const rotationAngle = (segmentAngle * i) + (segmentAngle / 2);
            return (
              <div
                key={opt.id}
                className="absolute top-0 left-0 w-full h-full flex justify-center pt-4 sm:pt-8"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                }}
              >
                <span 
                  className="text-white font-bold text-sm sm:text-xl drop-shadow-md truncate"
                  style={{ 
                    writingMode: 'vertical-rl', 
                    textOrientation: 'mixed',
                    maxHeight: '45%' 
                  }} 
                >
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Center Cap */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-900 rounded-full border-4 border-slate-700 shadow-inner z-10 flex items-center justify-center">
             <span className="text-xs text-slate-500 font-bold tracking-wider">SPIN</span>
        </div>
      </div>
    </div>
  );
};