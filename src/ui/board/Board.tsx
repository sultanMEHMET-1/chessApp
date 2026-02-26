import { FILES, RANKS } from '../../chess/constants';
import type { BoardPiece, LastMove } from '../../chess/types';
import styles from './Board.module.css';
import type { Square } from 'chess.js';

const COLOR_MODULUS = 2; // Used to alternate dark and light squares.

const PIECE_LABELS: Record<BoardPiece['type'], string> = {
  p: 'P',
  n: 'N',
  b: 'B',
  r: 'R',
  q: 'Q',
  k: 'K'
};

type BoardProps = {
  pieces: Record<Square, BoardPiece | null>;
  selectedSquare: Square | null;
  legalDestinations: Set<Square>;
  lastMove?: LastMove;
  onSquareClick: (square: Square) => void;
};

function Board({
  pieces,
  selectedSquare,
  legalDestinations,
  lastMove,
  onSquareClick
}: BoardProps) {
  return (
    <div className={styles.board} role="grid" aria-label="Chess board">
      {RANKS.map((rank, rankIndex) =>
        FILES.map((file, fileIndex) => {
          const square = `${file}${rank}` as Square;
          const piece = pieces[square];
          const isDark = (rankIndex + fileIndex) % COLOR_MODULUS === 1;
          const isSelected = selectedSquare === square;
          const isLegalDestination = legalDestinations.has(square);
          const isLastMoveSquare =
            lastMove?.from === square || lastMove?.to === square;

          const label = piece
            ? `${piece.color === 'w' ? 'White' : 'Black'} ${piece.type.toUpperCase()} on ${square}`
            : `Empty ${square}`;

          return (
            <button
              key={square}
              type="button"
              className={[
                styles.square,
                isDark ? styles.dark : styles.light,
                isSelected ? styles.selected : '',
                isLastMoveSquare ? styles.lastMove : ''
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid={`square-${square}`}
              data-legal-destination={isLegalDestination}
              onClick={() => onSquareClick(square)}
              aria-label={label}
            >
              {isLegalDestination && (
                <span className={styles.legalMarker} data-testid="legal-marker" />
              )}
              {piece && (
                <span
                  className={[
                    styles.piece,
                    piece.color === 'w' ? styles.whitePiece : styles.blackPiece
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {PIECE_LABELS[piece.type]}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

export default Board;
