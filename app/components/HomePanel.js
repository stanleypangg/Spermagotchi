'use client';

import styles from '../page.module.css';

export default function HomePanel({ latestCheckIn }) {
  return (
    <div className={styles.homePanel}>
      <h3>Hello, Caretaker!</h3>
      <p className={styles.subtleText}>
        Keep up daily habits to boost stats and prepare your buddy for future adventures.
      </p>
      {latestCheckIn ? (
        <div className={styles.infoCard}>
          <span>Last cared for:</span>
          <strong>{latestCheckIn.date}</strong>
        </div>
      ) : (
        <div className={styles.infoCard}>
          <span>No care yet today.</span>
          <strong>Jump into Habits to get started!</strong>
        </div>
      )}
    </div>
  );
}

