'use client';

import Image from 'next/image';
import styles from '../page.module.css';
import neutralSprite from '@/public/neutral.png';

export default function LandingScreen({
  name,
  onNameChange,
  onSubmit,
  creating,
  error,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main className={styles.landingContainer}>
      <div className={styles.landingShell}>
        <div className={styles.landingHeader}>
          <span className={styles.landingBadge}>Welcome to Sperm Buddy</span>
          <h1>Hatch Your New Pal</h1>
          <p>
            Start the adventure by naming your sperm buddy. Check in daily to keep them happy,
            healthy, and ready for the big race.
          </p>
        </div>

        <div className={styles.landingHero}>
          <div className={styles.landingHalo} />
          <Image
            src={neutralSprite}
            alt="New sperm buddy illustration"
            width={240}
            height={240}
            priority
            className={styles.landingImage}
          />
        </div>

        <form className={styles.landingForm} onSubmit={handleSubmit}>
          <div className={styles.landingInputGroup}>
            <label htmlFor="sperm-name">Name Your Buddy</label>
            <input
              id="sperm-name"
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Splash, Bolt, Luna"
              maxLength={24}
              autoComplete="off"
            />
          </div>
          {error && <p className={styles.landingError}>{error}</p>}
          <button className={styles.startButton} type="submit" disabled={creating}>
            {creating ? 'Hatching...' : 'Start the Adventure'}
          </button>
        </form>

        <div className={styles.landingTips}>
          <strong>Pro tip:</strong>
          <span>Daily check-ins boost stats and unlock special milestones.</span>
        </div>
      </div>
    </main>
  );
}

