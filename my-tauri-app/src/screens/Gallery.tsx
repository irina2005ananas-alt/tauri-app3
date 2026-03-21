import { useState } from 'react';
import { Link } from 'react-router-dom';
import {Folder} from "lucide-react";

interface Project {
    id: string;
    name: string;
    date: string;
}

const Gallery = () => {
    // для хранения проектов
    const [projects, setProjects] = useState<Project[]>([]);

    // Функция добавить проекта
    const addProject = () => {
        const newProject: Project = {
            id: Date.now().toString(), // уникальный ID из текущего времени
            name: `Новый проект ${projects.length + 1}`,
            date: new Date().toLocaleDateString('ru-RU')
        };
        setProjects([...projects, newProject]);
    };

    return (
        <div style={{
            minHeight: '100vh', //100% высоты экрана
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto'
            }}>
                {/* Заголовок и кнопка создания */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(150deg, #F19CBB, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem'
                        }}>
                            Мои проекты
                        </h1>
                        <p style={{ color: '#94a3b8' }}>
                            {projects.length} {projects.length === 1 ? 'проект' : projects.length < 5 ? 'проекта' : 'проектов'}
                        </p>
                    </div>

                    <button
                        onClick={addProject}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
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
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        ➕ Создать проект
                    </button>
                </div>

                {/* Список проектов */}
                {projects.length === 0 ? (
                    // Если проектов нет, показываем пустое состояние
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem',
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '1rem 0 1rem 0' ,
                        border: '1px solid #334155'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌸</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                            Нет проектов
                        </h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                            Создайте свой первый проект, чтобы начать работу
                        </p>
                        <button
                            onClick={addProject}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            Создать первый проект
                        </button>
                    </div>
                ) : (
                    // Если проекты есть, показываем сетку карточек
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/editor/${project.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div
                                    style={{
                                        backgroundColor: '#1e293b',
                                        borderRadius: '1rem 0 1rem 0' ,
                                        padding: '1.5rem',
                                        border: '1px solid #334155',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    className={""}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = '#3b82f6';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#334155';
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
                                        <Folder size={32} color={"pink"} strokeWidth={3}/>
                                    </div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '0.5rem' }}>
                                        {project.name}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                                        Создан: {project.date}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;