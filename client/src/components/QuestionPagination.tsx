import React from 'react';

type PaginationItem = number | 'ellipsis';

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** Sliding window: always first/last, ellipsis in the gaps, window follows the current page. */
export function getQuestionPages(
  current: number,
  total: number,
  siblingCount = 1
): PaginationItem[] {
  if (total <= 0) return [];
  const safeCurrent = Math.min(Math.max(current, 1), total);
  const maxVisible = siblingCount * 2 + 5;

  if (total <= maxVisible) {
    return range(1, total);
  }

  const leftSibling = Math.max(safeCurrent - siblingCount, 1);
  const rightSibling = Math.min(safeCurrent + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + 2 * siblingCount;
    return [...range(1, leftCount), 'ellipsis', total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + 2 * siblingCount;
    return [1, 'ellipsis', ...range(total - rightCount + 1, total)];
  }

  return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', total];
}

interface QuestionPaginationProps {
  total: number;
  currentIndex: number;
  onChange: (index: number) => void;
}

export const QuestionPagination: React.FC<QuestionPaginationProps> = ({
  total,
  currentIndex,
  onChange
}) => {
  const currentPage = currentIndex + 1;
  const items = getQuestionPages(currentPage, total);

  return (
    <nav
      className="flex items-center justify-center flex-wrap gap-1"
      aria-label="Навигация по вопросам"
    >
      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item - 1)}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`min-w-8 h-8 px-1.5 rounded text-xs font-semibold tabular-nums transition ${
              item === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item}
          </button>
        )
      )}
    </nav>
  );
};
