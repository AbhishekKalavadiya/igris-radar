'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Network, 
  Shield, 
  Lock, 
  Globe, 
  Server, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  X,
  Layers,
  Package,
  Cpu,
  UserCheck,
  Radio,
  Crosshair,
  FileCheck,
  Code,
  FileText,
  LayoutGrid,
  GitBranch,
  Target,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Move
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Category icon lookup
 */
function getCategoryIcon(catName = '') {
  const name = catName.toLowerCase();
  if (name.includes('ssl') || name.includes('tls')) return Lock;
  if (name.includes('header')) return Shield;
  if (name.includes('dns') || name.includes('domain')) return Server;
  if (name.includes('secret') || name.includes('info')) return Key;
  if (name.includes('supply') || name.includes('chain')) return Package;
  if (name.includes('dependen')) return Cpu;
  if (name.includes('auth')) return UserCheck;
  if (name.includes('active') || name.includes('prob')) return Crosshair;
  if (name.includes('client') || name.includes('js')) return Code;
  if (name.includes('reputation')) return Radio;
  if (name.includes('compliance')) return FileCheck;
  if (name.includes('content') || name.includes('data')) return FileText;
  return Layers;
}

/**
 * Checks if a specific finding is locked for the user's current plan tier.
 */
function isFindingLocked(finding, userPlan) {
  if (!finding) return false;
  if (userPlan === 'pro' || userPlan === 'admin' || userPlan === 'owner') return false;
  if (finding.locked) return true;
  if (userPlan === 'free' && (finding.tier === 'starter' || finding.tier === 'pro')) return true;
  if (userPlan === 'starter' && finding.tier === 'pro') return true;
  return false;
}

/**
 * Builds topology graph dataset.
 */
