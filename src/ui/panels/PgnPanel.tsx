import styles from './PgnPanel.module.css';

type PgnPanelProps = {
  pgn: string;
  error?: string;
  onChange: (value: string) => void;
  onImport: () => void;
  onExport: () => void;
};

function PgnPanel({ pgn, error, onChange, onImport, onExport }: PgnPanelProps) {
  return (
    <div className={styles.panel}>
      <textarea
        className={styles.textarea}
        value={pgn}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste PGN here to import or export the current game."
      />
      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={onImport}>
          Import PGN
        </button>
        <button type="button" className={styles.actionButton} onClick={onExport}>
          Export PGN
        </button>
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export default PgnPanel;
