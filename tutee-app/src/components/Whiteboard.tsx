'use client';
import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

type Props = {
    visible: boolean;
    onClose: () => void;
    socket: Socket;
    roomId: string;
};

type Point = { x: number; y: number };
type TextStroke = {
    tool: 'text';
    color: string;
    points: [Point];
    size: number;
    text: string;
    width: number;
    height: number;
};
type Stroke =
    | {
        tool: 'pen' | 'eraser' | 'line' | 'rect' | 'circle';
        color: string;
        points: Point[];
        size: number;
    }
    | TextStroke;

type WhiteboardAction =
    | { type: 'stroke'; stroke: Stroke }
    | { type: 'undo' }
    | { type: 'redo' }
    | { type: 'clear' }
    | { type: 'text'; stroke: Stroke };


const COLORS = ['#111', '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f7b801', '#00b4d8', '#ff00ff'];
const TOOL_LABELS = {
    pen: '✏️', eraser: '🧹', line: '📏', rect: '⬛', circle: '⚪', text: 'T'
};

export default function Whiteboard({ visible, onClose, socket, roomId }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [tool, setTool] = useState<Stroke['tool']>('pen');
    const [color, setColor] = useState<string>(COLORS[0]);
    const [size, setSize] = useState<number>(2.5);
    const [drawing, setDrawing] = useState(false);
    const [points, setPoints] = useState<Point[]>([]);
    const [history, setHistory] = useState<Stroke[]>([]);
    const [redoStack, setRedoStack] = useState<Stroke[]>([]);
    const [liveCursors, setLiveCursors] = useState<Record<string, Point | null>>({});

    // Draggable, resizable text box
    const [activeTextBox, setActiveTextBox] = useState<{
        x: number;
        y: number;
        value: string;
        width: number;
        height: number;
        isDragging: boolean;
        isResizing: boolean;
        offsetX: number;
        offsetY: number;
        focused: boolean;
        touched: boolean; // if user has started typing
    } | null>(null);

    // Utility
    const getOffset = (e: React.PointerEvent) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top, width: rect.width, height: rect.height };
    };

    // --- Drawing logic ---
    const startDraw = (e: React.PointerEvent) => {
        if (tool === 'text' && !activeTextBox) {
            const { x, y } = getOffset(e);
            setActiveTextBox({
                x,
                y,
                value: '',
                width: 150,
                height: 44,
                isDragging: false,
                isResizing: false,
                offsetX: 0,
                offsetY: 0,
                focused: true,
                touched: false,
            });
            return;
        }
        if (tool !== 'text') {
            setDrawing(true);
            setRedoStack([]);
            const { x, y } = getOffset(e);
            setPoints([{ x, y }]);
        }
    };

    const moveDraw = (e: React.PointerEvent) => {
        const { x, y, width, height } = getOffset(e);
        if (x >= 0 && y >= 0 && x <= width && y <= height) {
            socket.emit('whiteboard-cursor', { roomId, cursor: { x, y } });
        } else {
            socket.emit('whiteboard-cursor', { roomId, cursor: null });
        }
        if (!drawing) return;
        if (tool === 'pen' || tool === 'eraser') setPoints((prev) => [...prev, { x, y }]);
        if (tool === 'line' || tool === 'rect' || tool === 'circle')
            setPoints((prev) => (prev.length === 1 ? [prev[0], { x, y }] : [prev[0], { x, y }]));
    };

    const handlePointerLeave = () => {
        socket.emit('whiteboard-cursor', { roomId, cursor: null });
        if (drawing) stopDraw();
    };

    const stopDraw = () => {
        if (!drawing) return;
        setDrawing(false);
        if (points.length < 2 && tool !== 'text') return;
        const stroke: Stroke = {
            tool: tool as Exclude<Stroke['tool'], 'text'>,
            color: tool === 'eraser' ? '#fff' : color,
            points: [...points],
            size,
        };
        setHistory((h) => [...h, stroke]);
        socket.emit('whiteboard-action', { roomId, action: { type: 'stroke', stroke } });
        setPoints([]);
    };

    // Drag/Resize for text box
    useEffect(() => {
        function onMouseMove(e: MouseEvent) {
            if (!activeTextBox) return;
            if (activeTextBox.isDragging) {
                setActiveTextBox((prev) =>
                    prev
                        ? {
                            ...prev,
                            x: e.clientX - prev.offsetX,
                            y: e.clientY - prev.offsetY,
                        }
                        : null
                );
            }
            if (activeTextBox.isResizing) {
                setActiveTextBox((prev) =>
                    prev
                        ? {
                            ...prev,
                            width: Math.max(44, e.clientX - prev.x),
                            height: Math.max(28, e.clientY - prev.y),
                        }
                        : null
                );
            }
        }
        function onMouseUp() {
            setActiveTextBox((prev) => (prev ? { ...prev, isDragging: false, isResizing: false } : null));
        }
        if (activeTextBox?.isDragging || activeTextBox?.isResizing) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            return () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [activeTextBox]);

    // --- Draw all strokes/history ---
    const redraw = (h: Stroke[] = history) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        h.forEach((stroke) => {
            ctx.save();
            ctx.lineWidth = stroke.size;
            ctx.strokeStyle = stroke.color;
            ctx.fillStyle = stroke.color;
            if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
                ctx.beginPath();
                stroke.points.forEach((pt, i) => {
                    if (i === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                });
                ctx.stroke();
            }
            if (stroke.tool === 'line' && stroke.points.length === 2) {
                ctx.beginPath();
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
                ctx.stroke();
            }
            if (stroke.tool === 'rect' && stroke.points.length === 2) {
                const [a, b] = stroke.points;
                ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
            }
            if (stroke.tool === 'circle' && stroke.points.length === 2) {
                const [a, b] = stroke.points;
                const r = Math.hypot(b.x - a.x, b.y - a.y);
                ctx.beginPath();
                ctx.arc(a.x, a.y, r, 0, 2 * Math.PI);
                ctx.stroke();
            }
            if (stroke.tool === 'text' && stroke.text && stroke.points[0]) {
                ctx.globalAlpha = 0.92;
                ctx.fillStyle = '#fff';
                ctx.fillRect(stroke.points[0].x, stroke.points[0].y, (stroke as TextStroke).width, (stroke as TextStroke).height);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(stroke.points[0].x, stroke.points[0].y, (stroke as TextStroke).width, (stroke as TextStroke).height);

                ctx.font = '16px Arial';
                ctx.fillStyle = stroke.color;
                ctx.textBaseline = 'top';
                const padding = 5;
                const words = stroke.text.split(' ');
                let line = '';
                let y = stroke.points[0].y + padding;
                const maxW = (stroke as TextStroke).width - padding * 2;
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxW && n > 0) {
                        ctx.fillText(line, stroke.points[0].x + padding, y);
                        line = words[n] + ' ';
                        y += 20;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, stroke.points[0].x + padding, y);
            }
            ctx.restore();
        });
    };

    useEffect(() => {
        if (!visible) return;
        redraw();
    }, [history, visible]);

    useEffect(() => {
        if (!drawing && (tool === 'line' || tool === 'rect' || tool === 'circle') && points.length === 2) {
            redraw([...history, { tool, color, points, size }]);
        }
    }, [points]);

    // --- Socket listeners (actions, cursors) ---
    useEffect(() => {
        if (!visible) return;
        const actionHandler = ({ action }: { action: WhiteboardAction }) => {
            if (action.type === 'stroke' && action.stroke) {
                setHistory((h) => [...h, action.stroke!]);
                setRedoStack([]);
            }
            if (action.type === 'undo') {
                setHistory((h) => {
                    const newH = h.slice(0, -1);
                    redraw(newH);
                    return newH;
                });
            }
            if (action.type === 'redo') {
                setRedoStack((r) => {
                    if (r.length > 0) {
                        setHistory((h) => [...h, r[0]]);
                        return r.slice(1);
                    }
                    return r;
                });
            }
            if (action.type === 'clear') {
                setHistory([]);
                setRedoStack([]);
                redraw([]);
            }
            if (action.type === 'text' && action.stroke) {
                setHistory((h) => [...h, action.stroke!]);
            }
        };
        const cursorHandler = ({ cursor, socketId }: { cursor: Point | null; socketId: string }) => {
            setLiveCursors((cur) => ({ ...cur, [socketId]: cursor }));
        };
        socket.on('whiteboard-action', actionHandler);
        socket.on('whiteboard-cursor', cursorHandler);
        return () => {
            socket.off('whiteboard-action', actionHandler);
            socket.off('whiteboard-cursor', cursorHandler);
        };
    }, [socket, visible]);

    // --- Download as image ---
    const downloadImage = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        tempCtx.fillStyle = "#fff";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        const url = tempCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `whiteboard-${Date.now()}.png`;
        a.click();
    };

    // --- Undo/Redo, synced ---
    const handleUndo = () => {
        setHistory((h) => {
            if (h.length === 0) return h;
            setRedoStack((r) => [h[h.length - 1], ...r]);
            socket.emit('whiteboard-action', { roomId, action: { type: 'undo' } });
            return h.slice(0, -1);
        });
    };
    const handleRedo = () => {
        setRedoStack((r) => {
            if (r.length === 0) return r;
            setHistory((h) => {
                socket.emit('whiteboard-action', { roomId, action: { type: 'redo' } });
                return [...h, r[0]];
            });
            return r.slice(1);
        });
    };

    const handleClear = () => {
        setHistory([]);
        setRedoStack([]);
        socket.emit('whiteboard-action', { roomId, action: { type: 'clear' } });
        redraw([]);
    };

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        const size = 540;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        redraw(history);
    }, [visible]);

    // Autofocus for textarea on creation
    useEffect(() => {
        if (activeTextBox && activeTextBox.focused && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [activeTextBox]);

    if (!visible) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl p-3 shadow-lg flex flex-col items-center relative">
                {/* Toolbar */}
                <div className="flex gap-2 mb-2">
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            className="w-6 h-6 rounded-full border-2 border-gray-200"
                            style={{ background: c, outline: color === c ? '2px solid #222' : 'none' }}
                            onClick={() => setColor(c)}
                            title={c}
                        />
                    ))}
                    <button onClick={() => setTool('pen')} title="Pen" className={tool === 'pen' ? 'ring-2' : ''}>{TOOL_LABELS.pen}</button>
                    <button onClick={() => setTool('eraser')} title="Eraser" className={tool === 'eraser' ? 'ring-2' : ''}>{TOOL_LABELS.eraser}</button>
                    <button onClick={() => setTool('line')} title="Line" className={tool === 'line' ? 'ring-2' : ''}>{TOOL_LABELS.line}</button>
                    <button onClick={() => setTool('rect')} title="Rectangle" className={tool === 'rect' ? 'ring-2' : ''}>{TOOL_LABELS.rect}</button>
                    <button onClick={() => setTool('circle')} title="Circle" className={tool === 'circle' ? 'ring-2' : ''}>{TOOL_LABELS.circle}</button>
                    <button onClick={() => setTool('text')} title="Text" className={tool === 'text' ? 'ring-2' : ''}>{TOOL_LABELS.text}</button>
                    <input
                        type="range"
                        min={1}
                        max={8}
                        step={0.5}
                        value={size}
                        onChange={e => setSize(Number(e.target.value))}
                        className="mx-2"
                        title="Line Width"
                    />
                    <button onClick={handleUndo} title="Undo" disabled={history.length === 0}>↩️</button>
                    <button onClick={handleRedo} title="Redo" disabled={redoStack.length === 0}>↪️</button>
                    <button onClick={handleClear} title="Clear All">🗑️</button>
                    <button onClick={downloadImage} title="Download">⬇️</button>
                    <button onClick={onClose} title="Close" className="ml-2">✕</button>
                </div>
                {/* Canvas */}
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={540}
                        height={540}
                        style={{ background: "#f9f9f9", borderRadius: "10px", border: "1.5px solid #ddd", touchAction: "none" }}
                        onPointerDown={startDraw}
                        onPointerMove={moveDraw}
                        onPointerUp={stopDraw}
                        onPointerLeave={handlePointerLeave}
                    />
                    {/* Live remote cursors as red dots */}
                    {Object.entries(liveCursors).map(([id, c]) =>
                        c && typeof c.x === 'number' && typeof c.y === 'number' ? (
                            <div
                                key={id}
                                style={{
                                    position: 'absolute',
                                    left: c.x - 6,
                                    top: c.y - 6,
                                    pointerEvents: 'none',
                                    zIndex: 20,
                                }}
                            >
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        background: 'red',
                                        opacity: 0.6,
                                        boxShadow: '0 0 8px 2px rgba(255,0,0,0.3)',
                                    }}
                                />
                            </div>
                        ) : null
                    )}
                    {/* Text Box (draggable, resizable, auto-growing) */}
                    {activeTextBox && (
                        <div
                            style={{
                                position: 'absolute',
                                left: activeTextBox.x,
                                top: activeTextBox.y,
                                width: activeTextBox.width,
                                height: activeTextBox.height,
                                background: '#fff',
                                border: '1.5px solid #888',
                                borderRadius: 4,
                                zIndex: 30,
                                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                                userSelect: 'none',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onMouseDown={e => {
                                if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
                                setActiveTextBox(prev =>
                                    prev ? { ...prev, isDragging: true, offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY } : null
                                );
                                e.stopPropagation();
                            }}
                        >
                            <textarea
                                ref={textareaRef}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    resize: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: 16,
                                    color,
                                    padding: 4,
                                    overflow: 'hidden'
                                }}
                                value={activeTextBox.value}
                                placeholder={!activeTextBox.touched ? "Start typing here" : undefined}
                                onChange={e => {
                                    const textarea = e.target as HTMLTextAreaElement;
                                    setActiveTextBox(prev =>
                                        prev
                                            ? {
                                                ...prev,
                                                value: textarea.value,
                                                height: Math.max(38, textarea.scrollHeight),
                                                touched: true,
                                            }
                                            : null
                                    );
                                }}
                                rows={1}
                                onFocus={() =>
                                    setActiveTextBox(prev =>
                                        prev ? { ...prev, focused: true } : null
                                    )
                                }
                                onBlur={() => {
                                    // Only save if there's text
                                    if (activeTextBox.value.trim()) {
                                        const stroke: TextStroke = {
                                            tool: 'text',
                                            color,
                                            points: [{ x: activeTextBox.x, y: activeTextBox.y }],
                                            size,
                                            text: activeTextBox.value,
                                            width: activeTextBox.width,
                                            height: activeTextBox.height
                                        };
                                        setHistory(h => [...h, stroke]);
                                        socket.emit('whiteboard-action', { roomId, action: { type: 'text', stroke } });
                                    }
                                    setActiveTextBox(null);
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') setActiveTextBox(null);
                                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                        e.currentTarget.blur();
                                    }
                                }}
                                maxLength={500}
                            />
                            {/* Resize handle */}
                            <div
                                className="resize-handle"
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    bottom: 0,
                                    width: 18,
                                    height: 18,
                                    cursor: 'nwse-resize',
                                    background: 'rgba(0,0,0,0.07)',
                                    borderBottomRightRadius: 4
                                }}
                                onMouseDown={e => {
                                    e.stopPropagation();
                                    setActiveTextBox(prev =>
                                        prev ? { ...prev, isResizing: true } : null
                                    );
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
