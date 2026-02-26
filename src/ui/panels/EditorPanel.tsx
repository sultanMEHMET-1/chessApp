import { FILES } from '../../chess/constants';
import type { BoardPiece, EditorPosition, PlayerColor } from '../../chess/types';
import styles from './EditorPanel.module.css';

const EN_PASSANT_RANKS = [3, 6] as const; // Legal en passant target ranks.
const HALF_MOVE_MIN = 0; // Halfmove clock cannot be negative.
const FULL_MOVE_MIN = 1; // Fullmove counter starts at 1.

const PIECE_OPTIONS: Array<{ id: string; label: string; piece: BoardPiece | null }> = [
  { id: 'empty', label: 'Empty', piece: null },
  { id: 'wp', label: 'WP', piece: { color: 'w', type: 'p' } },
  { id: 'wn', label: 'WN', piece: { color: 'w', type: 'n' } },
  { id: 'wb', label: 'WB', piece: { color: 'w', type: 'b' } },
  { id: 'wr', label: 'WR', piece: { color: 'w', type: 'r' } },
  { id: 'wq', label: 'WQ', piece: { color: 'w', type: 'q' } },
  { id: 'wk', label: 'WK', piece: { color: 'w', type: 'k' } },
  { id: 'bp', label: 'BP', piece: { color: 'b', type: 'p' } },
  { id: 'bn', label: 'BN', piece: { color: 'b', type: 'n' } },
  { id: 'bb', label: 'BB', piece: { color: 'b', type: 'b' } },
  { id: 'br', label: 'BR', piece: { color: 'b', type: 'r' } },
  { id: 'bq', label: 'BQ', piece: { color: 'b', type: 'q' } },
  { id: 'bk', label: 'BK', piece: { color: 'b', type: 'k' } }
];

const EN_PASSANT_OPTIONS = [
  'None',
  ...FILES.flatMap((file) => EN_PASSANT_RANKS.map((rank) => `${file}${rank}`))
];

type EditorPanelProps = {
  editor: EditorPosition;
  selectedPiece: BoardPiece | null;
  isActive: boolean;
  error?: string;
  onToggleActive: (active: boolean) => void;
  onSelectPiece: (piece: BoardPiece | null) => void;
  onUpdateEditor: (editor: EditorPosition) => void;
  onApply: () => void;
};

function EditorPanel({
  editor,
  selectedPiece,
  isActive,
  error,
  onToggleActive,
  onSelectPiece,
  onUpdateEditor,
  onApply
}: EditorPanelProps) {
  const handleTurnChange = (value: PlayerColor) => {
    onUpdateEditor({ ...editor, turn: value });
  };

  const handleCastlingChange = (key: keyof EditorPosition['castling']) => {
    onUpdateEditor({
      ...editor,
      castling: {
        ...editor.castling,
        [key]: !editor.castling[key]
      }
    });
  };

  const handleEnPassantChange = (value: string) => {
    onUpdateEditor({
      ...editor,
      enPassant: value === 'None' ? null : (value as EditorPosition['enPassant'])
    });
  };

  const handleHalfmoveChange = (value: number) => {
    onUpdateEditor({
      ...editor,
      halfmoveClock: Math.max(HALF_MOVE_MIN, value)
    });
  };

  const handleFullmoveChange = (value: number) => {
    onUpdateEditor({
      ...editor,
      fullmoveNumber: Math.max(FULL_MOVE_MIN, value)
    });
  };

  const handleAllowIllegalChange = (value: boolean) => {
    onUpdateEditor({
      ...editor,
      allowIllegal: value
    });
  };

  return (
    <div className={styles.panel}>
      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => onToggleActive(event.target.checked)}
        />
        Enable editor mode
      </label>

      <div className={styles.palette}>
        {PIECE_OPTIONS.map((option) => {
          const isSelected =
            option.piece?.type === selectedPiece?.type &&
            option.piece?.color === selectedPiece?.color &&
            (option.piece !== null || selectedPiece === null);
          return (
            <button
              key={option.id}
              type="button"
              className={
                isSelected
                  ? `${styles.paletteButton} ${styles.paletteButtonActive}`
                  : styles.paletteButton
              }
              onClick={() => onSelectPiece(option.piece)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldRow}>
          <span>Side to move:</span>
          <label>
            <input
              type="radio"
              name="turn"
              checked={editor.turn === 'w'}
              onChange={() => handleTurnChange('w')}
            />
            White
          </label>
          <label>
            <input
              type="radio"
              name="turn"
              checked={editor.turn === 'b'}
              onChange={() => handleTurnChange('b')}
            />
            Black
          </label>
        </div>

        <div className={styles.fieldRow}>
          <span>Castling rights:</span>
          <label>
            <input
              type="checkbox"
              checked={editor.castling.whiteKingSide}
              onChange={() => handleCastlingChange('whiteKingSide')}
            />
            White K
          </label>
          <label>
            <input
              type="checkbox"
              checked={editor.castling.whiteQueenSide}
              onChange={() => handleCastlingChange('whiteQueenSide')}
            />
            White Q
          </label>
          <label>
            <input
              type="checkbox"
              checked={editor.castling.blackKingSide}
              onChange={() => handleCastlingChange('blackKingSide')}
            />
            Black K
          </label>
          <label>
            <input
              type="checkbox"
              checked={editor.castling.blackQueenSide}
              onChange={() => handleCastlingChange('blackQueenSide')}
            />
            Black Q
          </label>
        </div>

        <div className={styles.fieldRow}>
          <span>En passant:</span>
          <select
            className={styles.input}
            value={editor.enPassant ?? 'None'}
            onChange={(event) => handleEnPassantChange(event.target.value)}
          >
            {EN_PASSANT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldRow}>
          <span>Halfmove:</span>
          <input
            className={styles.input}
            type="number"
            min={HALF_MOVE_MIN}
            value={editor.halfmoveClock}
            onChange={(event) => handleHalfmoveChange(Number(event.target.value))}
          />
          <span>Fullmove:</span>
          <input
            className={styles.input}
            type="number"
            min={FULL_MOVE_MIN}
            value={editor.fullmoveNumber}
            onChange={(event) => handleFullmoveChange(Number(event.target.value))}
          />
        </div>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={editor.allowIllegal}
            onChange={(event) => handleAllowIllegalChange(event.target.checked)}
          />
          Allow illegal positions (analysis only)
        </label>
      </div>

      <button type="button" className={styles.applyButton} onClick={onApply}>
        Apply Position
      </button>

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export default EditorPanel;
