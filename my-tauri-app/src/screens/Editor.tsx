import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CanvasScene from '../components/CanvasScene';
import { ShapeFactory } from '../lib/shapes';
import type { Shape } from '../lib/shapes';

type ToolType = 'select' | 'rect' | 'line' | 'oval' | 'triangle' | 'quadraticBezier' | 'cubicBezier' | 'pathBezier';

const Editor = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [lineAlg, setLineAlg] = useState<"bresenham" | "wu">("bresenham");
    const [activeTool, setActiveTool] = useState<ToolType>("select");
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Функция возврата в галерею
    const goBack = () => {
        navigate('/');
    };

    // Функция сохранения
    const saveProject = () => {
        console.log('Проект сохранен!', { id, shapes: shapes.length });
        alert(`Проект ${id === 'new' ? 'создан' : 'сохранен'}!`);
    };

    // Создание фигуры
    const createShape = (type: ToolType) => {
        if (type === 'select') return;

        const shapeId = `${type}_${Date.now()}`;
        const transform = {
            x: 200 + Math.random() * 150,
            y: 200 + Math.random() * 150,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        };

        let shape: Shape;

        switch (type) {
            case 'rect':
                shape = ShapeFactory.createRect(shapeId, transform, 80 + Math.random() * 60, 60 + Math.random() * 40);
                shape.fillColor = { r: 59, g: 130, b: 246, a: 200 };
                shape.strokeColor = { r: 255, g: 255, b: 255, a: 255 };
                shape.strokeWidth = 2;
                break;
            case 'line':
                shape = ShapeFactory.createLine(shapeId, transform, -50, 0, 50, 0);
                shape.strokeColor = { r: 255, g: 136, b: 0, a: 255 };
                shape.strokeWidth = 6;
                break;
            case 'oval':
                shape = ShapeFactory.createOval(shapeId, transform, 50 + Math.random() * 30, 30 + Math.random() * 20);
                shape.fillColor = { r: 16, g: 185, b: 129, a: 180 };
                shape.strokeColor = { r: 255, g: 255, b: 255, a: 255 };
                shape.strokeWidth = 2;
                break;
            case 'triangle':
                shape = ShapeFactory.createTriangle(shapeId, transform,
                    { x: -40, y: 25 },
                    { x: 40, y: 25 },
                    { x: 0, y: -35 }
                );
                shape.fillColor = { r: 168, g: 85, b: 247, a: 200 };
                shape.strokeColor = { r: 255, g: 255, b: 255, a: 255 };
                shape.strokeWidth = 2;
                break;
            case 'quadraticBezier':
                shape = ShapeFactory.createQuadraticBezier(shapeId, transform,
                    { x: -60, y: 0 },
                    { x: 0, y: -50 },
                    { x: 60, y: 0 }
                );
                shape.strokeColor = { r: 6, g: 182, b: 212, a: 255 };
                shape.strokeWidth = 3;
                break;
            case 'cubicBezier':
                shape = ShapeFactory.createCubicBezier(shapeId, transform,
                    { x: -80, y: 0 },
                    { x: -30, y: -50 },
                    { x: 30, y: 50 },
                    { x: 80, y: 0 }
                );
                shape.strokeColor = { r: 236, g: 72, b: 153, a: 255 };
                shape.strokeWidth = 3;
                break;
            case 'pathBezier':
                const pts = [
                    { x: -80, y: 10 },
                    { x: -40, y: -30 },
                    { x: 0, y: 80 },
                    { x: 40, y: -20 },
                    { x: 80, y: 5 }
                ];
                shape = ShapeFactory.createPathBezier(shapeId, transform, pts, 'catmull', true);
                shape.strokeColor = { r: 251, g: 191, b: 36, a: 255 };
                shape.strokeWidth = 3;
                break;
            default:
                return;
        }

        if ((window as any).__canvasScene) {
            (window as any).__canvasScene.addShape(shape);
        }

        setActiveTool('select');
    };

    const handleShapesChange = (newShapes: Shape[]) => {
        setShapes(newShapes);
    };

    const handleSelectedIdChange = (id: string | null) => {
        setSelectedId(id);
    };

    // Перемещение по слоям
    const moveLayerUp = () => {
        if (!selectedId) return;
        const manager = (window as any).__canvasScene?.getManager?.();
        if (manager) {
            manager.moveUp(selectedId);
            const updatedShapes = manager.getShapes();
            setShapes(updatedShapes);
        }
    };

    const moveLayerDown = () => {
        if (!selectedId) return;
        const manager = (window as any).__canvasScene?.getManager?.();
        if (manager) {
            manager.moveDown(selectedId);
            const updatedShapes = manager.getShapes();
            setShapes(updatedShapes);
        }
    };

    // Иконки для кнопок
    const tools = [
        { id: 'select' as const, label: '🖱️', title: 'Выбор' },
        { id: 'rect' as const, label: '▭', title: 'Прямоугольник' },
        { id: 'line' as const, label: '╱', title: 'Линия' },
        { id: 'oval' as const, label: '◯', title: 'Овал' },
        { id: 'triangle' as const, label: '△', title: 'Треугольник' },
        { id: 'quadraticBezier' as const, label: '⏣', title: 'Квадр. Безье' },
        { id: 'cubicBezier' as const, label: '⏣', title: 'Куб. Безье' },
        { id: 'pathBezier' as const, label: '～', title: 'Path' },
    ];

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a'
        }}>
            {/* Верхняя панель */}
            <header style={{
                height: '56px',
                borderBottom: '1px solid #334155',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={goBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#334155';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                    >
                        ← Назад
                    </button>

                    <h2 style={{
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        color: '#f1f5f9'
                    }}>
                        {id === 'new' ? '🌸 Новый проект' : `🌸 Редактирование проекта #${id}`}
                    </h2>
                </div>

                <button
                    onClick={saveProject}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                >
                    💾 Сохранить
                </button>
            </header>

            {/* Основная область */}
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden'
            }}>
                {/* Левая панель инструментов */}
                <aside style={{
                    width: '64px',
                    borderRight: '1px solid #334155',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '1rem 0',
                    gap: '0.5rem',
                    flexShrink: 0,
                    overflowY: 'auto'
                }}>
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: activeTool === tool.id ? '#3b82f6' : '#334155',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: activeTool === tool.id ? 'white' : '#94a3b8',
                                fontSize: '1.1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={tool.title}
                            onMouseEnter={(e) => {
                                if (activeTool !== tool.id) {
                                    e.currentTarget.style.backgroundColor = '#475569';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTool !== tool.id) {
                                    e.currentTarget.style.backgroundColor = '#334155';
                                    e.currentTarget.style.color = '#94a3b8';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }
                            }}
                            onClick={() => {
                                setActiveTool(tool.id);
                                if (tool.id !== 'select') {
                                    createShape(tool.id);
                                }
                            }}
                        >
                            {tool.label}
                        </button>
                    ))}

                    <div style={{
                        width: '40px',
                        height: '1px',
                        backgroundColor: '#334155',
                        margin: '0.5rem 0'
                    }} />

                    <button
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#334155',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#94a3b8',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Алгоритм линии"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#475569';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#334155';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                        onClick={() => setLineAlg(lineAlg === 'bresenham' ? 'wu' : 'bresenham')}
                    >
                        {lineAlg === 'bresenham' ? 'Б' : 'В'}
                    </button>
                </aside>

                {/* Центральная зона с канвасом */}
                <main style={{
                    flex: 1,
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.5rem',
                        width: '100%',
                        height: '100%',
                        maxWidth: '1024px',
                        maxHeight: 'calc(100vh - 120px)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <CanvasScene
                            lineAlg={lineAlg}
                            onShapesChange={handleShapesChange}
                            onSelectedIdChange={handleSelectedIdChange}
                            externalSelectedId={selectedId}
                        />
                    </div>
                </main>

                {/* Правая панель (Свойства + Слои) */}
                <aside style={{
                    width: '280px',
                    borderLeft: '1px solid #334155',
                    backgroundColor: '#1e293b',
                    padding: '1rem',
                    flexShrink: 0,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '1rem'
                    }}>
                        📐 Свойства
                    </h3>

                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        borderRadius: '0.375rem',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            marginBottom: '0.5rem'
                        }}>
                            Информация:
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#cbd5e1'
                        }}>
                            Проект: {id}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#cbd5e1'
                        }}>
                            Фигур: {shapes.length}
                        </div>
                        {selectedId && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#60a5fa',
                                marginTop: '0.25rem'
                            }}>
                                ✅ Выбрано: {selectedId.slice(0, 16)}...
                            </div>
                        )}
                    </div>

                    {/* ===== СЛОИ С КНОПКАМИ ВВЕРХ/ВНИЗ ===== */}
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        borderRadius: '0.375rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                📋 Слои
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={moveLayerUp}
                                    disabled={!selectedId}
                                    style={{
                                        padding: '2px 8px',
                                        fontSize: '14px',
                                        backgroundColor: selectedId ? '#3b82f6' : '#475569',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: selectedId ? 'pointer' : 'not-allowed',
                                        opacity: selectedId ? 1 : 0.5
                                    }}
                                    title="Переместить выше"
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={moveLayerDown}
                                    disabled={!selectedId}
                                    style={{
                                        padding: '2px 8px',
                                        fontSize: '14px',
                                        backgroundColor: selectedId ? '#3b82f6' : '#475569',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: selectedId ? 'pointer' : 'not-allowed',
                                        opacity: selectedId ? 1 : 0.5
                                    }}
                                    title="Переместить ниже"
                                >
                                    ↓
                                </button>
                            </div>
                        </div>

                        {shapes.length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Нет фигур
                            </div>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto', flex: 1 }}>
                                {shapes.map((s, index) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            padding: '4px 8px',
                                            marginBottom: '2px',
                                            borderRadius: '4px',
                                            backgroundColor: selectedId === s.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            color: selectedId === s.id ? '#60a5fa' : '#94a3b8',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            justifyContent: 'space-between'
                                        }}
                                        onClick={() => {
                                            if ((window as any).__canvasScene) {
                                                (window as any).__canvasScene.selectShape(s.id);
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedId !== s.id) {
                                                e.currentTarget.style.backgroundColor = '#334155';
                                                e.currentTarget.style.color = '#e2e8f0';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedId !== s.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = '#94a3b8';
                                            }
                                        }}
                                    >
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            flex: 1
                                        }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: selectedId === s.id ? '#60a5fa' : '#475569',
                                                flexShrink: 0
                                            }} />
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', flexShrink: 0 }}>
                                                #{index + 1}
                                            </span>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.id.slice(0, 14)}...
                                            </span>
                                        </span>
                                        <span style={{
                                            fontSize: '9px',
                                            color: '#475569'
                                        }}>
                                            {s.constructor.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Editor;