import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Award, Briefcase, Camera, Film, Layers, Monitor, PenTool, Star, Video, Zap } from 'lucide-react';

const About = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -100]);
    const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mouseX.set(clientX - centerX);
        mouseY.set(clientY - centerY);
    };

    const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
    const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

    const services = [
        { icon: <Film size={32} />, title: "Cinematic Video", desc: "High-end production for movies and series." },
        { icon: <PenTool size={32} />, title: "Publicity Design", desc: "Posters, banners, and marketing assets." },
        { icon: <Monitor size={32} />, title: "UI/UX Design", desc: "Digital interfaces that captivate users." },
        { icon: <Camera size={32} />, title: "Photography", desc: "Professional shoots and retouching." }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden" onMouseMove={handleMouseMove}>

            {/* Hero Section with Parallax */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <motion.div
                    style={{ y: y1, opacity: opacityHero }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent mix-blend-overlay"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>
                </motion.div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl mb-8"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Established 2022</span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-[1.1]">
                            Crafting <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">Digital Legacy</span>
                        </h1>

                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mb-10 leading-relaxed font-medium">
                            MH Creation X is a premier design and production studio founded by Moazzem Hossen. We blend cinematic storytelling with cutting-edge visual design.
                        </p>

                        <div className="flex gap-6">

                            <motion.a
                                href="mailto:mhcreationx@gmail.com"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Start Collaboration
                            </motion.a>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{ x: springX, y: springY }}
                        className="relative hidden md:block"
                    >
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 transform rotate-[-5deg] hover:rotate-0 transition-all duration-500">
                            {/* Use DTLS images */}
                            <img src="/DTLS/PHOTO-1.jpg" alt="Moazzem Hossen" className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-100" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                                <div>
                                    <p className="text-white font-black text-xl">Moazzem Hossen</p>
                                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Founder & Creative Director</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element - Transparent PNG */}
                        <motion.div
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-10 -right-10 w-48 z-20"
                        >
                            <img src="/DTLS/MH-Logo-Dark.png" alt="Logo" className="w-full h-auto drop-shadow-2xl opacity-90 dark:invert" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-32 bg-white dark:bg-slate-900 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Our Expertise</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter">Creative Arsenal</h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {services.map((service, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="liquid-glass-card p-8 rounded-[2rem] group hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-500/15"
                            >
                                <div className="w-16 h-16 bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white shadow-md mb-6 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:text-white transition-all backdrop-blur-md">
                                    {service.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{service.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {service.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founder Story with Split Reveal */}
            <section className="py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                    <motion.div
                        className="relative order-2 md:order-1"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl">
                            <img src="/DTLS/PHOTO-2.jpg" alt="Studio" className="w-full h-auto object-cover" />
                        </div>
                        <div className="absolute -top-10 -left-10 w-full h-full border-2 border-indigo-500/20 rounded-[3rem] -z-0 transform rotate-6"></div>
                    </motion.div>

                    <div className="order-1 md:order-2">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">The Visionary</h2>
                        <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            <p>
                                "Design is not just about making things look good. It's about communicating feelings, stories, and ideas that resonate."
                            </p>
                            <p>
                                Founded in 2022, MH Creation X started as a passion project and evolved into a full-scale production house. Moazzem Hossen leads the team with a distinct visual style that combines modern aesthetics with traditional cinematic principles.
                            </p>
                        </div>

                        <div className="mt-12 flex gap-12">
                            <div>
                                <h4 className="text-4xl font-black text-indigo-600">500+</h4>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Projects Completed</p>
                            </div>
                            <div>
                                <h4 className="text-4xl font-black text-rose-500">50+</h4>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Happy Clients</p>
                            </div>
                            <div>
                                <h4 className="text-4xl font-black text-cyan-500">2+</h4>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Years Excellence</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default About;
