'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  const experiences = [
    {
      title: "3D Product Configurator",
      path: "/configurator",
      badge: "Commercial Pitch",
      description: "Interactive WebAR product customization. Allows clients to swap materials, trigger mechanical water flow animations, and test placing products on real-world surfaces with custom gestures.",
      color: "#3b82f6",
      glowColor: "rgba(59, 130, 246, 0.15)",
      features: ["Material Swaps (Gold, Silver, Black)", "Flow Animations", "Pinch & Twist Gestures", "Ambient Lighting reflections"]
    },
    {
      title: "3D Turbofan Engine AR",
      path: "/exploded-view",
      badge: "Industrial Showcase",
      description: "High-precision WebAR placement of a complex jet engine. Ideal for industrial pitches, demonstrating real-world scale rendering and high-density poly CAD meshes.",
      color: "#f97316",
      glowColor: "rgba(249, 115, 22, 0.15)",
      features: ["Turbofan Engine Mesh", "SLAM Ground Tracking", "Micro-calibrated Height", "Scale & Rotate Gestures"]
    },
    {
      title: "Classic Faucet Demo",
      path: "/aframe-cactus/dist/index.html",
      badge: "Legacy Baseline",
      isStatic: true,
      description: "Baseline WebAR ground placement demo showcasing A-Frame integration. Spawns the decimated animated Delta Faucet model with classic material buttons and baseline slam tracking.",
      color: "#10b981",
      glowColor: "rgba(16, 185, 129, 0.15)",
      features: ["SLAM Ground Reticle", "Bouncy Scale Easing", "Decimated Faucet mesh", "Water Flow Playback"]
    }
  ];

  return (
    <div style={styles.container}>
      {/* Background Gradients */}
      <div style={styles.radialGlow1}></div>
      <div style={styles.radialGlow2}></div>

      {/* Content wrapper */}
      <div style={styles.wrapper}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <h2 style={styles.heroTitle}>WebAR Capabilities</h2>
          <p style={styles.heroSubtitle}>
            A showcase of advanced web-based augmented reality experiences built with spatial tracking and A-Frame. Navigate through routes to see standalone capabilities designed for commercial and industrial pitches.
          </p>
        </section>

        {/* Grid of Experiences */}
        <div style={styles.grid}>
          {experiences.map((exp, idx) => {
            const CardContent = (
              <div 
                style={{
                  ...styles.card,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: `0 10px 30px rgba(0, 0, 0, 0.4), 0 0 30px ${exp.glowColor}`
                }}
                className="portfolio-card"
                key={idx}
              >
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.cardBadge, color: exp.color, borderColor: `${exp.color}33`, background: `${exp.color}12` }}>
                    {exp.badge}
                  </span>
                </div>
                <h3 style={styles.cardTitle}>{exp.title}</h3>
                <p style={styles.cardDescription}>{exp.description}</p>

                <h4 style={styles.featureTitle}>Features demonstrated:</h4>
                <div style={styles.featuresContainer}>
                  {exp.features.map((feat, fIdx) => (
                    <span key={fIdx} style={styles.featureBadge}>
                      {feat}
                    </span>
                  ))}
                </div>

                <div style={styles.cardAction}>
                  <span style={{ ...styles.actionText, color: exp.color }}>Launch Experience</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={exp.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={styles.actionArrow}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            );

            return exp.isStatic ? (
              <a href={exp.path} key={idx} style={{ textDecoration: 'none' }}>
                {CardContent}
              </a>
            ) : (
              <Link href={exp.path} key={idx} style={{ textDecoration: 'none' }}>
                {CardContent}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>© {new Date().getFullYear()} Aether 3D Labs. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#030303',
    color: '#ffffff',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  radialGlow1: {
    position: 'absolute',
    top: '-10%',
    left: '10%',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  radialGlow2: {
    position: 'absolute',
    bottom: '-10%',
    right: '10%',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, rgba(0, 0, 0, 0) 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  wrapper: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '80px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.3px',
  },
  headerBadge: {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '1px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '6px 14px',
    borderRadius: '30px',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '720px',
    margin: '0 auto 80px auto',
  },
  heroTitle: {
    fontSize: '44px',
    fontWeight: 700,
    letterSpacing: '-1.5px',
    marginBottom: '20px',
    background: 'linear-gradient(to right, #ffffff, #999999)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '30px',
    marginBottom: '80px',
  },
  card: {
    background: 'rgba(12, 12, 12, 0.5)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '32px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '20px',
  },
  cardBadge: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    padding: '4px 12px',
    borderRadius: '30px',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  },
  cardDescription: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '28px',
    flexGrow: 1,
  },
  featureTitle: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: '12px',
  },
  featuresContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '32px',
  },
  featureBadge: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  cardAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: 'auto',
  },
  actionText: {
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionArrow: {
    transition: 'transform 0.2s',
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '13px',
  }
};
