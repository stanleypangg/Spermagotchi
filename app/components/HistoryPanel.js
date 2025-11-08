'use client';

import styles from '../page.module.css';

export default function HistoryPanel({ history, loading }) {
  return (
    <div className={styles.historyPanel}>
      <div className={styles.panelHeader}>
        <h3>Recent Days</h3>
        {loading && <span className={styles.subtleText}>Loading...</span>}
      </div>
      {history.length === 0 ? (
        <p className={styles.subtleText}>
          No history yet. Log a check-in to see progress here.
        </p>
      ) : (
        <ul className={styles.historyList}>
          {history
            .slice()
            .reverse()
            .map((entry) => (
              <li key={entry.date} className={styles.historyItem}>
                <div className={styles.historyDate}>{entry.date}</div>
                <div className={styles.historyStats}>
                  <span>😊 {entry.stats.happiness}</span>
                  <span>⚡ {entry.stats.vitality}</span>
                  <span>🏊 {entry.stats.motility}</span>
                  <span>🧬 {entry.stats.morphology}</span>
                </div>
                <div className={styles.historyDerived}>
                  <span>Health {entry.overallHealthScore}</span>
                  <span>Perf {entry.performanceRating}</span>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

