'use client';

import styles from '../page.module.css';

export default function DerivedBadge({ label, value, accent }) {
  return (
    <div className={styles.derivedBadge} style={{ borderColor: accent }}>
      <div className={styles.derivedLabel}>{label}</div>
      <div className={styles.derivedValue}>{value}</div>
    </div>
  );
}

