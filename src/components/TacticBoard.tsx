import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Arrow, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Player } from '../types';
import { Trash2, MousePointer2, Pencil, ArrowUpRight, Square, Circle as CircleIcon, Type, Eraser, Plus, UserCircle2, Download, Save as SaveIcon, FolderOpen, Maximize2, Minimize2, Layout, Flag } from 'lucide-react';
import { useCollectionSync } from '../hooks/useCollectionSync';
import { useSyncedState } from '../hooks/useSyncedState';
import { isPlayer } from '../utils/playerSorting';

const URLImage = ({ imageUrl, x, y, width, height, onDragEnd, onClick, onDblClick, draggable }: any) => {
  const [img] = useImage(imageUrl);
  return (
    <KonvaImage
      image={img}
      x={x}
      y={y}
      width={width || 60}
      height={height || 80}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onDblClick={onDblClick}
      stroke="white"
      strokeWidth={2}
      cornerRadius={4}
      shadowBlur={5}
    />
  );
};

interface TacticElement {
  id: string;
  type: 'player' | 'shape' | 'text' | 'line' | 'material' | 'photo';
  x: number;
  y: number;
  color?: string;
  text?: string;
  points?: number[];
  shapeType?: 'rect' | 'circle' | 'arrow';
  playerData?: Player;
  materialType?: string;
  imageUrl?: string;
  radius?: number;
  width?: number;
  height?: number;
}

interface TacticSetup {
  id: string;
  name: string;
  elements: TacticElement[];
  instructions: string;
  createdAt: string;
}

interface TacticBoardProps {
  players: Player[];
  isEditing?: boolean;
  instructions: string;
  onInstructionsChange: (val: string) => void;
}

