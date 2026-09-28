import React from 'react';
import { useAppStore } from '../store';
import { DollarSign, Package, CheckCircle, Clock, DownloadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const ClientDashboard: React.FC = () => {
    const { projects, currentCustomer } = useAppStore();

    // Filter projects for this customer just in case, though API should filter
    const clientProjects = projects;

    const totalAmount = clientProjects.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalPaid = clientProjects.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const balance = clientProjects.reduce((sum, p) => sum + Math.max(0, (p.price || 0) - (p.paidAmount || 0)), 0);

    const completedProjects = clientProjects.filter(p => p.status === 'Delivered').length;
    const inProgressProjects = clientProjects.filter(p => p.status === 'Running' || p.status === 'Pending').length;

    const handleDownload = async (projectId: string) => {
        try {
            const token = localStorage.getItem('mh_auth_token');
            const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
            const response = await fetch(`${apiBase}/projects/download.php?projectId=${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.download_url) {
                window.open(data.download_url, '_blank');
            } else {
                alert(data.error || 'Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to initiate download');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 pt-10">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800"
            >
                <h1 className="text-4xl font-black tracking-tight mb-3">
                    Welcome, {currentCustomer?.name}! 👋
                </h1>
                <p className="text-slate-500 font-bold">
                    Partner ID: <span className="text-indigo-600 font-mono text-lg">{currentCustomer?.id}</span>
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Projects"
                    value={clientProjects.length}
                    icon={<Package />}
                    color="indigo"
                />
                <StatCard
                    label="Delivered"
                    value={completedProjects}
                    icon={<CheckCircle />}
                    color="emerald"
                />
                <StatCard
                    label="In Progress"
                    value={inProgressProjects}
                    icon={<Clock />}
                    color="amber"
                />
                <StatCard
                    label="Balance Due"
                    value={`৳${balance.toLocaleString()}`}
                    icon={<DollarSign />}
                    color="rose"
                />
            </div>

            {/* Payment Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800"
            >
                <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Payment Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Total Bill</p>
                        <p className="text-3xl font-black">৳{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-widest">Total Paid</p>
                        <p className="text-3xl font-black text-emerald-600">৳{totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                        <p className="text-[10px] font-black uppercase text-rose-600 mb-2 tracking-widest">Balance Due</p>
                        <p className="text-3xl font-black text-rose-600">৳{balance.toLocaleString()}</p>
                    </div>
                </div>
            </motion.div>

            {/* Projects List */}
            <div>
                <h2 className="text-2xl font-black mb-8 uppercase tracking-tight px-2">Your Projects</h2>
                <div className="space-y-6">
                    {clientProjects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all"
                        >
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Project Image */}
                                <div className="w-full md:w-64 aspect-video md:aspect-square shrink-0 rounded-2xl overflow-hidden bg-slate-100">
                                    {project.images?.[0]?.url ? (
                                        <img
                                            src={project.images[0].url}
                                            alt={project.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">No Image</div>
                                    )}
                                </div>

                                {/* Project Details */}
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${project.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {project.status}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${project.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {project.paymentStatus}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">{project.title}</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-2">{project.category}</p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Total</p>
                                            <p className="font-bold">৳{project.price?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Paid</p>
                                            <p className="font-bold text-emerald-600">৳{project.paidAmount?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Due</p>
                                            <p className="font-bold text-rose-600">৳{Math.max(0, (project.price || 0) - (project.paidAmount || 0)).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Date</p>
                                            <p className="font-bold">{new Date(project.createDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Download Link */}
                                    {project.downloadLink && (
                                        <button
                                            onClick={() => handleDownload(project.id)}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20"
                                        >
                                            <DownloadCloud size={16} /> Download Assets
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, color }: any) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800"
    >
        <div className={`w-12 h-12 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center mb-4 text-${color}-600`}>
            {React.cloneElement(icon, { size: 24, className: `text-${color}-500` })}
        </div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
    </motion.div>
);

export default ClientDashboard;
