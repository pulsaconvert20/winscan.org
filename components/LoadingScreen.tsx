'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if this is first visit in this session
    const hasVisited = sessionStorage.getItem('winscan_visited');
    
    if (hasVisited) {
      // Already visited, don't show loading screen
      setIsLoading(false);
      return;
    }
    
    // First visit - show loading screen
    setIsLoading(true);
    sessionStorage.setItem('winscan_visited', 'true');

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 3;
      });
    }, 30);

    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Hide loading screen after fade out
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div 
      suppressHydrationWarning
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Expanding rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-64 h-64 border border-purple-500/20 rounded-full animate-ping-slow"></div>
        <div className="absolute w-96 h-96 border border-blue-500/10 rounded-full animate-ping-slower"></div>
      </div>

      <div className="flex flex-col items-center gap-10 relative z-10">
        {/* Logo container with particles effect */}
        <div className="relative w-96 h-96 flex items-center justify-center">
          {/* Rotating gradient rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-80 h-80 rounded-full border-2 border-transparent bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 animate-spin-slow" style={{ maskImage: 'linear-gradient(transparent 49%, black 50%, black 51%, transparent 52%)' }}></div>
            <div className="absolute w-72 h-72 rounded-full border-2 border-transparent bg-gradient-to-l from-blue-500/20 via-purple-500/20 to-blue-500/20 animate-spin-reverse" style={{ maskImage: 'linear-gradient(transparent 49%, black 50%, black 51%, transparent 52%)' }}></div>
          </div>

          {/* Logo container with premium frame */}
          <div className="relative z-10">
            {/* Main logo container */}
            <div className="relative w-48 h-48">
              {/* 3D Shadow layers for depth */}
              <div className="absolute inset-0 translate-y-2 translate-x-2 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-[32px] blur-md"></div>
              <div className="absolute inset-0 translate-y-1 translate-x-1 bg-gradient-to-br from-purple-800/30 to-blue-800/30 rounded-[32px] blur-sm"></div>
              
              {/* Outer gradient border (thick) */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-purple-500 rounded-[32px] p-[3px] animate-border-pulse">
                {/* Middle border layer */}
                <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-[29px] p-[2px]">
                  {/* Inner gradient border */}
                  <div className="w-full h-full bg-gradient-to-br from-purple-600/50 via-blue-600/50 to-purple-600/50 rounded-[27px] p-[1px]">
                    {/* Pure black background */}
                    <div className="w-full h-full bg-black rounded-[26px] relative overflow-hidden">
                      {/* Subtle radial gradient overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_60%)]"></div>
                      
                      {/* Inner border highlight */}
                      <div className="absolute inset-[4px] rounded-[24px] border border-white/5"></div>
                      
                      {/* Top shine effect */}
                      <div className="absolute top-0 left-1/4 right-1/4 h-16 bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-t-[26px]"></div>
                      
                      {/* Logo with emboss effect and triple glow */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          {/* Outer glow layer */}
                          <div className="absolute inset-0 blur-2xl opacity-70">
                            <Image
                              src="/logo.svg"
                              alt="WinScan Logo Glow"
                              width={120}
                              height={120}
                              priority
                              className="object-contain"
                            />
                          </div>
                          {/* Middle glow layer */}
                          <div className="absolute inset-0 blur-xl opacity-90">
                            <Image
                              src="/logo.svg"
                              alt="WinScan Logo Glow"
                              width={120}
                              height={120}
                              priority
                              className="object-contain"
                            />
                          </div>
                          {/* Inner glow layer */}
                          <div className="absolute inset-0 blur-md opacity-100">
                            <Image
                              src="/logo.svg"
                              alt="WinScan Logo Glow"
                              width={120}
                              height={120}
                              priority
                              className="object-contain"
                            />
                          </div>
                          {/* Main logo with emboss effect */}
                          <Image
                            src="/logo.svg"
                            alt="WinScan Logo"
                            width={120}
                            height={120}
                            priority
                            className="relative object-contain"
                            style={{
                              filter: 'drop-shadow(0 -2px 4px rgba(255,255,255,0.1)) drop-shadow(0 2px 8px rgba(0,0,0,0.8)) drop-shadow(-2px 0 4px rgba(255,255,255,0.05)) drop-shadow(2px 0 4px rgba(0,0,0,0.6))'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Corner accents with glow */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-purple-500/50 rounded-tl-2xl shadow-[0_0_10px_rgba(168,85,247,0.3)]"></div>
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-blue-500/50 rounded-tr-2xl shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-blue-500/50 rounded-bl-2xl shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-purple-500/50 rounded-br-2xl shadow-[0_0_10px_rgba(168,85,247,0.3)]"></div>
              
              {/* Floating shadow */}
              <div className="absolute -bottom-6 left-8 right-8 h-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent blur-2xl rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 text-transparent bg-clip-text animate-gradient-x">
            WinScan Explorer
          </h2>
          <p className="text-sm text-gray-500 font-medium">Initializing blockchain data...</p>
        </div>

        {/* Progress bar */}
        <div className="w-80 space-y-2.5">
          <div className="relative h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800/50 shadow-inner">
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/30 to-transparent animate-shimmer"></div>
            
            {/* Progress fill */}
            <div 
              className="relative h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-blue-500/50"
              style={{ width: `${progress}%` }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 opacity-60 blur-sm"></div>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-fast"></div>
            </div>
          </div>
          
          {/* Progress info */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">Loading...</span>
            <span className="text-gray-500 font-mono tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-100px) translateX(50px);
            opacity: 0.6;
          }
          90% {
            opacity: 0.3;
          }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        @keyframes ping-slower {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes border-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-ping-slower {
          animation: ping-slower 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-shimmer-fast {
          animation: shimmer-fast 1s ease-in-out infinite;
        }
        
        .animate-border-pulse {
          animation: border-pulse 2s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
