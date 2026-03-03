'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import ValidatorAvatar from './ValidatorAvatar';

// Dynamic import to avoid SSR issues with three.js
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface SupernodeLocation {
  lat: number;
  lng: number;
  moniker: string;
  address: string;
  identity: string;
  country: string;
  city: string;
  status: string;
  flag: string;
}

interface SupernodeGlobeProps {
  supernodes: SupernodeLocation[];
}

export default function SupernodeGlobe({ supernodes }: SupernodeGlobeProps) {
  const globeEl = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<SupernodeLocation | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SupernodeLocation | null>(null);

  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      
      // Set initial view - centered and better angle
      globeEl.current.pointOfView({ 
        lat: 20,
        lng: 0,
        altitude: 2.2 
      }, 1000);
    }
  }, []);

  // Create arcs (connections) - Only connect nearby nodes to reduce clutter
  const arcsData = supernodes.flatMap((source, i) => {
    // Calculate distances and only connect to 2-3 nearest nodes
    const distances = supernodes
      .map((target, j) => ({
        target,
        index: j,
        distance: Math.sqrt(
          Math.pow(source.lat - target.lat, 2) + 
          Math.pow(source.lng - target.lng, 2)
        )
      }))
      .filter(d => d.index !== i) // Exclude self
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2); // Only connect to 2 nearest nodes

    return distances.map(({ target }) => ({
      startLat: source.lat,
      startLng: source.lng,
      endLat: target.lat,
      endLng: target.lng,
      color: source.status === 'active' && target.status === 'active' 
        ? ['rgba(16, 185, 129, 0.6)', 'rgba(59, 130, 246, 0.6)']
        : ['rgba(249, 115, 22, 0.4)', 'rgba(239, 68, 68, 0.4)']
    }));
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 100, 1400) : 1200}
        height={700}
        
        // Points (Nodes) - Star-like markers
        pointsData={supernodes}
        pointLat="lat"
        pointLng="lng"
        pointColor={(d: any) => d.status === 'active' ? '#10b981' : '#f97316'}
        pointAltitude={0.015}
        pointRadius={0.4}
        pointResolution={8}
        pointsMerge={false}
        pointLabel={(d: any) => `
          <div style="
            background: rgba(0, 0, 0, 0.9);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            font-family: system-ui;
          ">
            <div style="font-weight: bold; margin-bottom: 4px;">${d.flag} ${d.moniker}</div>
            <div style="font-size: 12px; color: #9ca3af;">${d.city}, ${d.country}</div>
            <div style="
              margin-top: 8px;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              background: ${d.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)'};
              color: ${d.status === 'active' ? '#10b981' : '#f97316'};
              display: inline-block;
            ">
              ${d.status === 'active' ? 'ACTIVE' : 'POSTPONED'}
            </div>
          </div>
        `}
        onPointClick={(point: any) => {
          setSelectedNode(point as SupernodeLocation);
          // Zoom to point
          globeEl.current.pointOfView({
            lat: point.lat,
            lng: point.lng,
            altitude: 1.5
          }, 1000);
        }}
        onPointHover={(point: any) => setHoveredNode(point as SupernodeLocation)}
        
        // Arcs (Connections) - Vibrant and Animated
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.6}
        arcDashGap={0.4}
        arcDashAnimateTime={1500}
        arcStroke={0.8}
        arcDashInitialGap={() => Math.random()}
        arcsTransitionDuration={1000}
        arcAltitude={0.3}
        arcAltitudeAutoScale={0.5}
        
        // Atmosphere
        atmosphereColor="rgba(59, 130, 246, 0.75)"
        atmosphereAltitude={0.2}
        
        // Animation
        animateIn={true}
      />

      {/* Selected Node Info Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 max-w-xs z-10">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
          <div className="flex items-center gap-3 mb-3">
            <ValidatorAvatar
              identity={selectedNode.identity}
              moniker={selectedNode.moniker}
              size="md"
            />
            <div>
              <h3 className="text-white font-semibold">{selectedNode.moniker}</h3>
              <p className="text-gray-500 text-xs">{selectedNode.address.slice(0, 20)}...</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Location</span>
              <span className="text-white">{selectedNode.flag} {selectedNode.city}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Country</span>
              <span className="text-white">{selectedNode.country}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                selectedNode.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-orange-500/20 text-orange-400'
              }`}>
                {selectedNode.status === 'active' ? 'ACTIVE' : 'POSTPONED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#1a1a1a]/90 backdrop-blur-sm border border-gray-800 rounded-lg p-3 z-10">
        <div className="text-xs text-gray-400 mb-2 font-semibold">Network Status</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
            <span className="text-xs text-white">Active Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></div>
            <span className="text-xs text-white">Postponed Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-green-500 shadow-lg shadow-blue-500/50"></div>
            <span className="text-xs text-white">Active Links</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50"></div>
            <span className="text-xs text-white">Inactive Links</span>
          </div>
        </div>
      </div>

      {/* Controls Info */}
      <div className="absolute top-4 left-4 bg-[#1a1a1a]/90 backdrop-blur-sm border border-gray-800 rounded-lg p-3 z-10">
        <div className="text-xs text-gray-400 space-y-1">
          <div>🖱️ <span className="text-white">Drag to rotate</span></div>
          <div>🔍 <span className="text-white">Scroll to zoom</span></div>
          <div>👆 <span className="text-white">Click node for details</span></div>
        </div>
      </div>
    </div>
  );
}
