import React, { useRef, useEffect, useState } from 'react';
import { Network, ZoomIn, ZoomOut, RefreshCw, Info } from 'lucide-react';

export default function GraphCanvas({ subgraph, fraudPattern, onNodeSelect }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodes = subgraph?.nodes || [];
  const edges = subgraph?.edges || [];

  // Color mapping per vertex type
  const nodeColors = {
    Customer: '#a855f7', // Purple
    Account: '#3b82f6',  // Blue
    Transaction: '#f43f5e', // Rose/Red
    Device: '#06b6d4',   // Cyan
    IP: '#f97316',       // Orange
    Merchant: '#10b981', // Emerald
    FraudCase: '#e11d48', // Crimson
    Evidence: '#8b5cf6', // Violet
    Action: '#ec4899'    // Pink
  };

  // Node position cache
  const posMap = useRef(new Map());

  // Layout positions in circular orbits around center
  useEffect(() => {
    if (!nodes.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width || 600;
    const height = canvas.height || 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const centerNode = nodes.find(n => n.is_center) || nodes[0];
    posMap.current.clear();
    
    if (centerNode) {
      posMap.current.set(centerNode.id, { x: centerX, y: centerY, node: centerNode });
    }

    const otherNodes = nodes.filter(n => n.id !== centerNode?.id);
    const radius = Math.min(width, height) * 0.35;
    
    otherNodes.forEach((node, i) => {
      const angle = (i / Math.max(1, otherNodes.length)) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      posMap.current.set(node.id, { x, y, node });
    });
  }, [nodes]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw Edges
    edges.forEach(edge => {
      const u = posMap.current.get(edge.source);
      const v = posMap.current.get(edge.target);
      if (u && v) {
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Edge label
        const midX = (u.x + v.x) / 2;
        const midY = (u.y + v.y) / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(edge.type || '', midX, midY - 3);
      }
    });

    // Draw Nodes
    posMap.current.forEach((item, id) => {
      const { x, y, node } = item;
      const type = node.type || 'Node';
      const color = nodeColors[type] || '#94a3b8';
      const isSelected = selectedNode?.id === id;
      const isCenter = node.is_center;

      // Glow halo
      ctx.beginPath();
      ctx.arc(x, y, isCenter ? 26 : (isSelected ? 22 : 16), 0, 2 * Math.PI);
      ctx.fillStyle = `${color}22`;
      ctx.fill();

      // Node body
      ctx.beginPath();
      ctx.arc(x, y, isCenter ? 18 : 12, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Label text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = isCenter ? 'bold 11px Inter' : '10px Inter';
      ctx.textAlign = 'center';
      const shortLabel = node.label || id;
      ctx.fillText(shortLabel.length > 18 ? shortLabel.substring(0, 18) + '...' : shortLabel, x, y + (isCenter ? 32 : 24));
    });

    ctx.restore();
  }, [nodes, edges, selectedNode, zoom, offset]);

  // Click handler to select node
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offset.x) / zoom;
    const mouseY = (e.clientY - rect.top - offset.y) / zoom;

    let clicked = null;
    posMap.current.forEach((item) => {
      const dist = Math.hypot(item.x - mouseX, item.y - mouseY);
      if (dist <= 20) {
        clicked = item.node;
      }
    });

    setSelectedNode(clicked);
    if (onNodeSelect) onNodeSelect(clicked);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Interactive TigerGraph Investigation Network
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {nodes.length} Vertices • {edges.length} Edges
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.2))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Reset View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative flex-1 w-full bg-[#0a0f1d] rounded-xl border border-slate-900 overflow-hidden min-h-[360px]">
        <canvas
          ref={canvasRef}
          width={650}
          height={400}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] backdrop-blur-sm">
          {Object.entries(nodeColors).slice(0, 6).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400 font-medium">{type}</span>
            </div>
          ))}
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-2 right-2 max-w-xs p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1">
                <Info className="w-3 h-3 text-cyan-400" />
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-slate-300 font-mono text-sm"
              >
                ×
              </button>
            </div>
            <p className="font-mono text-cyan-400 font-semibold mb-1 text-[11px] truncate">
              {selectedNode.attributes?.id || selectedNode.id}
            </p>
            <div className="space-y-1 text-[10px] text-slate-300 max-h-36 overflow-y-auto">
              {Object.entries(selectedNode.attributes || {})
                .filter(([k]) => !k.startsWith('_') && k !== 'id')
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-slate-900 pb-0.5">
                    <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                    <span className="font-mono text-slate-200 truncate">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
