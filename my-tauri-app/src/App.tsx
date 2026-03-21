import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NavBar from './components/NavBar';
import Gallery from './screens/Gallery';
import Editor from './screens/Editor';

function App() {
    return (
        <BrowserRouter>
            <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
                <NavBar />
                <AnimatePresence mode="wait">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Gallery />
                                </motion.div>
                            }
                        />
                        <Route
                            path="/editor/:id"
                            element={
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Editor />
                                </motion.div>
                            }
                        />
                    </Routes>
                </AnimatePresence>
            </div>
        </BrowserRouter>
    );
}

export default App;