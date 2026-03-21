import { useParams, useNavigate } from 'react-router-dom';

const Editor = () => {
    const { id } = useParams<{ id: string }>();
    // возврат на предыдущую страницу
    const navigate = useNavigate();
    // Функция возврата в галерею
    const goBack = () => {
        navigate('/');
    };
    // Функция сохранения
    const saveProject = () => {
        console.log('Проект сохранен!', { id });
        alert(`Проект ${id === 'new' ? ' создан' : 'сохранен'}!`);
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a'
        }}>
            {/* Верхняя панел */}
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
                    🌸 Сохранить
                </button>
            </header>

            {/* Основная */}
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden'
            }}>
                {/* Левая панель */}
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
                    <button
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#334155',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#94a3b8',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#475569';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#334155';
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        🌸
                    </button>

                    <button
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#334155',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#94a3b8',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#475569';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#334155';
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        🌸
                    </button>

                    <button
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#334155',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#94a3b8',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#475569';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#334155';
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        🌸
                    </button>
                </aside>

                {/* Центральная зона */}
                <main style={{
                    flex: 1,
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                        borderRadius: '0.5rem',
                        width: '100%',
                        height: '100%',
                        maxWidth: '1024px',
                        maxHeight: 'calc(100vh - 120px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '1rem'
                    }}>
                        🌸 Тут будут каляки боляки
                    </div>
                </main>

                {/* Правая панель (Свойства) */}
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
                        Здесь будет что-то
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
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Editor;