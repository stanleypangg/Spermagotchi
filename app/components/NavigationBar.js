'use client';

import styles from '../page.module.css';

export default function NavigationBar({ items, activeTab, onSelect }) {
  return (
    <nav className={styles.navbar}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.navButton} ${
            activeTab === item.id ? styles.navButtonActive : ''
          }`}
          type="button"
          onClick={() => onSelect(item.id)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

