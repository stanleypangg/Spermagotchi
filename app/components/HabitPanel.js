'use client';

import styles from '../page.module.css';

export default function HabitPanel({
  today,
  habitForm,
  onHabitChange,
  onSubmit,
  submitting,
}) {
  return (
    <form className={styles.habitForm} onSubmit={onSubmit}>
      <div className={styles.formHeader}>
        <h3>Daily Care</h3>
        <span>{today}</span>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.toggleRow}>
          <span>Supplements</span>
          <input
            type="checkbox"
            checked={habitForm.tookSupplements}
            onChange={(event) => onHabitChange('tookSupplements', event.target.checked)}
          />
        </label>

        <label className={styles.sliderRow}>
          <div>
            Exercise <span>{habitForm.exerciseMinutes} min</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={habitForm.exerciseMinutes}
            onChange={(event) => onHabitChange('exerciseMinutes', Number(event.target.value))}
          />
        </label>

        <label className={styles.sliderRow}>
          <div>
            Hydration <span>{habitForm.drankWaterLiters} L</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={habitForm.drankWaterLiters}
            onChange={(event) => onHabitChange('drankWaterLiters', Number(event.target.value))}
          />
        </label>

        <label className={styles.sliderRow}>
          <div>
            Sleep <span>{habitForm.sleepHours} hrs</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={habitForm.sleepHours}
            onChange={(event) => onHabitChange('sleepHours', Number(event.target.value))}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Pineapple Snack</span>
          <input
            type="checkbox"
            checked={habitForm.atePineapple}
            onChange={(event) => onHabitChange('atePineapple', event.target.checked)}
          />
        </label>

        <label className={styles.toggleRow}>
          <span>Matcha / Tea</span>
          <input
            type="checkbox"
            checked={habitForm.drankMatchaOrTea}
            onChange={(event) => onHabitChange('drankMatchaOrTea', event.target.checked)}
          />
        </label>

        <label className={styles.sliderRow}>
          <div>
            Alcohol <span>{habitForm.alcoholUnits} drinks</span>
          </div>
          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={habitForm.alcoholUnits}
            onChange={(event) => onHabitChange('alcoholUnits', Number(event.target.value))}
          />
        </label>

        <label className={styles.sliderRow}>
          <div>
            Cigarettes <span>{habitForm.smokedCigarettes}</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={habitForm.smokedCigarettes}
            onChange={(event) =>
              onHabitChange('smokedCigarettes', Number(event.target.value))
            }
          />
        </label>
      </div>
      <button className={styles.submitButton} type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Check-In'}
      </button>
    </form>
  );
}

