'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from 'react-simple-maps';
import ValidatorAvatar from './ValidatorAvatar';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
  specs?: {
    cpu: number;
    ram: number;
    disk: number;
  };
}

interface SupernodeMapProps {
  supernodes: SupernodeLocation[];
}

interface Cluster {
  lat: number;
  lng: number;
  nodes: SupernodeLocation[];
}

export default function SupernodeMap({ supernodes }: SupernodeMapProps) {
  const [selectedNode, setSelectedNode] = useState<SupernodeLocation | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SupernodeLocation | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; nodes: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(2.5); // Default zoom lebih dekat
  const [center, setCenter] = useState<[number, number]>([15, 50]); // Center ke Eropa

  // Filter only active nodes
  const activeSupernodes = supernodes.filter(node => node.status === 'active');

  // Calculate statistics
  const totalNodes = activeSupernodes.length;
  const uniqueCountries = new Set(activeSupernodes.map(n => n.country)).size;
  const totalConnections = Math.floor(totalNodes * 3 / 2); // Approximate

  // Get top countries by node count
  const countryStats = activeSupernodes.reduce((acc, node) => {
    acc[node.country] = (acc[node.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(countryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Get nodes count by country (only active nodes)
  const getCountryNodeCount = (countryName: string): number => {
    return activeSupernodes.filter(node => node.country === countryName).length;
  };

  // Get color intensity based on node count
  const getCountryColor = (nodeCount: number): string => {
    if (nodeCount === 0) return '#141414';
    if (nodeCount === 1) return '#1f2937';
    if (nodeCount <= 3) return '#374151';
    if (nodeCount <= 5) return '#4b5563';
    return '#6b7280';
  };

  // Cluster nearby nodes based on zoom level
  const clusterNodes = (nodes: SupernodeLocation[], threshold: number): Cluster[] => {
    const clusters: Cluster[] = [];
    const processed = new Set<number>();

    nodes.forEach((node, i) => {
      if (processed.has(i)) return;

      const cluster: Cluster = {
        lat: node.lat,
        lng: node.lng,
        nodes: [node]
      };

      nodes.forEach((other, j) => {
        if (i !== j && !processed.has(j)) {
          const distance = Math.sqrt(
            Math.pow(node.lat - other.lat, 2) + 
            Math.pow(node.lng - other.lng, 2)
          );
          if (distance < threshold) {
            cluster.nodes.push(other);
            cluster.lat = (cluster.lat * cluster.nodes.length + other.lat) / (cluster.nodes.length + 1);
            cluster.lng = (cluster.lng * cluster.nodes.length + other.lng) / (cluster.nodes.length + 1);
            processed.add(j);
          }
        }
      });

      processed.add(i);
      clusters.push(cluster);
    });

    return clusters;
  };

  // Adjust clustering threshold based on zoom - very aggressive separation
  const clusterThreshold = zoom < 2 ? 15 : zoom < 2.5 ? 5 : zoom < 3 ? 2 : zoom < 4 ? 0.5 : 0;
  const clusters = clusterNodes(activeSupernodes, clusterThreshold);
  const showAvatars = zoom >= 2.5; // Show avatars earlier

  // Add jitter to spread out overlapping nodes at high zoom
  const addJitter = (cluster: Cluster, index: number, allClusters: Cluster[]): [number, number] => {
    if (zoom < 3) return [cluster.lng, cluster.lat];
    
    // Find nearby clusters (same location or very close)
    const nearby = allClusters.filter((other, otherIdx) => {
      if (otherIdx === index) return false;
      const distance = Math.sqrt(
        Math.pow(cluster.lat - other.lat, 2) + 
        Math.pow(cluster.lng - other.lng, 2)
      );
      return distance < 1; // Increased threshold to catch more nearby nodes
    });

    if (nearby.length === 0) return [cluster.lng, cluster.lat];

    // Create circular spread pattern
    const totalNodes = nearby.length + 1;
    const myPosition = nearby.filter((_, idx) => idx < index).length;
    const angle = (myPosition * 2 * Math.PI) / totalNodes;
    const spreadRadius = 1.5 / Math.sqrt(zoom); // Larger spread, scales with zoom
    
    const jitterLng = cluster.lng + Math.cos(angle) * spreadRadius;
    const jitterLat = cluster.lat + Math.sin(angle) * spreadRadius;
    
    return [jitterLng, jitterLat];
  };

  // Calculate avatar size based on zoom - smaller at higher zoom
  const getAvatarSize = () => {
    if (zoom < 3) return 20;
    if (zoom < 4) return 18;
    if (zoom < 5) return 16;
    if (zoom < 6) return 14;
    return 12;
  };

  const avatarSize = getAvatarSize();

  // Create connections between active nodes only
  const connections = activeSupernodes.flatMap((source, i) => {
    const distances = activeSupernodes
      .map((target, j) => ({
        target,
        index: j,
        distance: Math.sqrt(
          Math.pow(source.lat - target.lat, 2) + 
          Math.pow(source.lng - target.lng, 2)
        )
      }))
      .filter(d => d.index !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Connect to 3 nearest nodes

    return distances.map(({ target }) => ({
      from: [source.lng, source.lat],
      to: [target.lng, target.lat], // Fixed: was target.lng twice
      color: 'rgba(16, 185, 129, 0.4)'
    }));
  });

  const handleClusterClick = (cluster: Cluster) => {
    if (cluster.nodes.length > 1) {
      // Zoom into cluster
      setCenter([cluster.lng, cluster.lat]);
      setZoom(Math.min(zoom * 2, 8));
    } else {
      // Show single node details
      setSelectedNode(cluster.nodes[0]);
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] select-none"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({ 
          x: e.clientX - rect.left, 
          y: e.clientY - rect.top 
        });
      }}
    >
      <style jsx>{`
        @keyframes dash-0 {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes dash-1 {
          to {
            stroke-dashoffset: -25;
          }
        }
        @keyframes dash-2 {
          to {
            stroke-dashoffset: -30;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140
        }}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={({ coordinates, zoom: newZoom }) => {
            setCenter(coordinates as [number, number]);
            setZoom(newZoom);
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = geo.properties.name;
                const nodeCount = getCountryNodeCount(countryName);
                const hasNodes = nodeCount > 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(nodeCount)}
                    stroke={hasNodes ? '#10b981' : '#1f1f1f'}
                    strokeWidth={hasNodes ? 0.8 : 0.5}
                    onMouseEnter={() => {
                      if (hasNodes) {
                        setHoveredCountry({ name: countryName, nodes: nodeCount });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCountry(null);
                    }}
                    style={{
                      default: { outline: 'none', transition: 'all 0.3s ease' },
                      hover: { 
                        outline: 'none', 
                        fill: hasNodes ? '#10b981' : '#1f1f1f',
                        cursor: hasNodes ? 'pointer' : 'grab',
                        transition: 'all 0.3s ease',
                        filter: hasNodes ? 'brightness(1.3)' : 'none'
                      },
                      pressed: { outline: 'none' }
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Animated Connection Lines between nodes */}
          {zoom < 3 && connections.map((conn, i) => (
            <g key={`line-group-${i}`}>
              {/* Base line with gradient */}
              <Line
                from={conn.from as [number, number]}
                to={conn.to as [number, number]}
                stroke="url(#line-gradient)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray="5,5"
                opacity={0.6}
              />
              {/* Animated overlay line */}
              <Line
                from={conn.from as [number, number]}
                to={conn.to as [number, number]}
                stroke="#10b981"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="5,5"
                opacity={0.8}
                style={{
                  animation: `dash-${i % 3} 3s linear infinite`
                }}
              />
            </g>
          ))}

          {/* Markers/Clusters */}
          {clusters.map((cluster, i) => {
            const isCluster = cluster.nodes.length > 1;
            const activeCount = cluster.nodes.filter(n => n.status === 'active').length;
            const hasActive = activeCount > 0;
            
            // Apply jitter to spread overlapping nodes
            const [jitteredLng, jitteredLat] = addJitter(cluster, i, clusters);

            return (
              <Marker
                key={`marker-${i}`}
                coordinates={[jitteredLng, jitteredLat]}
                onMouseEnter={() => !isCluster && setHoveredNode(cluster.nodes[0])}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleClusterClick(cluster)}
              >
                {showAvatars && !isCluster ? (
                  // Show validator avatar at high zoom - dynamic size
                  <g>
                    {/* Background circle with gradient - dynamic size */}
                    <circle
                      r={avatarSize}
                      fill="url(#avatar-gradient)"
                      stroke="#fff"
                      strokeWidth={zoom > 5 ? 2 : 3}
                      className="cursor-pointer"
                      style={{ filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4))' }}
                    />
                    {/* Avatar image using foreignObject - dynamic size */}
                    <foreignObject
                      x={-avatarSize + 2}
                      y={-avatarSize + 2}
                      width={(avatarSize - 2) * 2}
                      height={(avatarSize - 2) * 2}
                      className="cursor-pointer pointer-events-none"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                        <ValidatorAvatar
                          identity={cluster.nodes[0].identity}
                          moniker={cluster.nodes[0].moniker}
                          size="sm"
                        />
                      </div>
                    </foreignObject>
                  </g>
                ) : isCluster ? (
                  // Show cluster with validator avatar instead of number
                  <g className="cursor-pointer">
                    {/* Outer glow ring */}
                    <circle
                      r={20}
                      fill={hasActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)'}
                      className="animate-pulse"
                    />
                    {/* Middle ring */}
                    <circle
                      r={16}
                      fill={hasActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.3)'}
                    />
                    {/* Main circle with gradient background */}
                    <circle
                      r={14}
                      fill="url(#avatar-gradient)"
                      stroke="#fff"
                      strokeWidth={2.5}
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))' }}
                    />
                    {/* Validator avatar in the center */}
                    <foreignObject
                      x={-12}
                      y={-12}
                      width={24}
                      height={24}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                        <ValidatorAvatar
                          identity={cluster.nodes[0].identity}
                          moniker={cluster.nodes[0].moniker}
                          size="sm"
                        />
                      </div>
                    </foreignObject>
                    {/* Small badge showing count */}
                    <circle
                      cx={10}
                      cy={-10}
                      r={7}
                      fill={hasActive ? '#10b981' : '#f97316'}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                    <text
                      x={10}
                      y={-7}
                      textAnchor="middle"
                      fontSize={8}
                      fontWeight="bold"
                      fill="#fff"
                      className="pointer-events-none"
                    >
                      {cluster.nodes.length}
                    </text>
                  </g>
                ) : (
                  // Show simple marker with better styling
                  <g className="cursor-pointer">
                    {/* Outer pulse ring */}
                    <circle
                      r={10}
                      fill={cluster.nodes[0].status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)'}
                      className="animate-pulse"
                    />
                    {/* Main marker */}
                    <circle
                      r={6}
                      fill={cluster.nodes[0].status === 'active' ? '#10b981' : '#f97316'}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{ filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))' }}
                    />
                  </g>
                )}

                {/* Enhanced Tooltip with Country Name */}
                {!isCluster && hoveredNode?.address === cluster.nodes[0].address && (
                  <g>
                    {/* Tooltip pointer/arrow */}
                    <path
                      d="M 20 -35 L 25 -40 L 30 -35 Z"
                      fill="#1a1a1a"
                    />
                    <rect
                      x={25}
                      y={-100}
                      width={190}
                      height={60}
                      fill="#1a1a1a"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      rx={8}
                      style={{ filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5))' }}
                    />
                    {/* Validator name with flag */}
                    <text
                      x={32}
                      y={-83}
                      fontSize={13}
                      fill="#fff"
                      fontWeight="bold"
                    >
                      {cluster.nodes[0].flag} {cluster.nodes[0].moniker.slice(0, 18)}
                    </text>
                    {/* Country name - highlighted */}
                    <text
                      x={32}
                      y={-67}
                      fontSize={11}
                      fill="#10b981"
                      fontWeight="600"
                    >
                      📍 {cluster.nodes[0].country}
                    </text>
                    {/* City */}
                    <text
                      x={32}
                      y={-53}
                      fontSize={10}
                      fill="#9ca3af"
                    >
                      {cluster.nodes[0].city}
                    </text>
                  </g>
                )}

                {/* Cluster tooltip - simple version */}
                {isCluster && (
                  <g>
                    <rect
                      x={20}
                      y={-50}
                      width={120}
                      height={35}
                      fill="#1a1a1a"
                      stroke={hasActive ? '#10b981' : '#f97316'}
                      strokeWidth={1.5}
                      rx={6}
                      style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))' }}
                    />
                    <text
                      x={27}
                      y={-33}
                      fontSize={11}
                      fill="#fff"
                      fontWeight="600"
                    >
                      {cluster.nodes.length} nodes here
                    </text>
                    <text
                      x={27}
                      y={-20}
                      fontSize={9}
                      fill="#9ca3af"
                    >
                      Click to zoom in
                    </text>
                  </g>
                )}
              </Marker>
            );
          })}

          <defs>
            {/* Smooth gradient for avatars: green to cyan to blue */}
            <linearGradient id="avatar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            {/* Gradient for connection lines */}
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </ZoomableGroup>
      </ComposableMap>

      {/* Validator Info Modal Popup */}
      {selectedNode && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fadeIn"
            onClick={() => setSelectedNode(null)}
          ></div>
          
          {/* Modal - Fixed positioning for true center */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] animate-scaleIn">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-2 border-green-500/50 rounded-2xl shadow-2xl shadow-green-500/20 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="relative p-6 border-b border-gray-800">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-green-500 shadow-lg shadow-green-500/50">
                      <ValidatorAvatar
                        identity={selectedNode.identity}
                        moniker={selectedNode.moniker}
                        size="lg"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{selectedNode.moniker}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Address */}
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">Supernode Address</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-green-400 font-mono break-all">{selectedNode.address}</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(selectedNode.address)}
                      className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Copy address"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Location Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Country</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedNode.flag}</span>
                      <span className="text-sm font-semibold text-white">{selectedNode.country}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">City</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="text-sm font-semibold text-white">{selectedNode.city}</span>
                    </div>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-2">Geographic Coordinates</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Latitude</div>
                      <div className="text-sm font-mono text-blue-400">{selectedNode.lat.toFixed(4)}°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Longitude</div>
                      <div className="text-sm font-mono text-blue-400">{selectedNode.lng.toFixed(4)}°</div>
                    </div>
                  </div>
                </div>

                {/* Resource Usage */}
                {(selectedNode.cpuUsage !== undefined || selectedNode.ramUsage !== undefined || selectedNode.diskUsage !== undefined) && (
                  <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-3">Resource Usage</div>
                    <div className="grid grid-cols-3 gap-4">
                      {/* CPU */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-2">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-gray-800"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - (selectedNode.cpuUsage || 0) / 100)}`}
                              className={`transition-all duration-500 ${
                                (selectedNode.cpuUsage || 0) > 80 ? 'text-red-500' : 
                                (selectedNode.cpuUsage || 0) > 60 ? 'text-orange-500' : 
                                'text-green-500'
                              }`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{Math.round(selectedNode.cpuUsage || 0)}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">CPU</div>
                        {selectedNode.specs?.cpu && (
                          <div className="text-xs text-gray-600">{selectedNode.specs.cpu} cores</div>
                        )}
                      </div>

                      {/* RAM */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-2">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-gray-800"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - (selectedNode.ramUsage || 0) / 100)}`}
                              className={`transition-all duration-500 ${
                                (selectedNode.ramUsage || 0) > 80 ? 'text-red-500' : 
                                (selectedNode.ramUsage || 0) > 60 ? 'text-orange-500' : 
                                'text-blue-500'
                              }`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{Math.round(selectedNode.ramUsage || 0)}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">RAM</div>
                        {selectedNode.specs?.ram && (
                          <div className="text-xs text-gray-600">{selectedNode.specs.ram}GB</div>
                        )}
                      </div>

                      {/* Disk */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-2">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-gray-800"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - (selectedNode.diskUsage || 0) / 100)}`}
                              className={`transition-all duration-500 ${
                                (selectedNode.diskUsage || 0) > 80 ? 'text-red-500' : 
                                (selectedNode.diskUsage || 0) > 60 ? 'text-orange-500' : 
                                'text-purple-500'
                              }`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{Math.round(selectedNode.diskUsage || 0)}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">Disk</div>
                        {selectedNode.specs?.disk && (
                          <div className="text-xs text-gray-600">{selectedNode.specs.disk}TB</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Identity */}
                {selectedNode.identity && (
                  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Keybase Identity</div>
                    <code className="text-xs text-purple-400 font-mono">{selectedNode.identity}</code>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 bg-[#0a0a0a]/50">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reset View Button */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        <button
          onClick={() => { setZoom(2.5); setCenter([15, 50]); }}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          title="Reset View"
        >
          🌍 Reset View
        </button>
      </div>

      {/* Network Stats Panel - Top Left */}
      <div className="absolute top-4 left-4 bg-gradient-to-br from-[#1a1a1a]/95 to-[#0f0f0f]/95 backdrop-blur-md border border-green-500/30 rounded-xl p-4 z-10 pointer-events-none shadow-2xl shadow-green-500/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-sm font-bold text-white">Network Live</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Active Nodes</span>
            <span className="text-lg font-bold text-green-400">{totalNodes}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Countries</span>
            <span className="text-lg font-bold text-blue-400">{uniqueCountries}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Connections</span>
            <span className="text-lg font-bold text-purple-400">{totalConnections}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Network Coverage</div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((uniqueCountries / 50) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Top Countries Panel - Top Right */}
      <div className="absolute top-4 right-4 bg-gradient-to-br from-[#1a1a1a]/95 to-[#0f0f0f]/95 backdrop-blur-md border border-blue-500/30 rounded-xl p-4 z-10 pointer-events-none shadow-2xl shadow-blue-500/10 max-w-xs">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>🌍</span> Top Locations
        </h3>
        <div className="space-y-2">
          {topCountries.map(([country, count], index) => {
            const node = activeSupernodes.find(n => n.country === country);
            return (
              <div key={country} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">#{index + 1}</span>
                  <span className="text-lg">{node?.flag || '🌍'}</span>
                  <span className="text-xs text-white truncate max-w-[100px]">{country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-800 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full"
                      style={{ width: `${(count / topCountries[0][1]) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-green-400 w-6 text-right">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Info - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-gradient-to-br from-[#1a1a1a]/95 to-[#0f0f0f]/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 z-10 pointer-events-none shadow-xl">
        <div className="text-xs text-gray-400 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-green-400">●</span>
            <span className="text-white">Drag to pan map</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">●</span>
            <span className="text-white">Scroll to zoom</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">●</span>
            <span className="text-white">Hover for details</span>
          </div>
        </div>
      </div>

      {/* Legend - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-[#1a1a1a]/95 to-[#0f0f0f]/95 backdrop-blur-md border border-gray-700 rounded-xl px-4 py-3 z-10 pointer-events-none shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
            <span className="text-xs text-white font-medium">Active Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
            <span className="text-xs text-white font-medium">Network Link</span>
          </div>
          {zoom < 3 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                {totalNodes > 10 ? '10+' : totalNodes}
              </div>
              <span className="text-xs text-white font-medium">Cluster</span>
            </div>
          )}
        </div>
      </div>

      {/* Country Hover Tooltip - Enhanced */}
      {hoveredCountry && (
        <div 
          className="absolute bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] backdrop-blur-md border-2 border-green-500/50 rounded-xl px-4 py-3 z-50 pointer-events-none shadow-2xl shadow-green-500/20"
          style={{
            left: `${mousePosition.x + 20}px`,
            top: `${mousePosition.y + 20}px`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-sm font-bold text-white">
              {hoveredCountry.name}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-green-400">
              {hoveredCountry.nodes}
            </div>
            <div className="text-xs text-gray-400">
              active node{hoveredCountry.nodes > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
