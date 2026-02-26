import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.app}>
      <div className={styles.card}>
        <h1 className={styles.title}>Chess App</h1>
        <p className={styles.subtitle}>Scaffold ready for board UI.</p>
      </div>
    </div>
  );
}
