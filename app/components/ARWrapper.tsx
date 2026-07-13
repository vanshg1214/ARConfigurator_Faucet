'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ARWrapperProps {
  src: string;
  title: string;
  description: string;
  features: string[];
}

export default function ARWrapper({ src, title, description, features }: ARWrapperProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div style={styles.container}>
      {/* Floating Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link href="/" style={styles.backButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </Link>
          <div style={styles.divider}></div>
          <h1 style={styles.title}>{title}</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.badge}>WebAR Experience</span>
          {/* Guide icon hidden for now */}
          {/* <button style={styles.infoToggle} onClick={() => setShowInfo(!showInfo)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span style={styles.infoText}>Guide</span>
          </button> */}
        </div>
      </header>

      {/* Slide-out Info Drawer */}
      {showInfo && (
        <div style={styles.drawerOverlay} onClick={() => setShowInfo(false)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <h2 style={styles.drawerTitle}>Experience Guide</h2>
              <button style={styles.closeBtn} onClick={() => setShowInfo(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p style={styles.drawerDescription}>{description}</p>
            <h3 style={styles.sectionTitle}>Interactive Features:</h3>
            <ul style={styles.featureList}>
              {features.map((feature, i) => (
                <li key={i} style={styles.featureItem}>
                  <svg style={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div style={styles.drawerFooter}>
              <div style={styles.instructions}>
                <strong>To begin:</strong> Tap the ground on your screen to place the 3D model, then use the bottom controls to configure colors or animations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main IFrame Container */}
      <div style={styles.iframeContainer}>
        <iframe
          src={src}
          style={styles.iframe}
          allow="camera; microphone; gyroscope; accelerometer; xr-spatial-tracking;"
          title={title}
        />
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: '#050505',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  header: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    height: '60px',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    borderRadius: '16px',
    background: 'rgba(10, 10, 10, 0.6)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    pointerEvents: 'auto',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    outline: 'none',
    transition: 'opacity 0.2s',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 500,
    letterSpacing: '-0.2px',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badge: {
    color: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.24)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ffffff',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '8px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  infoText: {
    display: 'inline',
  },
  iframeContainer: {
    width: '100%',
    height: '100%',
    border: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '100%',
    maxWidth: '420px',
    height: '100%',
    background: '#0d0d0d',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 24px',
    boxSizing: 'border-box',
    animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  drawerTitle: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    padding: '4px',
    outline: 'none',
    transition: 'color 0.2s',
  },
  drawerDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 40px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#ffffff',
    fontSize: '14px',
  },
  checkIcon: {
    color: '#10b981',
    flexShrink: 0,
  },
  drawerFooter: {
    marginTop: 'auto',
  },
  instructions: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px',
    lineHeight: '1.5',
  },
};
