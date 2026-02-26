import { GamePanel } from "../game/GamePanel";
import styles from "./AppShell.module.css";

const APP_TITLE = "Chess App";
const APP_TAGLINE = "Scaffolded workspace for upcoming chess features.";

export function AppShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Interface Shell</p>
          <h1 className={styles.title}>{APP_TITLE}</h1>
          <p className={styles.subtitle}>{APP_TAGLINE}</p>
        </div>
        <span className={styles.badge}>Engine offline</span>
      </header>

      <main className={styles.main}>
        <section className={styles.boardCard} aria-label="Board area">
          <GamePanel />
        </section>
      </main>

      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Analysis</h2>
        <p className={styles.sidebarText}>
          Engine analysis lines will appear here once integrated.
        </p>
        <div className={styles.sidebarCard}>
          <p className={styles.sidebarLabel}>No evaluation yet.</p>
        </div>
      </aside>
    </div>
  );
}
