import { Link } from 'react-router-dom';

const NavBar = () => {
    return (
        <nav style={{
            borderBottom: '1px solid #334155',//1px — толщина линии solid — сплошная линия #334155 — темно-серый цвет (Tailwind/ slate-700)
            backgroundColor: '#0f172a',//#0f172a цвет фона (Tailwind/ slate-950)
            padding: '0 1rem'//0 — вертикальные сверху и снизу отступы = 0 1rem — горизонтальные слева и справа отступы = 16px
        }}>
            <div style={{
                maxWidth: '1280px', // максимальную ширину контейнера
                margin: '0 auto', // Центрирует контейнер по горизонтали;0 — отступ сверху и снизу; auto — автоматические отступы слева и справа
                display: 'flex', // горизонтальное строка расположения
                justifyContent: 'space-between', //равномерно распределяет элементы
                height: '64px' //высоту панели навигации
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem' //16*2 пикселя отступы между элементами, но не отступы по края
                }}>
                    {/* Логотип */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                background: 'linear-gradient(150deg, #F19CBB, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
              VectorThing
            </span>
                    </div>

                    {/* Навигационные ссылки */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link
                            to="/"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem', //0.5rem = 8px
                                padding: '0.5rem 0.75rem', //8px 12px
                                borderRadius: '0.375rem',
                                color: '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1e293b';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#cbd5e1';
                            }}
                        >
                            🌸 Галерея
                        </Link>

                        <Link
                            to="/editor/new"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                color: '#cbd5e1',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1e293b';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#cbd5e1';
                            }}
                        >
                            ➕ Создать проект
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;