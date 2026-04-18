// src/screens/Editor.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CanvasScene } from '../components/CanvasScene';
import type { LineAlg } from '../lib/raster/RasterRenderer';

const Editor = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNewProject = id === 'new';
    const projectTitle = isNewProject ? 'Новый проект' : `Редактирование проекта #${id}`;

    const [lineAlg, setLineAlg] = useState<LineAlg>('bresenham');

    const goBack = () => navigate('/');

    const saveProject = () => {
        console.log('Проект сохранен!', { id });
        alert(`Проект ${isNewProject ? 'создан' : 'сохранен'}!`);
    };

    return (
        <motion.div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#0f172a'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Верхняя панель */}
            <header style={{
                height: '56px',
                borderBottom: '1px solid #334155',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={goBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
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
                        {projectTitle}
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Переключатель алгоритмов линий */}
                    <div style={{
                        display: 'flex',
                        gap: '0.25rem',
                        backgroundColor: '#0f172a',
                        borderRadius: '0.5rem',
                        padding: '0.25rem'
                    }}>
                        <button
                            onClick={() => setLineAlg('bresenham')}
                            style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: lineAlg === 'bresenham' ? '#3b82f6' : 'transparent',
                                color: lineAlg === 'bresenham' ? 'white' : '#94a3b8',
                                border: 'none'
                            }}
                        >
                            Брезенхем
                        </button>
                        <button
                            onClick={() => setLineAlg('wu')}
                            style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backgroundColor: lineAlg === 'wu' ? '#3b82f6' : 'transparent',
                                color: lineAlg === 'wu' ? 'white' : '#94a3b8',
                                border: 'none'
                            }}
                        >
                            Ву (сглаживание)
                        </button>
                    </div>

                    {/* Кнопка сохранения */}
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
                        Сохранить
                    </button>
                </div>
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
                    gap: '0.75rem'
                }}>
                    <button style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#334155',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        🖱️
                    </button>
                    <button style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#334155',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        📐
                    </button>
                    <button style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#334155',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        🔵
                    </button>
                </aside>

                {/* Центральная зона с Canvas */}
                <main style={{
                    flex: 1,
                    backgroundColor: '#e2e8f0',
                    padding: 0,
                    margin: 0,
                    overflow: 'hidden'
                }}>
                    <CanvasScene lineAlg={lineAlg} />
                </main>

                {/* Правая панель свойств */}
                <aside style={{
                    width: '256px',
                    borderLeft: '1px solid #334155',
                    backgroundColor: '#1e293b',
                    padding: '1rem'
                }}>
                    <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '1rem'
                    }}>
                        Свойства
                    </h3>
                    <p style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        lineHeight: '1.5'
                    }}>
                        Выберите объект на холсте для редактирования свойств.
                    </p>

                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#334155',
                        borderRadius: '0.375rem'
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
                            ID: {id}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#cbd5e1',
                            marginTop: '0.5rem'
                        }}>
                            Алгоритм: {lineAlg === 'wu' ? 'Сглаженные линии (Ву)' : 'Чёткие линии (Брезенхем)'}
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};

export default Editor;