function buildTopologyGraph(scanResult, userPlan = 'free', layoutMode = 'orbit', focusedCatName = null) {
  if (!scanResult) return { nodes: [], links: [], baseWidth: 1400, baseHeight: 900 };

  const url = scanResult.url || 'target.com';
  let domain = url;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    domain = parsed.hostname;
  } catch (e) {
    domain = url;
  }

  const findings = scanResult.findings || [];

  const categoryMap = new Map();
  findings.forEach((f) => {
    const cat = f.category || 'General Security';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat).push(f);
  });

  if (Array.isArray(scanResult.categories)) {
    scanResult.categories.forEach((catObj) => {
      const name = typeof catObj === 'string' ? catObj : catObj.name;
      if (name && !categoryMap.has(name)) {
        categoryMap.set(name, []);
      }
    });
  }

  const categories = Array.from(categoryMap.keys());
  const numCat = categories.length || 1;

  const nodes = [];
  const links = [];

  // FOCUSED CATEGORY DRILL-DOWN MODE
  if (focusedCatName && categoryMap.has(focusedCatName)) {
    const cx = 700;
    const cy = 450;

    const catFindings = categoryMap.get(focusedCatName) || [];
    const IconComponent = getCategoryIcon(focusedCatName);

    const hasCritical = catFindings.some((f) => f.severity === 'critical' || f.severity === 'high');
    const hasWarning = catFindings.some((f) => f.severity === 'warning' || f.severity === 'medium');
    const status = hasCritical ? 'critical' : hasWarning ? 'warning' : 'pass';

    const catId = `focus-cat-root`;
    nodes.push({
      id: catId,
      label: focusedCatName,
      subtitle: `${catFindings.length} findings evaluated`,
      type: 'root',
      category: focusedCatName,
      score: scanResult.score,
      status,
      icon: IconComponent,
      details: {
        category: focusedCatName,
        findingsCount: catFindings.length,
        findings: catFindings,
      },
      x: cx,
      y: cy,
    });

    const R_findings = 330;
    const numF = catFindings.length || 1;

    catFindings.forEach((finding, fIdx) => {
      const fNodeId = `focus-finding-${fIdx}`;
      const angle = (2 * Math.PI * fIdx) / numF - Math.PI / 2;

      const fX = Math.round(cx + R_findings * Math.cos(angle));
      const fY = Math.round(cy + R_findings * Math.sin(angle));

      const locked = isFindingLocked(finding, userPlan);
      const fStatus = locked
        ? 'locked'
        : finding.passed
        ? 'pass'
        : (finding.severity === 'critical' || finding.severity === 'high')
        ? 'critical'
        : 'warning';

      nodes.push({
        id: fNodeId,
        label: locked ? `🔒 Pro Finding` : (finding.title || 'Security Check'),
        subtitle: locked ? 'Requires Pro Tier' : `Severity: ${finding.severity || 'info'}`,
        type: 'finding',
        category: focusedCatName,
        status: fStatus,
        isLocked: locked,
        icon: locked ? Lock : finding.passed ? CheckCircle2 : AlertTriangle,
        details: { ...finding, locked },
        x: fX,
        y: fY,
      });

      links.push({
        source: catId,
        target: fNodeId,
        status: fStatus,
      });
    });

    return { nodes, links, baseWidth: 1400, baseHeight: 900 };
  }

  // LAYOUT MODE 1: CONCENTRIC STAGGERED ORBIT
  if (layoutMode === 'orbit') {
    const cx = 700;
    const cy = 450;

    const rootId = 'node-root';
    nodes.push({
      id: rootId,
      label: domain,
      subtitle: 'Target Domain',
      type: 'root',
      category: 'Root Domain',
      score: scanResult.score,
      status: scanResult.score >= 70 ? 'pass' : scanResult.score >= 40 ? 'warning' : 'critical',
      icon: Globe,
      details: {
        url: scanResult.url,
        scannedAt: scanResult.scannedAt || new Date().toISOString(),
        score: scanResult.score,
        totalFindings: findings.length,
      },
      x: cx,
      y: cy,
    });

    categories.forEach((catName, idx) => {
      const catId = `cat-node-${idx}`;
      const catFindings = categoryMap.get(catName) || [];
      const IconComponent = getCategoryIcon(catName);

      const hasCritical = catFindings.some((f) => f.severity === 'critical' || f.severity === 'high');
      const hasWarning = catFindings.some((f) => f.severity === 'warning' || f.severity === 'medium');
      const hasLocked = catFindings.some((f) => isFindingLocked(f, userPlan));

      const status = hasCritical ? 'critical' : hasWarning ? 'warning' : 'pass';

      const ring = idx % 2 === 0 ? 270 : 420;
      const angle = (2 * Math.PI * idx) / numCat - Math.PI / 2;

      const catX = Math.round(cx + ring * Math.cos(angle));
      const catY = Math.round(cy + ring * Math.sin(angle));

      nodes.push({
        id: catId,
        label: catName,
        subtitle: `${catFindings.length} findings${hasLocked ? ' 🔒' : ''}`,
        type: 'infrastructure',
        category: catName,
        status,
        hasLocked,
        icon: IconComponent,
        details: {
          category: catName,
          findingsCount: catFindings.length,
          findings: catFindings,
        },
        x: catX,
        y: catY,
      });

      links.push({
        source: rootId,
        target: catId,
        status,
      });
    });

    return { nodes, links, baseWidth: 1400, baseHeight: 900 };
  }

  // LAYOUT MODE 2: HIERARCHICAL TREE FLOW
  if (layoutMode === 'tree') {
    const height = Math.max(800, numCat * 60);

    const rootId = 'node-root';
    nodes.push({
      id: rootId,
      label: domain,
      subtitle: 'Target Domain',
      type: 'root',
      category: 'Root Domain',
      score: scanResult.score,
      status: scanResult.score >= 70 ? 'pass' : scanResult.score >= 40 ? 'warning' : 'critical',
      icon: Globe,
      details: {
        url: scanResult.url,
        scannedAt: scanResult.scannedAt || new Date().toISOString(),
        score: scanResult.score,
        totalFindings: findings.length,
      },
      x: 180,
      y: height / 2,
    });

    categories.forEach((catName, idx) => {
      const catId = `cat-node-${idx}`;
      const catFindings = categoryMap.get(catName) || [];
      const IconComponent = getCategoryIcon(catName);

      const hasCritical = catFindings.some((f) => f.severity === 'critical' || f.severity === 'high');
      const hasWarning = catFindings.some((f) => f.severity === 'warning' || f.severity === 'medium');
      const hasLocked = catFindings.some((f) => isFindingLocked(f, userPlan));
      const status = hasCritical ? 'critical' : hasWarning ? 'warning' : 'pass';

      const startY = 70;
      const stepY = (height - 140) / Math.max(numCat - 1, 1);
      const catY = Math.round(startY + idx * stepY);
      const catX = 650;

      nodes.push({
        id: catId,
        label: catName,
        subtitle: `${catFindings.length} findings${hasLocked ? ' 🔒' : ''}`,
        type: 'infrastructure',
        category: catName,
        status,
        hasLocked,
        icon: IconComponent,
        details: {
          category: catName,
          findingsCount: catFindings.length,
          findings: catFindings,
        },
        x: catX,
        y: catY,
      });

      links.push({
        source: rootId,
        target: catId,
        status,
      });
    });

    return { nodes, links, baseWidth: 1400, baseHeight: height };
  }

  // LAYOUT MODE 3: CLUSTER GRID MATRIX
  const cols = 4;
  const rows = Math.ceil(numCat / cols);
  const gridWidth = 1400;
  const gridHeight = Math.max(700, rows * 190 + 160);

  const rootId = 'node-root';
  nodes.push({
    id: rootId,
    label: domain,
    subtitle: 'Target Domain',
    type: 'root',
    category: 'Root Domain',
    score: scanResult.score,
    status: scanResult.score >= 70 ? 'pass' : scanResult.score >= 40 ? 'warning' : 'critical',
    icon: Globe,
    details: {
      url: scanResult.url,
      scannedAt: scanResult.scannedAt || new Date().toISOString(),
      score: scanResult.score,
      totalFindings: findings.length,
    },
    x: gridWidth / 2,
    y: 80,
  });

  categories.forEach((catName, idx) => {
    const catId = `cat-node-${idx}`;
    const catFindings = categoryMap.get(catName) || [];
    const IconComponent = getCategoryIcon(catName);

    const hasCritical = catFindings.some((f) => f.severity === 'critical' || f.severity === 'high');
    const hasWarning = catFindings.some((f) => f.severity === 'warning' || f.severity === 'medium');
    const hasLocked = catFindings.some((f) => isFindingLocked(f, userPlan));
    const status = hasCritical ? 'critical' : hasWarning ? 'warning' : 'pass';

    const cCol = idx % cols;
    const cRow = Math.floor(idx / cols);

    const catX = Math.round(180 + cCol * (gridWidth - 360) / (cols - 1));
    const catY = Math.round(220 + cRow * 170);

    nodes.push({
      id: catId,
      label: catName,
      subtitle: `${catFindings.length} findings${hasLocked ? ' 🔒' : ''}`,
      type: 'infrastructure',
      category: catName,
      status,
      hasLocked,
      icon: IconComponent,
      details: {
        category: catName,
        findingsCount: catFindings.length,
        findings: catFindings,
      },
      x: catX,
      y: catY,
    });

    links.push({
      source: rootId,
      target: catId,
      status,
    });
  });

  return { nodes, links, baseWidth: gridWidth, baseHeight: gridHeight };
}

