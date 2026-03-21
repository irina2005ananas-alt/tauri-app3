import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, FileText } from 'lucide-react';

type Props = {
    id: string;
    name: string;
    date: string;
};

export default function ProjectCard({ id, name, date }: Props) {
    return (
        <Link to={`/editor/${id}`}>
            <motion.article
                className="bg-slate-900 rounded-xl p-6 border border-slate-800 cursor-pointer"
                whileHover={{
                    scale: 1.05,
                    y: -5,
                    borderColor: '#3b82f6',
                    transition: { type: 'spring', stiffness: 300 }
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="text-blue-500" size={24} />
                    <h3 className="text-lg font-semibold text-white">{name}</h3>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar size={16} />
                    <span>{new Date(date).toLocaleDateString()}</span>
                </div>
            </motion.article>
        </Link>
    );
}