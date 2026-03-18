import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './ToolLayout.module.css';

interface ToolLayoutProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

export default function ToolLayout({ title, description, icon, children }: ToolLayoutProps) {
    return (
        <>
            <nav className="glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '72px', display: 'flex', alignItems: 'center', zIndex: 100, borderBottom: '1px solid var(--border-color)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Link href="/" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem", border: "none" }}>
                        <ArrowLeft size={16} /> Back to Tools
                    </Link>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        a<span style={{ color: 'var(--accent-color)' }}>to</span>z
                    </div>
                </div>
            </nav>

            <main className={`container ${styles.layout} animate-fade-in`}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <div className={styles.iconWrapper}>{icon}</div>
                        {title}
                    </h1>
                    <p className={styles.description}>{description}</p>
                </div>

                <div className={styles.workspace}>
                    {children}
                </div>
            </main>
        </>
    );
}