export default function SecurityGraphView({ scanResult, userPlan = 'free', onUnlockClick }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedNode, setSelectedNode] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [layoutMode, setLayoutMode] = useState('orbit');
  const [focusedCatName, setFocusedCatName] = useState(null);

  const { nodes, links, baseWidth, baseHeight } = useMemo(
    () => buildTopologyGraph(scanResult, userPlan, layoutMode, focusedCatName),
    [scanResult, userPlan, layoutMode, focusedCatName]
  );

  // Wheel zoom handler using Callback Ref pattern to guarantee listener attachment across re-renders
  const handleWheelNative = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.4), 2.5));
  }, []);

  const setContainerRef = useCallback(
    (node) => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheelNative);
      }
      if (node) {
        node.addEventListener('wheel', handleWheelNative, { passive: false });
        containerRef.current = node;
      }
    },
    [handleWheelNative]
  );

  // Calculate dynamic SVG viewBox based on zoom and pan offset
  const dynamicViewBox = useMemo(() => {
    const currentW = baseWidth / zoom;
    const currentH = baseHeight / zoom;
    const currentX = (baseWidth - currentW) / 2 - pan.x / zoom;
    const currentY = (baseHeight - currentH) / 2 - pan.y / zoom;
    return `${currentX} ${currentY} ${currentW} ${currentH}`;
  }, [baseWidth, baseHeight, zoom, pan.x, pan.y]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // The Central Root Domain node ALWAYS stays visible as the topology anchor!
      if (node.type === 'root') return true;

      if (filterSeverity === 'critical' && node.status !== 'critical') return false;
      if (filterSeverity === 'warning' && node.status !== 'warning') return false;
      if (filterSeverity === 'pass' && node.status !== 'pass') return false;
      if (filterSeverity === 'infra' && node.type !== 'infrastructure') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = node.label.toLowerCase().includes(q);
        const matchSub = node.subtitle.toLowerCase().includes(q);
        const matchCat = (node.category || '').toLowerCase().includes(q);
        return matchLabel || matchSub || matchCat;
      }
      return true;
    });
  }, [nodes, filterSeverity, searchQuery]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.4));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    const isNode = e.target.closest?.('.topology-node');
    if (isNode) return;

    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleNodeClick = (node, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedNode(node);
  };

  const handleDrilldownCategory = (catName) => {
    setFocusedCatName(catName);
  };

  const handleClearFocus = () => {
    setFocusedCatName(null);
  };

  if (!scanResult) {
    return (
      <Card className="glass-card py-12 text-center text-muted-foreground">
        <Network className="h-10 w-10 mx-auto mb-3 opacity-40 animate-pulse" />
        <p className="text-sm font-medium">Run a security scan to view the Attack Surface Topology graph.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Header Toolbar */}
      <Card className="glass-panel border-border p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
              {focusedCatName ? `Category Focus: ${focusedCatName}` : 'Attack Surface Classifier Topology'}
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                ACTIVE ZOOM CANVAS
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3 inline text-primary" /> Drag background to pan • Scroll mouse roller anywhere on canvas to zoom map • Click nodes to inspect.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {!focusedCatName && (
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
              <button
                onClick={() => setLayoutMode('orbit')}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  layoutMode === 'orbit'
                    ? 'bg-background text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Concentric Radar View"
              >
                <Target className="h-3.5 w-3.5" /> Orbit
              </button>
              <button
                onClick={() => setLayoutMode('tree')}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  layoutMode === 'tree'
                    ? 'bg-background text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Hierarchical Column Flow"
              >
                <GitBranch className="h-3.5 w-3.5" /> Tree
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all font-medium flex items-center gap-1.5 ${
                  layoutMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid Matrix View"
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
            </div>
          )}

          {/* Search Filter */}
          <div className="relative w-40 sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background/50 border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2 py-1 text-[11px] rounded-md transition-all font-medium ${
                filterSeverity === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({nodes.length})
            </button>
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-2 py-1 text-[11px] rounded-md transition-all font-medium ${
                filterSeverity === 'critical'
                  ? 'bg-destructive/20 text-destructive'
                  : 'text-muted-foreground hover:text-destructive'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilterSeverity('warning')}
              className={`px-2 py-1 text-[11px] rounded-md transition-all font-medium ${
                filterSeverity === 'warning'
                  ? 'bg-warning/20 text-warning'
                  : 'text-muted-foreground hover:text-warning'
              }`}
            >
              Warnings
            </button>
          </div>

          {/* Zoom & Pan Reset Controls */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono w-9 text-center text-muted-foreground font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetZoom} title="Reset View & Position">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Canvas + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* SVG Interactive Topology Canvas */}
        <Card 
          ref={setContainerRef}
          className="glass-card lg:col-span-3 border-border relative overflow-hidden bg-[#07090e]/95 min-h-[640px] flex items-center justify-center shadow-2xl"
        >
          {/* Back to Full Topology Button inside the Canvas Card */}
          {focusedCatName && (
            <div className="absolute top-4 left-4 z-20">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFocus}
                className="gap-1.5 text-xs bg-slate-900/90 border-slate-700 text-primary hover:bg-slate-800 shadow-xl backdrop-blur-md"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Full Topology
              </Button>
            </div>
          )}

          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '28px 28px'
            }}
          />

          <svg
            className={`w-full h-[640px] select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            viewBox={dynamicViewBox}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <filter id="glow-root" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Links / Edges */}
            <g className="edges">
              {links.map((link, idx) => {
                const sourceNode = nodes.find((n) => n.id === link.source);
                const targetNode = nodes.find((n) => n.id === link.target);

                if (!sourceNode || !targetNode) return null;
                if (!activeNodeIds.has(sourceNode.id) || !activeNodeIds.has(targetNode.id)) return null;

                const isHovered = hoveredNode === sourceNode.id || hoveredNode === targetNode.id;
                const isCritical = link.status === 'critical';
                const isWarning = link.status === 'warning';
                const isLocked = link.status === 'locked';

                const strokeColor = isLocked
                  ? '#a855f7'
                  : isCritical
                  ? '#ef4444'
                  : isWarning
                  ? '#f59e0b'
                  : '#10b981';

                let pathD = '';
                if (layoutMode === 'tree' && !focusedCatName) {
                  const midX = (sourceNode.x + targetNode.x) / 2;
                  pathD = `M ${sourceNode.x} ${sourceNode.y} C ${midX} ${sourceNode.y}, ${midX} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`;
                } else {
                  const dx = targetNode.x - sourceNode.x;
                  const dy = targetNode.y - sourceNode.y;
                  const cx1 = sourceNode.x + dx * 0.4;
                  const cy1 = sourceNode.y + dy * 0.1;
                  const cx2 = sourceNode.x + dx * 0.6;
                  const cy2 = targetNode.y - dy * 0.1;
                  pathD = `M ${sourceNode.x} ${sourceNode.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetNode.x} ${targetNode.y}`;
                }

                return (
                  <g key={`link-${idx}`}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHovered ? 2.5 : 1.2}
                      strokeOpacity={isHovered ? 0.9 : 0.35}
                      strokeDasharray={isCritical || isLocked ? '4 4' : 'none'}
                    />
                    <circle r="2.5" fill={strokeColor}>
                      <animateMotion
                        path={pathD}
                        dur={`${2.5 + (idx % 4) * 0.8}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const IconComponent = node.icon;

                let badgeColor = '#10b981';
                let strokeColor = 'rgba(16, 185, 129, 0.4)';
                let bgColor = 'rgba(16, 185, 129, 0.12)';

                if (node.status === 'critical') {
                  badgeColor = '#ef4444';
                  strokeColor = 'rgba(239, 68, 68, 0.6)';
                  bgColor = 'rgba(239, 68, 68, 0.18)';
                } else if (node.status === 'warning') {
                  badgeColor = '#f59e0b';
                  strokeColor = 'rgba(245, 158, 11, 0.6)';
                  bgColor = 'rgba(245, 158, 11, 0.18)';
                } else if (node.status === 'locked' || node.isLocked) {
                  badgeColor = '#a855f7';
                  strokeColor = 'rgba(168, 85, 247, 0.6)';
                  bgColor = 'rgba(168, 85, 247, 0.18)';
                }

                // ROOT DOMAIN NODE
                if (node.type === 'root') {
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="topology-node cursor-pointer"
                      onClick={(e) => handleNodeClick(node, e)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      filter="url(#glow-root)"
                    >
                      <circle
                        r={44}
                        fill="#0d1117"
                        stroke={node.status === 'critical' ? '#ef4444' : '#3b82f6'}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      <circle
                        r={52}
                        fill="none"
                        stroke={node.status === 'critical' ? '#ef4444' : '#3b82f6'}
                        strokeWidth={1}
                        strokeOpacity={0.4}
                        strokeDasharray="4 4"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="20s"
                          repeatCount="indefinite"
                        />
                      </circle>

                      <foreignObject x="-24" y="-24" width="48" height="48" style={{ pointerEvents: 'none' }}>
                        <div className="w-full h-full flex items-center justify-center text-primary">
                          <Globe className="h-7 w-7 text-blue-400" />
                        </div>
                      </foreignObject>

                      <foreignObject x="-90" y="56" width="180" height="50" style={{ pointerEvents: 'none' }}>
                        <div className="text-center">
                          <div className="text-xs font-bold text-slate-100 truncate px-2 py-1 bg-slate-900/90 rounded-md border border-slate-700/80 shadow-md">
                            {node.label}
                          </div>
                          <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                            Score: {node.score}/100
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                }

                // INFRASTRUCTURE / CLASSIFIER NODE
                if (node.type === 'infrastructure') {
                  const width = 142;
                  const height = 40;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="topology-node cursor-pointer"
                      onClick={(e) => handleNodeClick(node, e)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <rect
                        x={-width / 2}
                        y={-height / 2}
                        width={width}
                        height={height}
                        rx="8"
                        fill="#0f172a"
                        stroke={isSelected ? '#60a5fa' : strokeColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      <foreignObject
                        x={-width / 2 + 6}
                        y={-height / 2 + 4}
                        width={width - 12}
                        height={height - 8}
                        style={{ pointerEvents: 'none' }}
                      >
                        <div className="flex items-center gap-2 h-full">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: bgColor }}
                          >
                            <IconComponent className="h-3.5 w-3.5" style={{ color: badgeColor }} />
                          </div>
                          <div className="overflow-hidden text-left">
                            <div className="text-[10px] font-semibold text-slate-200 leading-tight truncate flex items-center justify-between">
                              <span>{node.label}</span>
                              {node.hasLocked && <Lock className="h-2.5 w-2.5 text-warning inline ml-1" />}
                            </div>
                            <div className="text-[8px] text-slate-400 truncate">
                              {node.subtitle}
                            </div>
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                }

                // SUB-FINDING NODE
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="topology-node cursor-pointer"
                    onClick={(e) => handleNodeClick(node, e)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle
                      r={14}
                      fill="#1e293b"
                      stroke={isSelected ? '#60a5fa' : strokeColor}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <foreignObject x="-9" y="-9" width="18" height="18" style={{ pointerEvents: 'none' }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <IconComponent className="h-3.5 w-3.5" style={{ color: badgeColor }} />
                      </div>
                    </foreignObject>
                    <foreignObject x="-75" y="16" width="150" height="35" style={{ pointerEvents: 'none' }}>
                      <div className="text-center">
                        <div className={`text-[10px] font-medium truncate px-1.5 py-0.5 rounded border ${
                          node.isLocked
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                            : 'bg-slate-950/80 text-slate-200 border-slate-800'
                        }`}>
                          {node.label}
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Canvas Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-4 text-[10px] text-slate-400 pointer-events-none">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Secure / Passed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical Exposure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Pro Tier Finding
            </span>
          </div>
        </Card>

        {/* Node Detail Drawer / Info Sidebar */}
        <Card className="glass-card lg:col-span-1 border-border p-4 h-[640px] flex flex-col justify-between overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <selectedNode.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        selectedNode.isLocked || selectedNode.status === 'locked'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : selectedNode.status === 'critical'
                          ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : selectedNode.status === 'warning'
                          ? 'bg-warning/10 text-warning border-warning/30'
                          : 'bg-success/10 text-success border-success/30'
                      }`}
                    >
                      {selectedNode.isLocked ? 'PRO LOCKED' : selectedNode.status}
                    </Badge>
                    <h4 className="text-sm font-bold text-foreground mt-0.5 line-clamp-1">
                      {selectedNode.label}
                    </h4>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Node Details Content */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Classifier / Category
                  </span>
                  <p className="font-mono text-foreground font-medium mt-0.5">
                    {selectedNode.category || selectedNode.type}
                  </p>
                </div>

                {selectedNode.type === 'infrastructure' && (
                  <Button
                    size="sm"
                    className="w-full gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleDrilldownCategory(selectedNode.category)}
                  >
                    Drill Down to Sub-Checks <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                {/* Single Locked Finding Inspector Card */}
                {selectedNode.isLocked ? (
                  <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 space-y-3">
                    <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                      <Lock className="h-4 w-4 text-purple-400" /> Pro Tier Finding Locked
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed filter blur-xs select-none">
                      This finding contains high-priority vulnerability disclosure details, root cause analysis, and explicit code patches available on the Pro plan.
                    </p>
                    <Button
                      size="sm"
                      className="w-full gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      onClick={() => onUnlockClick?.(selectedNode.details)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Upgrade to Pro to Unlock
                    </Button>
                  </div>
                ) : (
                  <>
                    {selectedNode.details?.description && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Description
                        </span>
                        <p className="text-muted-foreground mt-0.5 leading-relaxed">
                          {selectedNode.details.description}
                        </p>
                      </div>
                    )}

                    {selectedNode.details?.remediation && (
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Recommended Remediation
                        </span>
                        <p className="text-muted-foreground mt-1 leading-normal text-[11px]">
                          {selectedNode.details.remediation}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Category Findings List in Drawer */}
                {selectedNode.details?.findings && selectedNode.details.findings.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Category Findings ({selectedNode.details.findings.length})
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedNode.details.findings.map((f, i) => {
                        const locked = isFindingLocked(f, userPlan);
                        return (
                          <div
                            key={i}
                            className={`p-2.5 rounded border transition-all ${
                              locked
                                ? 'bg-purple-950/20 border-purple-800/40'
                                : 'bg-background border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="overflow-hidden flex-1">
                                {locked ? (
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-300">
                                    <Lock className="h-3 w-3 text-purple-400 shrink-0" />
                                    <span className="filter blur-xs select-none">High Severity Disclosure</span>
                                  </div>
                                ) : (
                                  <div className="font-medium text-[11px] truncate text-foreground">
                                    {f.title}
                                  </div>
                                )}
                                <div className="text-[9px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <span>Severity: {f.severity}</span>
                                  {locked && <Badge className="text-[8px] px-1 py-0 bg-purple-500/20 text-purple-300 border-purple-500/30">PRO</Badge>}
                                </div>
                              </div>
                              {locked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[9px] px-2 text-purple-300 hover:text-white hover:bg-purple-900/50"
                                  onClick={() => onUnlockClick?.(f)}
                                >
                                  Unlock
                                </Button>
                              ) : f.passed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Node Inspector</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Click any classifier node to view findings or click <b>Drill Down</b> to view sub-checks cleanly.
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-3 mt-auto">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Total Network Nodes:</span>
              <span className="font-mono font-bold text-foreground">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>Evaluated Links:</span>
              <span className="font-mono font-bold text-foreground">{links.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