export const TacticBoard: React.FC<TacticBoardProps> = ({ 
  players, 
  isEditing = false,
  instructions,
  onInstructionsChange
}) => {
  const { data: setups, addOrUpdateItem: saveSetup, removeItem: deleteSetup } = useCollectionSync<TacticSetup>('tactic_setups', 'id', 'createdAt', 'desc');
  
  const [elements, setElements] = useSyncedState<TacticElement[]>('tactic_active_elements', []);
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [setupName, setSetupName] = useState('');
  
  const [tool, setTool] = useState<'select' | 'pen' | 'arrow' | 'rect' | 'circle' | 'text'>('select');
  const [selectedColor, setSelectedColor] = useState('#C00000');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [systemMode, setSystemMode] = useState<'offensive' | 'defensive'>('offensive');
  const [fieldMode, setFieldMode] = useState<'full' | 'half'>('full');
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [activeSidebarTab, setActiveSidebarTab] = useState<'players' | 'setups' | 'tactics'>('players');

  const colors = ['#C00000', '#2d5a27', '#0000FF', '#FFD700', '#000000', '#FFFFFF'];
  const positions = ['TW', 'IV', 'RV', 'LV', 'DM', 'ZM', 'RM/RW', 'LM/LW', 'OM', 'ST'];

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const allPlayers = players.filter(isPlayer);

  const handleAddPlayer = (player: Player, customPos?: { x: number, y: number }) => {
    if (!isEditing) return;
    const newElement: TacticElement = {
      id: `p-${player.id}-${Date.now()}`,
      type: 'player',
      x: customPos?.x || stageSize.width / 2,
      y: customPos?.y || stageSize.height / 2,
      playerData: player,
      radius: 15,
      color: selectedColor
    };
    setElements(prev => [...prev, newElement]);
  };

  const handleAddAllPlayers = () => {
    if (!isEditing) return;
    const newElements: TacticElement[] = allPlayers.map((p, i) => ({
      id: `p-${p.id}-${Date.now()}-${i}`,
      type: 'player',
      x: 50 + (i % 5) * 60,
      y: 50 + Math.floor(i / 5) * 60,
      playerData: p,
      radius: 15,
      color: selectedColor
    }));
    setElements(prev => [...prev, ...newElements]);
  };

  const handleAddMaterial = (type: string) => {
    if (!isEditing) return;
    const newElement: TacticElement = {
      id: `m-${type}-${Date.now()}`,
      type: 'material',
      x: stageSize.width / 2,
      y: stageSize.height / 2,
      materialType: type,
      color: type.includes('Rot') ? '#C00000' : type.includes('Gelb') ? '#FFD700' : '#000000'
    };
    setElements(prev => [...prev, newElement]);
  };

  const handleAddPhoto = (imageUrl: string) => {
    if (!isEditing) return;
    const newElement: TacticElement = {
      id: `photo-${Date.now()}`,
      type: 'photo',
      x: stageSize.width / 2 - 30,
      y: stageSize.height / 2 - 40,
      imageUrl: imageUrl,
    };
    setElements(prev => [...prev, newElement]);
  };

  const FORMATIONS: Record<string, { offensive: { pos: string, x: number, y: number }[], defensive: { pos: string, x: number, y: number }[] }> = {
    '4-4-2': {
      offensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'LV', x: 0.25, y: 0.15 },
        { pos: 'IV', x: 0.22, y: 0.4 },
        { pos: 'IV', x: 0.22, y: 0.6 },
        { pos: 'RV', x: 0.25, y: 0.85 },
        { pos: 'LM/LW', x: 0.5, y: 0.15 },
        { pos: 'ZM', x: 0.45, y: 0.4 },
        { pos: 'ZM', x: 0.45, y: 0.6 },
        { pos: 'RM/RW', x: 0.5, y: 0.85 },
        { pos: 'ST', x: 0.8, y: 0.4 },
        { pos: 'ST', x: 0.8, y: 0.6 },
      ],
      defensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'LV', x: 0.2, y: 0.25 },
        { pos: 'IV', x: 0.18, y: 0.42 },
        { pos: 'IV', x: 0.18, y: 0.58 },
        { pos: 'RV', x: 0.2, y: 0.75 },
        { pos: 'LM/LW', x: 0.35, y: 0.25 },
        { pos: 'ZM', x: 0.32, y: 0.42 },
        { pos: 'ZM', x: 0.32, y: 0.58 },
        { pos: 'RM/RW', x: 0.35, y: 0.75 },
        { pos: 'ST', x: 0.5, y: 0.42 },
        { pos: 'ST', x: 0.5, y: 0.58 },
      ]
    },
    '4-3-3': {
      offensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'LV', x: 0.25, y: 0.15 },
        { pos: 'IV', x: 0.22, y: 0.4 },
        { pos: 'IV', x: 0.22, y: 0.6 },
        { pos: 'RV', x: 0.25, y: 0.85 },
        { pos: 'ZM', x: 0.5, y: 0.3 },
        { pos: 'DM', x: 0.4, y: 0.5 },
        { pos: 'ZM', x: 0.5, y: 0.7 },
        { pos: 'LM/LW', x: 0.8, y: 0.15 },
        { pos: 'ST', x: 0.85, y: 0.5 },
        { pos: 'RM/RW', x: 0.8, y: 0.85 },
      ],
      defensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'LV', x: 0.2, y: 0.25 },
        { pos: 'IV', x: 0.18, y: 0.42 },
        { pos: 'IV', x: 0.18, y: 0.58 },
        { pos: 'RV', x: 0.2, y: 0.75 },
        { pos: 'ZM', x: 0.35, y: 0.35 },
        { pos: 'DM', x: 0.3, y: 0.5 },
        { pos: 'ZM', x: 0.35, y: 0.65 },
        { pos: 'LM/LW', x: 0.45, y: 0.25 },
        { pos: 'ST', x: 0.55, y: 0.5 },
        { pos: 'RM/RW', x: 0.45, y: 0.75 },
      ]
    },
    '3-5-2': {
      offensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'IV', x: 0.22, y: 0.25 },
        { pos: 'IV', x: 0.2, y: 0.5 },
        { pos: 'IV', x: 0.22, y: 0.75 },
        { pos: 'LM/LW', x: 0.45, y: 0.1 },
        { pos: 'ZM', x: 0.5, y: 0.35 },
        { pos: 'DM', x: 0.4, y: 0.5 },
        { pos: 'ZM', x: 0.5, y: 0.65 },
        { pos: 'RM/RW', x: 0.45, y: 0.9 },
        { pos: 'ST', x: 0.8, y: 0.4 },
        { pos: 'ST', x: 0.8, y: 0.6 },
      ],
      defensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'IV', x: 0.18, y: 0.3 },
        { pos: 'IV', x: 0.18, y: 0.5 },
        { pos: 'IV', x: 0.18, y: 0.7 },
        { pos: 'LM/LW', x: 0.25, y: 0.2 },
        { pos: 'ZM', x: 0.32, y: 0.4 },
        { pos: 'DM', x: 0.28, y: 0.5 },
        { pos: 'ZM', x: 0.32, y: 0.6 },
        { pos: 'RM/RW', x: 0.25, y: 0.8 },
        { pos: 'ST', x: 0.5, y: 0.42 },
        { pos: 'ST', x: 0.5, y: 0.58 },
      ]
    },
    '4-2-3-1': {
      offensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'LV', x: 0.25, y: 0.15 },
        { pos: 'IV', x: 0.22, y: 0.4 },
        { pos: 'IV', x: 0.22, y: 0.6 },
        { pos: 'RV', x: 0.25, y: 0.85 },
        { pos: 'DM', x: 0.45, y: 0.35 },
        { pos: 'DM', x: 0.45, y: 0.65 },
        { pos: 'LM/LW', x: 0.7, y: 0.15 },
        { pos: 'OM', x: 0.7, y: 0.5 },
        { pos: 'RM/RW', x: 0.7, y: 0.85 },
        { pos: 'ST', x: 0.9, y: 0.5 },
      ],
      defensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'LV', x: 0.2, y: 0.25 },
        { pos: 'IV', x: 0.18, y: 0.42 },
        { pos: 'IV', x: 0.18, y: 0.58 },
        { pos: 'RV', x: 0.2, y: 0.75 },
        { pos: 'DM', x: 0.32, y: 0.4 },
        { pos: 'DM', x: 0.32, y: 0.6 },
        { pos: 'LM/LW', x: 0.45, y: 0.25 },
        { pos: 'OM', x: 0.45, y: 0.5 },
        { pos: 'RM/RW', x: 0.45, y: 0.75 },
        { pos: 'ST', x: 0.6, y: 0.5 },
      ]
    },
    '3-4-3': {
      offensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'IV', x: 0.22, y: 0.25 },
        { pos: 'IV', x: 0.2, y: 0.5 },
        { pos: 'IV', x: 0.22, y: 0.75 },
        { pos: 'LM/LW', x: 0.5, y: 0.1 },
        { pos: 'ZM', x: 0.45, y: 0.4 },
        { pos: 'ZM', x: 0.45, y: 0.6 },
        { pos: 'RM/RW', x: 0.5, y: 0.9 },
        { pos: 'ST', x: 0.8, y: 0.25 },
        { pos: 'ST', x: 0.85, y: 0.5 },
        { pos: 'ST', x: 0.8, y: 0.75 },
      ],
      defensive: [
        { pos: 'TW', x: 0.1, y: 0.5 },
        { pos: 'IV', x: 0.18, y: 0.3 },
        { pos: 'IV', x: 0.18, y: 0.5 },
        { pos: 'IV', x: 0.18, y: 0.7 },
        { pos: 'LM/LW', x: 0.3, y: 0.2 },
        { pos: 'ZM', x: 0.32, y: 0.4 },
        { pos: 'ZM', x: 0.32, y: 0.6 },
        { pos: 'RM/RW', x: 0.3, y: 0.8 },
        { pos: 'ST', x: 0.5, y: 0.3 },
        { pos: 'ST', x: 0.55, y: 0.5 },
        { pos: 'ST', x: 0.5, y: 0.7 },
      ]
    }
  };

  const STANDARDS: Record<string, { 
    players: { pos: string, x: number, y: number }[],
    lines?: { points: number[], color: string, shapeType?: 'arrow' }[]
  }> = {
    'Schweden (Ecke)': {
      players: [
        { pos: 'ST', x: 0.98, y: 0.02 },
        { pos: 'ZM', x: 0.88, y: 0.45 },
        { pos: 'ZM', x: 0.9, y: 0.5 },
        { pos: 'OM', x: 0.85, y: 0.55 },
        { pos: 'IV', x: 0.8, y: 0.45 },
        { pos: 'IV', x: 0.8, y: 0.55 },
        { pos: 'DM', x: 0.75, y: 0.5 },
        { pos: 'LV', x: 0.7, y: 0.5 },
        { pos: 'RV', x: 0.6, y: 0.5 },
        { pos: 'TW', x: 0.55, y: 0.5 },
      ],
      lines: [
        { points: [0.98, 0.02, 0.9, 0.45], color: '#C00000', shapeType: 'arrow' },
        { points: [0.88, 0.45, 0.92, 0.48], color: '#0000FF', shapeType: 'arrow' },
      ]
    },
    'Schweden+ (Ecke)': {
      players: [
        { pos: 'ST', x: 0.98, y: 0.02 },
        { pos: 'ZM', x: 0.9, y: 0.4 },
        { pos: 'ZM', x: 0.92, y: 0.45 },
        { pos: 'OM', x: 0.9, y: 0.5 },
        { pos: 'ST', x: 0.92, y: 0.55 },
        { pos: 'IV', x: 0.85, y: 0.45 },
        { pos: 'IV', x: 0.85, y: 0.55 },
        { pos: 'DM', x: 0.8, y: 0.5 },
        { pos: 'LV', x: 0.75, y: 0.5 },
        { pos: 'TW', x: 0.55, y: 0.5 },
      ],
      lines: [
        { points: [0.98, 0.02, 0.92, 0.45], color: '#C00000', shapeType: 'arrow' },
      ]
    },
    'Apache (Ecke)': {
      players: [
        { pos: 'ST', x: 0.98, y: 0.02 },
        { pos: 'ST', x: 0.8, y: 0.3 },
        { pos: 'ZM', x: 0.82, y: 0.4 },
        { pos: 'ZM', x: 0.8, y: 0.5 },
        { pos: 'OM', x: 0.82, y: 0.6 },
        { pos: 'IV', x: 0.8, y: 0.7 },
        { pos: 'IV', x: 0.7, y: 0.5 },
        { pos: 'DM', x: 0.6, y: 0.5 },
        { pos: 'LV', x: 0.55, y: 0.5 },
        { pos: 'TW', x: 0.52, y: 0.5 },
      ],
      lines: [
        { points: [0.98, 0.02, 0.8, 0.3], color: '#C00000', shapeType: 'arrow' },
      ]
    },
    'Amin (Freistoß)': {
      players: [
        { pos: 'ST', x: 0.75, y: 0.5 },
        { pos: 'OM', x: 0.7, y: 0.45 },
        { pos: 'ZM', x: 0.7, y: 0.55 },
        { pos: 'ZM', x: 0.65, y: 0.4 },
        { pos: 'ST', x: 0.65, y: 0.6 },
        { pos: 'IV', x: 0.6, y: 0.5 },
        { pos: 'IV', x: 0.55, y: 0.5 },
        { pos: 'DM', x: 0.52, y: 0.5 },
        { pos: 'TW', x: 0.5, y: 0.5 },
      ],
      lines: [
        { points: [0.75, 0.5, 0.9, 0.5], color: '#C00000', shapeType: 'arrow' },
        { points: [0.7, 0.45, 0.85, 0.4], color: '#0000FF', shapeType: 'arrow' },
      ]
    },
    'Eckball Defensiv': {
      players: [
        { pos: 'TW', x: 0.95, y: 0.5 },
        { pos: 'IV', x: 0.9, y: 0.4 },
        { pos: 'IV', x: 0.9, y: 0.6 },
        { pos: 'LV', x: 0.92, y: 0.3 },
        { pos: 'RV', x: 0.92, y: 0.7 },
        { pos: 'DM', x: 0.85, y: 0.5 },
        { pos: 'ZM', x: 0.8, y: 0.35 },
        { pos: 'ZM', x: 0.8, y: 0.65 },
        { pos: 'OM', x: 0.7, y: 0.5 },
        { pos: 'ST', x: 0.6, y: 0.3 },
        { pos: 'ST', x: 0.6, y: 0.7 },
      ]
    }
  };

  const handleApplySystem = (systemName: string, isStandard = false) => {
    if (!isEditing) return;
    
    const setup = isStandard ? STANDARDS[systemName] : { players: FORMATIONS[systemName][systemMode] };
    if (!setup) return;

    const w = stageSize.width;
    const h = stageSize.height;
    const p = 20;

    // Set field mode
    setFieldMode(isStandard ? 'half' : 'full');

    const newElements: TacticElement[] = [];

    // Add Players
    setup.players.forEach((f, i) => {
      const player = players.find(p => p.position === f.pos);
      let stageX, stageY;
      
      if (isStandard) {
        // Map 0.5-1.0 to p-(w-p)
        stageX = p + (f.x - 0.5) * 2 * (w - 2 * p);
        stageY = p + f.y * (h - 2 * p);
      } else {
        stageX = f.x * w;
        stageY = f.y * h;
      }

      newElements.push({
        id: `f-${i}-${Date.now()}`,
        type: 'player',
        x: stageX,
        y: stageY,
        radius: 15,
        color: selectedColor,
        playerData: player || { id: `temp-${i}`, firstName: 'Pos', lastName: f.pos, number: 0, position: f.pos } as Player
      });
    });

    // Add Lines/Arrows if any
    if (isStandard && setup.lines) {
      setup.lines.forEach((l, i) => {
        const points = l.points.map((val, idx) => {
          if (idx % 2 === 0) { // x
             return p + (val - 0.5) * 2 * (w - 2 * p);
          } else { // y
             return p + val * (h - 2 * p);
          }
        });
        newElements.push({
          id: `l-${i}-${Date.now()}`,
          type: 'line',
          x: 0,
          y: 0,
          points: points,
          color: l.color,
          shapeType: l.shapeType
        });
      });
    }

    setElements(newElements);
    setNotification(`${isStandard ? 'Standard' : 'System'} ${systemName} angewendet.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const [notification, setNotification] = useState<string | null>(null);

  const handleMouseDown = (e: any) => {
    if (!isEditing || tool === 'select') return;

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'pen' || tool === 'arrow') {
      const newElement: TacticElement = {
        id: `draw-${Date.now()}`,
        type: 'line',
        x: 0,
        y: 0,
        points: [pos.x, pos.y, pos.x, pos.y],
        color: selectedColor,
        shapeType: tool === 'arrow' ? 'arrow' : undefined,
      };
      setElements([...elements, newElement]);
    } else if (tool === 'rect' || tool === 'circle') {
      const newElement: TacticElement = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        x: pos.x,
        y: pos.y,
        color: selectedColor,
        shapeType: tool,
        points: [0, 0], // width, height
      };
      setElements([...elements, newElement]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || tool === 'select') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastElement = elements[elements.length - 1];

    if (tool === 'pen' || tool === 'arrow') {
      const newPoints = lastElement.points!.slice(0, 2).concat([point.x, point.y]);
      const updated = { ...lastElement, points: newPoints };
      setElements(elements.slice(0, -1).concat([updated]));
    } else if (tool === 'rect' || tool === 'circle') {
      const updated = {
        ...lastElement,
        points: [point.x - lastElement.x, point.y - lastElement.y],
      };
      setElements(elements.slice(0, -1).concat([updated]));
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const removeElement = (id: string) => {
    if (!isEditing) return;
    setElements(elements.filter(el => el.id !== id));
  };

  const clearBoard = () => {
    if (!isEditing) return;
    setElements([]);
  };

  const handleSaveSetup = async () => {
    if (!setupName) {
      alert('Bitte geben Sie einen Namen für das Taktik-Setup ein.');
      return;
    }
    const newSetup: TacticSetup = {
      id: selectedSetupId || Date.now().toString(),
      name: setupName,
      elements,
      instructions,
      createdAt: new Date().toISOString(),
    };
    await saveSetup(newSetup);
    setSelectedSetupId(newSetup.id);
    alert('Taktik-Setup gespeichert!');
  };

  const handleLoadSetup = (setup: TacticSetup) => {
    setElements(setup.elements);
    onInstructionsChange(setup.instructions || '');
    setSetupName(setup.name);
    setSelectedSetupId(setup.id);
    setSelectedId(null);
    setActiveSidebarTab('players');
  };

  const handleExport = () => {
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `taktik_${setupName || 'export'}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateElementSize = (id: string, delta: number) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        if (el.type === 'player') {
          return { ...el, radius: Math.max(5, (el.radius || 15) + delta) };
        }
        if (el.type === 'photo') {
          return { ...el, width: Math.max(20, (el.width || 60) + delta), height: Math.max(20, (el.height || 80) + delta) };
        }
      }
      return el;
    }));
  };

  const FieldBackground = () => {
    const w = stageSize.width;
    const h = stageSize.height;
    const p = 20; // padding

    if (fieldMode === 'half') {
      return (
        <Group>
          {/* Grass */}
          <Rect x={0} y={0} width={w} height={h} fill="#2d5a27" />
          
          {/* Goal Line (Right) */}
          <Line points={[w - p, p, w - p, h - p]} stroke="white" strokeWidth={2} />
          
          {/* Side Lines */}
          <Line points={[p, p, w - p, p]} stroke="white" strokeWidth={2} />
          <Line points={[p, h - p, w - p, h - p]} stroke="white" strokeWidth={2} />
          
          {/* Center Line (Left edge of half field) */}
          <Line points={[p, p, p, h - p]} stroke="white" strokeWidth={2} />
          
          {/* Penalty Area (Right) */}
          <Rect x={w - 120} y={h / 2 - 120} width={100} height={240} stroke="white" strokeWidth={2} />
          <Rect x={w - 60} y={h / 2 - 50} width={40} height={100} stroke="white" strokeWidth={2} />
          
          {/* Center Circle Arc */}
          <Group clipFunc={(ctx) => {
            ctx.rect(p, p, 100, h - 2 * p);
          }}>
            <Circle x={p} y={h / 2} radius={60} stroke="white" strokeWidth={2} />
          </Group>
        </Group>
      );
    }

    return (
      <Group>
        {/* Grass */}
        <Rect x={0} y={0} width={w} height={h} fill="#2d5a27" />
        
        {/* Outer Lines */}
        <Rect 
          x={p} y={p} 
          width={w - 2 * p} height={h - 2 * p} 
          stroke="white" strokeWidth={2} 
        />
        
        {/* Center Line */}
        <Line 
          points={[w / 2, p, w / 2, h - p]} 
          stroke="white" strokeWidth={2} 
        />
        
        {/* Center Circle */}
        <Circle 
          x={w / 2} y={h / 2} 
          radius={60} stroke="white" strokeWidth={2} 
        />
        <Circle 
          x={w / 2} y={h / 2} 
          radius={2} fill="white" 
        />

        {/* Penalty Areas */}
        {/* Left */}
        <Rect x={p} y={h / 2 - 120} width={100} height={240} stroke="white" strokeWidth={2} />
        <Rect x={p} y={h / 2 - 50} width={40} height={100} stroke="white" strokeWidth={2} />
        
        {/* Right */}
        <Rect x={w - 120} y={h / 2 - 120} width={100} height={240} stroke="white" strokeWidth={2} />
        <Rect x={w - 60} y={h / 2 - 50} width={40} height={100} stroke="white" strokeWidth={2} />
      </Group>
    );
  };

  return (
    <div className="flex h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden watermark-bg">
      {/* Left Sidebar: Players, Photos, Setups */}
      {isEditing && (
        <div className="w-64 border-r-2 border-black flex flex-col bg-gray-50">
          <div className="flex border-b-2 border-black">
            <button 
              onClick={() => setActiveSidebarTab('players')}
              className={`flex-1 p-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'players' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              Kader
            </button>
            <button 
              onClick={() => setActiveSidebarTab('setups')}
              className={`flex-1 p-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'setups' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              Setups
            </button>
            <button 
              onClick={() => setActiveSidebarTab('tactics')}
              className={`flex-1 p-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeSidebarTab === 'tactics' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              Taktik
            </button>
          </div>

        {activeSidebarTab === 'players' && (
          <>
            <div className="p-4 border-b-2 border-black bg-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase text-[10px] tracking-widest">FC Auggen</h3>
              </div>
              <button 
                onClick={handleAddAllPlayers}
                className="w-full bg-black text-white py-1 text-[8px] font-black uppercase border border-black hover:bg-gray-800 transition-all flex items-center justify-center gap-1"
              >
                <Plus size={10} /> Gesamten Kader hinzufügen
              </button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-2 space-y-4">
              {positions.map(pos => {
                const posPlayers = allPlayers.filter(p => p.position === pos);
                if (posPlayers.length === 0) return null;
                return (
                  <div key={pos} className="space-y-1">
                    <p className="text-[7px] font-black uppercase opacity-40 px-1">{pos}</p>
                    {posPlayers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddPlayer(p)}
                        className="w-full p-2 text-left border border-black/10 hover:border-black hover:bg-white transition-all group flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase">{p.lastName}</span>
                          <span className="text-[7px] opacity-40 font-bold uppercase">{p.position}</span>
                        </div>
                        <Plus size={10} className="opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                );
              })}
              {/* Show players with other positions */}
              {(() => {
                const otherPlayers = allPlayers.filter(p => !positions.includes(p.position));
                if (otherPlayers.length === 0) return null;
                return (
                  <div className="space-y-1">
                    <p className="text-[7px] font-black uppercase opacity-40 px-1">Sonstige</p>
                    {otherPlayers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddPlayer(p)}
                        className="w-full p-2 text-left border border-black/10 hover:border-black hover:bg-white transition-all group flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase">{p.lastName}</span>
                          <span className="text-[7px] opacity-40 font-bold uppercase">{p.position}</span>
                        </div>
                        <Plus size={10} className="opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {activeSidebarTab === 'tactics' && (
          <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-6">
            {/* Systeme Section */}
            <div className="space-y-4">
              <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Systeme</p>
              <div className="flex flex-col gap-2">
                <p className="text-[7px] font-black uppercase opacity-60 tracking-widest">Variante</p>
                <div className="flex border-2 border-black">
                  <button 
                    onClick={() => setSystemMode('offensive')}
                    className={`flex-1 py-1 text-[7px] font-black uppercase tracking-widest transition-all ${systemMode === 'offensive' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                  >
                    Mit Ball
                  </button>
                  <button 
                    onClick={() => setSystemMode('defensive')}
                    className={`flex-1 py-1 text-[7px] font-black uppercase tracking-widest transition-all ${systemMode === 'defensive' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                  >
                    Gegen Ball
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {Object.keys(FORMATIONS).map(name => (
                  <button
                    key={name}
                    onClick={() => handleApplySystem(name)}
                    className="w-full p-2 border-2 border-black bg-white text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{name}</span>
                    <Layout size={10} className="opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-gray-100 border-2 border-black text-[9px] font-bold">
              Wählen Sie ein System aus, um die Spieler automatisch zu positionieren.
            </div>
          </div>
        )}

        {activeSidebarTab === 'setups' && (
          <div className="flex-1 overflow-auto custom-scrollbar p-2 space-y-2">
            {setups.map(setup => (
              <div key={setup.id} className="group relative">
                <button
                  onClick={() => handleLoadSetup(setup)}
                  className={`w-full p-3 text-left border-2 border-black transition-all hover:bg-white ${selectedSetupId === setup.id ? 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100'}`}
                >
                  <p className="text-[10px] font-black uppercase">{setup.name}</p>
                  <p className="text-[7px] opacity-40 font-bold uppercase">{new Date(setup.createdAt).toLocaleDateString()}</p>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteSetup(setup.id); }}
                  className="absolute top-2 right-2 p-1 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {setups.length === 0 && (
              <div className="p-8 text-center opacity-20 flex flex-col items-center gap-2">
                <FolderOpen size={32} />
                <p className="text-[8px] font-black uppercase">Keine Setups gespeichert</p>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Main Board */}
      <div className="flex-1 relative flex flex-col" ref={containerRef}>
        {isEditing && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="flex gap-2 bg-white/90 backdrop-blur border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {[
                { id: 'select', icon: MousePointer2, label: 'Auswählen' },
                { id: 'pen', icon: Pencil, label: 'Zeichnen' },
                { id: 'arrow', icon: ArrowUpRight, label: 'Pfeil' },
                { id: 'rect', icon: Square, label: 'Rechteck' },
                { id: 'circle', icon: CircleIcon, label: 'Kreis' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as any)}
                  className={`p-2 border-2 border-transparent hover:border-black transition-all ${tool === t.id ? 'bg-black text-white' : ''}`}
                  title={t.label}
                >
                  <t.icon size={16} />
                </button>
              ))}
              <div className="w-px bg-black/10 mx-1" />
              <button
                onClick={() => setFieldMode(fieldMode === 'full' ? 'half' : 'full')}
                className={`p-2 border-2 border-transparent hover:border-black transition-all ${fieldMode === 'half' ? 'bg-black text-white' : ''}`}
                title="Spielfeld-Modus (Ganz/Halb)"
              >
                {fieldMode === 'full' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <div className="w-px bg-black/10 mx-1" />
              <button
                onClick={clearBoard}
                className="p-2 hover:bg-red-50 text-[#C00000] transition-all"
                title="Board leeren"
              >
                <Eraser size={16} />
              </button>
            </div>

            <div className="flex gap-2 bg-white/90 backdrop-blur border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 border-2 transition-all ${selectedColor === c ? 'border-black scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {selectedId && (
              <div className="flex gap-2 bg-white/90 backdrop-blur border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <button 
                  onClick={() => updateElementSize(selectedId, 2)}
                  className="p-1 hover:bg-gray-100"
                  title="Vergrößern"
                >
                  <Maximize2 size={16} />
                </button>
                <button 
                  onClick={() => updateElementSize(selectedId, -2)}
                  className="p-1 hover:bg-gray-100"
                  title="Verkleinern"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {isEditing && (
            <div className="flex gap-2 bg-white/90 backdrop-blur border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <input 
                type="text" 
                placeholder="Setup Name..." 
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="text-[10px] font-black uppercase p-1 outline-none w-32"
              />
              <button
                onClick={handleSaveSetup}
                className="p-2 hover:bg-gray-100 text-green-600 transition-all"
                title="Setup speichern"
              >
                <SaveIcon size={16} />
              </button>
            </div>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Download size={14} /> Export PNG
          </button>
        </div>

        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={isEditing ? handleMouseDown : undefined}
          onMouseMove={isEditing ? handleMouseMove : undefined}
          onMouseUp={isEditing ? handleMouseUp : undefined}
          onClick={(e) => {
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
          ref={stageRef}
        >
          <Layer>
            <FieldBackground />
          </Layer>
          <Layer>
            {elements.map((el) => {
              if (el.type === 'photo') {
                return (
                  <URLImage
                    key={el.id}
                    imageUrl={el.imageUrl}
                    x={el.x}
                    y={el.y}
                    width={el.width || 60}
                    height={el.height || 80}
                    onDragEnd={(e: any) => {
                      if (!isEditing) return;
                      const updated = elements.map(item => 
                        item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                      );
                      setElements(updated);
                    }}
                    onClick={() => isEditing && setSelectedId(el.id)}
                    onDblClick={() => isEditing && removeElement(el.id)}
                    draggable={isEditing}
                  />
                );
              }
              if (el.type === 'player') {
                return (
                  <Group
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    draggable={isEditing}
                    onClick={() => isEditing && setSelectedId(el.id)}
                    onDragEnd={(e) => {
                      if (!isEditing) return;
                      const updated = elements.map(item => 
                        item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                      );
                      setElements(updated);
                    }}
                    onDblClick={() => isEditing && removeElement(el.id)}
                  >
                    <Circle radius={el.radius || 15} fill={el.color || "#C00000"} stroke="white" strokeWidth={2} shadowBlur={5} shadowOpacity={0.3} />
                    <Text
                      text={el.playerData?.lastName.substring(0, 3).toUpperCase()}
                      fontSize={(el.radius || 15) * 0.5}
                      fontStyle="bold"
                      fill="white"
                      align="center"
                      width={(el.radius || 15) * 2}
                      x={-(el.radius || 15)}
                      y={-(el.radius || 15) * 0.25}
                    />
                    <Text
                      text={el.playerData?.number.toString()}
                      fontSize={(el.radius || 15) * 0.4}
                      fill="white"
                      opacity={0.6}
                      align="center"
                      width={(el.radius || 15) * 2}
                      x={-(el.radius || 15)}
                      y={(el.radius || 15) * 0.25}
                    />
                  </Group>
                );
              }
              if (el.type === 'material') {
                return (
                  <Group
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    draggable={isEditing}
                    onDragEnd={(e) => {
                      if (!isEditing) return;
                      const updated = elements.map(item => 
                        item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                      );
                      setElements(updated);
                    }}
                    onDblClick={() => isEditing && removeElement(el.id)}
                  >
                    {el.materialType?.includes('Hütchen') ? (
                      <Line
                        points={[-10, 10, 0, -10, 10, 10]}
                        closed
                        fill={el.color}
                        stroke="black"
                        strokeWidth={1}
                      />
                    ) : el.materialType === 'Stangen' ? (
                      <Rect
                        x={-2}
                        y={-15}
                        width={4}
                        height={30}
                        fill="white"
                        stroke="black"
                        strokeWidth={1}
                      />
                    ) : (
                      <Rect
                        x={-15}
                        y={-10}
                        width={30}
                        height={20}
                        fill="white"
                        stroke="black"
                        strokeWidth={1}
                      />
                    )}
                  </Group>
                );
              }
              if (el.type === 'line') {
                if (el.shapeType === 'arrow') {
                  return (
                    <Arrow
                      key={el.id}
                      points={el.points || []}
                      stroke={el.color}
                      strokeWidth={3}
                      pointerLength={10}
                      pointerWidth={10}
                      fill={el.color}
                      onDblClick={() => isEditing && removeElement(el.id)}
                    />
                  );
                }
                return (
                  <Line
                    key={el.id}
                    points={el.points || []}
                    stroke={el.color}
                    strokeWidth={3}
                    tension={0.5}
                    lineCap="round"
                    onDblClick={() => isEditing && removeElement(el.id)}
                  />
                );
              }
              if (el.type === 'shape') {
                if (el.shapeType === 'rect') {
                  return (
                    <Rect
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      width={el.points![0]}
                      height={el.points![1]}
                      stroke={el.color}
                      strokeWidth={2}
                      onDblClick={() => isEditing && removeElement(el.id)}
                    />
                  );
                }
                if (el.shapeType === 'circle') {
                  const radius = Math.sqrt(Math.pow(el.points![0], 2) + Math.pow(el.points![1], 2));
                  return (
                    <Circle
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      radius={radius}
                      stroke={el.color}
                      strokeWidth={2}
                      onDblClick={() => isEditing && removeElement(el.id)}
                    />
                  );
                }
              }
              return null;
            })}
          </Layer>
        </Stage>

        {notification && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-50 animate-bounce">
            {notification}
          </div>
        )}
      </div>

      {/* Right Sidebar: Materials / Instructions */}
      {isEditing && (
        <div className="w-72 border-l-2 border-black flex flex-col bg-gray-50">
          <div className="p-4 border-b-2 border-black bg-black text-white">
            <h3 className="font-black uppercase text-sm tracking-widest">Taktische Anweisungen</h3>
          </div>
        <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-6">
          <section className="space-y-2">
            <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Spielphase</p>
            <div className="grid grid-cols-2 gap-2">
              {['Offensiv', 'Defensiv', 'Umschalt M.', 'Umschalt O.'].map(phase => (
                <button key={phase} className="p-2 border border-black text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all">
                  {phase}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Anweisungen</p>
            <textarea 
              className="w-full h-32 p-3 border-2 border-black text-xs font-bold focus:outline-none bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              placeholder="Taktische Vorgaben hier eingeben..."
              value={instructions}
              onChange={(e) => isEditing && onInstructionsChange(e.target.value)}
              disabled={!isEditing}
            />
          </section>

          <section className="space-y-2">
            <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Materialien</p>
            <div className="space-y-2">
              {[
                { name: 'Hütchen (Rot)', icon: '▲' },
                { name: 'Hütchen (Gelb)', icon: '▲' },
                { name: 'Stangen', icon: '┃' },
                { name: 'Minitore', icon: '⊓' },
              ].map(item => (
                <button 
                  key={item.name} 
                  onClick={() => handleAddMaterial(item.name)}
                  className="w-full flex items-center gap-3 p-2 border border-black/10 bg-white hover:border-black transition-all group"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] font-black uppercase">{item.name}</span>
                  <Plus size={10} className="ml-auto opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </section>

          <div className="p-4 bg-[#C00000] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[8px] font-black uppercase opacity-60">Hinweis</p>
            <p className="text-[10px] font-bold leading-tight">Doppelklick auf ein Element zum Löschen.</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

