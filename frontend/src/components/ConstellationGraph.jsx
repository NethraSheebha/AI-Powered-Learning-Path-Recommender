import { useCallback, useRef, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

const NODE_COLORS = {
  locked: '#2A3040',
  available: '#6C9CFC',
  mastered: '#F0A050',
};

const EDGE_COLORS = {
  locked: 'rgba(139,149,165,0.18)',
  available: 'rgba(108,156,252,0.55)',
  mastered: 'rgba(240,160,80,0.85)',
};

function formatNodeLabel(rawLabel) {
  if (!rawLabel) return '';
  if (rawLabel.includes(':')) {
    const parts = rawLabel.split(':');
    return parts.slice(1).join(':').trim();
  }
  return rawLabel.trim();
}

function edgeStatus(sourceNode, targetNode) {
  if (sourceNode?.status === 'mastered' && targetNode?.status === 'mastered') return 'mastered';
  if (sourceNode?.status !== 'locked' || targetNode?.status !== 'locked') return 'available';
  return 'locked';
}

function syncLabelVisibility(scene, hoveredId, selectedId) {
  if (!scene) return;
  scene.traverse((obj) => {
    if (obj.userData?.isNodeLabel) {
      obj.visible = obj.userData.nodeId === hoveredId || obj.userData.nodeId === selectedId;
    }
  });
}

export default function ConstellationGraph({ graphData, onNodeClick }) {
  const fgRef = useRef();
  const hoverIdRef = useRef(null);
  const pendingMutation = useStore((s) => s.pendingMutation);
  const clearPendingMutation = useStore((s) => s.clearPendingMutation);
  const selectedNodeId = useStore((s) => s.selectedNodeId);

  const fgData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    const nodes = graphData.nodes.map((n) => ({
      id: n.id,
      label: n.label || n.id,
      cleanLabel: formatNodeLabel(n.label || n.id),
      status: n.status || 'locked',
      pMastery: n.p_mastery || 0,
      description: n.description || '',
    }));

    const links = (graphData.edges || []).map((e) => ({
      source: e.from_node_id,
      target: e.to_node_id,
    }));

    return { nodes, links };
  }, [graphData]);

  const nodeMap = useMemo(() => {
    const m = {};
    fgData.nodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [fgData.nodes]);

  const nodeThreeObject = useCallback((node) => {
    const status = node.status || 'locked';
    const radius = status === 'mastered' ? 6 : status === 'available' ? 5.5 : 4;

    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(NODE_COLORS[status]),
      emissive: status === 'mastered'
        ? new THREE.Color('#F59E0B')
        : status === 'available'
        ? new THREE.Color('#3B82F6')
        : new THREE.Color('#000000'),
      emissiveIntensity: status === 'mastered' ? 0.9 : status === 'available' ? 0.5 : 0,
      roughness: status === 'locked' ? 0.7 : 0.2,
      metalness: status === 'locked' ? 0.2 : 0.5,
      clearcoat: status === 'locked' ? 0.0 : 0.4,
      clearcoatRoughness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    const text = node.cleanLabel || node.label || node.id;
    ctx.font = '500 28px Exo, sans-serif';
    ctx.fillStyle = status === 'locked' ? '#8B95A5' : status === 'mastered' ? '#F0A050' : '#E2E8F0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(11, 14, 20, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(36, 9, 1);
    sprite.position.set(0, radius + 7, 0);
    sprite.visible = false;
    sprite.userData.isNodeLabel = true;
    sprite.userData.nodeId = node.id;

    const group = new THREE.Group();
    group.add(mesh);
    group.add(sprite);

    if (status === 'available') {
      const glowGeo = new THREE.SphereGeometry(radius + 2, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#6C9CFC'),
        transparent: true,
        opacity: 0.2,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.userData.isPulseGlow = true;
      group.add(glowMesh);
    }

    return group;
  }, []);

  const linkColor = useCallback((link) => {
    const src = nodeMap[typeof link.source === 'object' ? link.source.id : link.source];
    const tgt = nodeMap[typeof link.target === 'object' ? link.target.id : link.target];
    return EDGE_COLORS[edgeStatus(src, tgt)];
  }, [nodeMap]);

  const linkWidth = useCallback((link) => {
    const src = nodeMap[typeof link.source === 'object' ? link.source.id : link.source];
    const tgt = nodeMap[typeof link.target === 'object' ? link.target.id : link.target];
    const s = edgeStatus(src, tgt);
    return s === 'mastered' ? 2 : s === 'available' ? 1.2 : 0.6;
  }, [nodeMap]);

  const fitCamera = useCallback((ms = 600, padding = 140) => {
    if (fgRef.current && fgData.nodes.length > 0) {
      fgRef.current.zoomToFit(ms, padding);
    }
  }, [fgData.nodes.length]);

  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;

    const charge = fg.d3Force('charge');
    if (charge) charge.strength(-280).distanceMax(600);
    const link = fg.d3Force('link');
    if (link) link.distance(110).strength(0.35);
    const collide = fg.d3Force('collide');
    if (collide) collide.radius(18);

    const scene = fg.scene();
    if (scene) {
      scene.background = new THREE.Color('#0B0E14');
      const lightExists = scene.children.some((c) => c.type === 'DirectionalLight');
      if (!lightExists) {
        scene.add(new THREE.AmbientLight(0x8B95A5, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
        dirLight.position.set(100, 150, 180);
        scene.add(dirLight);
        const pointLight1 = new THREE.PointLight(0x6C9CFC, 2.0, 500);
        pointLight1.position.set(-100, 100, 100);
        scene.add(pointLight1);
        const pointLight2 = new THREE.PointLight(0xF0A050, 1.2, 500);
        pointLight2.position.set(100, -100, -50);
        scene.add(pointLight2);
      }
    }
  }, [fgData]);

  useEffect(() => {
    if (!fgRef.current) return;
    syncLabelVisibility(fgRef.current.scene(), hoverIdRef.current, selectedNodeId);
  }, [selectedNodeId, fgData]);

  useEffect(() => {
    let frameId;
    function animate() {
      if (!fgRef.current) return;
      const time = Date.now() * 0.001;
      const scene = fgRef.current.scene();
      if (scene) {
        scene.traverse((obj) => {
          if (obj.userData?.isPulseGlow) {
            obj.material.opacity = 0.12 + Math.sin(time * 2.5) * 0.08;
          }
        });
      }
      frameId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!pendingMutation || !fgRef.current) return;

    const { nodesAdded, edgesAdded } = pendingMutation;
    if (!nodesAdded?.length) {
      clearPendingMutation();
      return;
    }

    const timeout = setTimeout(() => {
      if (fgRef.current) {
        const targetNodeId = edgesAdded?.[0]?.to_node_id;
        if (targetNodeId) {
          const targetObj = fgData.nodes.find((n) => n.id === targetNodeId);
          if (targetObj) {
            fgRef.current.cameraPosition(
              { x: (targetObj.x || 0) + 40, y: (targetObj.y || 0) + 20, z: (targetObj.z || 0) + 70 },
              { x: targetObj.x || 0, y: targetObj.y || 0, z: targetObj.z || 0 },
              1200
            );
          }
        }
        setTimeout(() => fitCamera(800, 140), 1600);
      }
      clearPendingMutation();
    }, 500);

    return () => clearTimeout(timeout);
  }, [pendingMutation, clearPendingMutation, fgData.nodes, fitCamera]);

  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) onNodeClick(node);
    if (fgRef.current) {
      const dist = 90;
      fgRef.current.cameraPosition(
        { x: (node.x || 0) + dist * 0.4, y: (node.y || 0) + dist * 0.2, z: (node.z || 0) + dist },
        { x: node.x, y: node.y, z: node.z },
        800
      );
    }
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node) => {
    hoverIdRef.current = node?.id || null;
    if (fgRef.current) {
      syncLabelVisibility(fgRef.current.scene(), hoverIdRef.current, selectedNodeId);
    }
  }, [selectedNodeId]);

  if (!graphData || !fgData.nodes.length) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--void)', color: 'var(--stardust)' }}>
        No graph data loaded.
      </div>
    );
  }

  return (
    <div className="constellation-wrap">
      <ForceGraph3D
        ref={fgRef}
        graphData={fgData}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={1}
        linkDirectionalParticles={0}
        backgroundColor="#0B0E14"
        showNavInfo={false}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onEngineStop={() => fitCamera(500, 160)}
        nodeLabel={() => ''}
        cooldownTicks={120}
        cooldownTime={4000}
        d3AlphaDecay={0.022}
        d3VelocityDecay={0.3}
        warmupTicks={40}
        enableNodeDrag={false}
      />
      <style>{`
        .constellation-wrap {
          position: absolute;
          inset: 0;
          background: var(--void);
          overflow: hidden;
        }
        .constellation-wrap canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }
        .scene-nav-info,
        .graph-info-msg,
        .click-to-interact {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
