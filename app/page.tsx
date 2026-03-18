"use client";

import Link from "next/link";
import {
  FileImage, Minimize, Crop, RefreshCw, Layers, ShieldCheck,
  Settings2, FileMinus, FilePlus, Zap, FileDown,
  Image as ImageIcon, Type, Ghost, FileSignature
} from "lucide-react";
import styles from "./page.module.css";

const IMAGE_TOOLS = [
  { id: "compress-image", title: "Compress Image", desc: "Reduce file size to an exact target without losing quality.", icon: <Minimize size={24} />, href: "/tools/compress-image" },
  { id: "resize-image", title: "Resize Image", desc: "Change dimensions by percentage or exact pixels.", icon: <Crop size={24} />, href: "/tools/resize-image" },
  { id: "convert-image", title: "Convert Image", desc: "Convert between JPG, PNG, WebP, SVG, and HEIC.", icon: <RefreshCw size={24} />, href: "/tools/convert-image" },
  { id: "edit-image", title: "Photo Editor", desc: "Adjust brightness, contrast, crop, rotate, and filter.", icon: <Settings2 size={24} />, href: "/tools/edit-image" },
  { id: "watermark-image", title: "Watermark Image", desc: "Stamp text or tiled patterns onto your images securely.", icon: <Type size={24} />, href: "/tools/watermark-image" },
  { id: "remove-exif", title: "Remove EXIF Data", desc: "Scrub metadata and GPS locations from photos for privacy.", icon: <Ghost size={24} />, href: "/tools/remove-exif" },
];

const PDF_TOOLS = [
  { id: "compress-pdf", title: "Compress PDF", desc: "Hit an exact target size by intuitively down-sampling images.", icon: <FileDown size={24} />, href: "/tools/compress-pdf" },
  { id: "merge-pdf", title: "Merge PDF", desc: "Combine multiple PDF files into one single document.", icon: <FilePlus size={24} />, href: "/tools/merge-pdf" },
  { id: "split-pdf", title: "Split PDF", desc: "Extract pages or separate a document into multiple files.", icon: <FileMinus size={24} />, href: "/tools/split-pdf" },
  { id: "organize-pdf", title: "Organize PDF", desc: "Visually reorder, delete, and rotate pages.", icon: <Layers size={24} />, href: "/tools/organize-pdf" },
  { id: "pdf-to-image", title: "PDF to Image", desc: "Convert each page of your PDF into high-res images.", icon: <FileImage size={24} />, href: "/tools/pdf-to-image" },
  { id: "image-to-pdf", title: "Image to PDF", desc: "Compile a collection of images into one PDF book.", icon: <ImageIcon size={24} />, href: "/tools/image-to-pdf" },
  { id: "protect-pdf", title: "Protect / Unlock", desc: "Encrypt or unlock your PDF document with a password.", icon: <ShieldCheck size={24} />, href: "/tools/protect-pdf" },
  { id: "watermark-pdf", title: "Watermark PDF", desc: "Add text stamps and page numbers to your documents.", icon: <FileSignature size={24} />, href: "/tools/watermark-pdf" },
];

export default function Home() {
  return (
    <>
      <div className={styles.glowBg} />

      {/* Navbar */}
      <nav className={`${styles.navbar} glass`}>
        <div className={`container ${styles.navContent}`}>
          <div className={styles.logo}>
            a<span>to</span>z
          </div>
          <div>
            <Link href="https://github.com/beingrahuul" target="_blank" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`container ${styles.main}`}>

        {/* Hero Section */}
        <section className={`${styles.hero} animate-fade-in-up`}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59,130,246,0.1)", color: "var(--accent-color)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600", marginBottom: "24px" }}>
            <Zap size={14} /> 100% Client-Side Processing
          </div>
          <h1 className={styles.title}>
            The Ultimate <span className="text-gradient">Local</span> Toolkit
          </h1>
          <p className={styles.subtitle}>
            Process, compress, convert, and edit your PDFs and images with complete privacy. Everything runs directly in your browser. No servers. No uploads. Fast and secure.
          </p>
          <div className={styles.heroActions}>
            <a href="#image-tools" className="btn-primary">
              <ImageIcon size={18} /> Image Tools
            </a>
            <a href="#pdf-tools" className="btn-secondary">
              <FileImage size={18} /> PDF Tools
            </a>
          </div>
        </section>

        {/* Image Tools Grid */}
        <section id="image-tools" style={{ animationDelay: "0.1s" }} className="animate-fade-in-up">
          <h2 className={styles.sectionTitle}>
            <ImageIcon className="text-gradient-accent" size={32} /> Image Tools
          </h2>
          <div className={styles.grid}>
            {IMAGE_TOOLS.map((tool) => (
              <Link href={tool.href} key={tool.id} className={`${styles.card} glass-panel`}>
                <div className={styles.cardContent}>
                  <div className={styles.iconWrapper}>
                    {tool.icon}
                  </div>
                  <h3 className={styles.cardTitle}>{tool.title}</h3>
                  <p className={styles.cardDesc}>{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PDF Tools Grid */}
        <section id="pdf-tools" style={{ animationDelay: "0.2s" }} className="animate-fade-in-up">
          <h2 className={styles.sectionTitle}>
            <FileImage className="text-gradient-accent" size={32} /> PDF Tools
          </h2>
          <div className={styles.grid}>
            {PDF_TOOLS.map((tool) => (
              <Link href={tool.href} key={tool.id} className={`${styles.card} glass-panel`}>
                <div className={styles.cardContent}>
                  <div className={styles.iconWrapper}>
                    {tool.icon}
                  </div>
                  <h3 className={styles.cardTitle}>{tool.title}</h3>
                  <p className={styles.cardDesc}>{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
