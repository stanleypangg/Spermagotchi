'use client';

import styles from '../page.module.css';

export default function SettingsPanel({ loading, onReset }) {
  return (
    <div className={styles.settingsPanel}>
      <h3>Buddy Settings</h3>
      <p className={styles.subtleText}>
        Want a fresh start? Hatch a new buddy and begin again.
      </p>
      <button className={styles.resetButton} onClick={onReset} disabled={loading}>
        {loading ? 'Working...' : 'Hatch New Buddy'}
      </button>
    </div>
  );
}

