import { useState } from 'react';

export const VimShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 transition-colors"
        title="Vim shortcuts"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 544 544"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M260.5 0L0 0.5V544L260.5 0Z"
            fill="#019833"
          />
          <path
            d="M283.5 0H544V543.5L283.5 0Z"
            fill="#019833"
          />
          <path
            d="M272 67L67 544H167.5L272 272L376.5 544H477L272 67Z"
            fill="#CCCCCC"
          />
        </svg>
        <span className="text-sm text-gray-300 font-medium">Shortcuts</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-750">
              <div className="flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 544 544"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M260.5 0L0 0.5V544L260.5 0Z" fill="#019833" />
                  <path d="M283.5 0H544V543.5L283.5 0Z" fill="#019833" />
                  <path d="M272 67L67 544H167.5L272 272L376.5 544H477L272 67Z" fill="#CCCCCC" />
                </svg>
                <h3 className="text-lg font-bold text-white">Vim Shortcuts</h3>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* Columns */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Columns</h4>
                  <div className="space-y-1.5">
                    <ShortcutRow keys={['c', 'c']} description="Create column" />
                    <ShortcutRow keys={['d', 'c']} description="Delete column" />
                    <ShortcutRow keys={['y', 'c']} description="Yank/duplicate column" />
                    <ShortcutRow keys={['<']} description="Move column left" />
                    <ShortcutRow keys={['>']} description="Move column right" />
                    <ShortcutRow keys={['g', 'c']} description="Go to/focus column" />
                  </div>
                </div>

                {/* Cards */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Cards</h4>
                  <div className="space-y-1.5">
                    <ShortcutRow keys={['o']} description="Create card below" />
                    <ShortcutRow keys={['O']} description="Create card above" />
                    <ShortcutRow keys={['d', 'd']} description="Delete card" />
                    <ShortcutRow keys={['y', 'y']} description="Yank/duplicate card" />
                    <ShortcutRow keys={['p']} description="Paste card below" />
                    <ShortcutRow keys={['P']} description="Paste card above" />
                    <ShortcutRow keys={['J']} description="Move card down" />
                    <ShortcutRow keys={['K']} description="Move card up" />
                  </div>
                </div>

                {/* Navigation */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Navigation</h4>
                  <div className="space-y-1.5">
                    <ShortcutRow keys={['h']} description="Navigate left (columns)" />
                    <ShortcutRow keys={['l']} description="Navigate right (columns)" />
                    <ShortcutRow keys={['j']} description="Navigate down (cards)" />
                    <ShortcutRow keys={['k']} description="Navigate up (cards)" />
                    <ShortcutRow keys={['g', 'g']} description="Jump to first card" />
                    <ShortcutRow keys={['G']} description="Jump to last card" />
                    <ShortcutRow keys={['w']} description="Jump to next card" />
                    <ShortcutRow keys={['b']} description="Jump to previous card" />
                  </div>
                </div>

                {/* Editing */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Editing</h4>
                  <div className="space-y-1.5">
                    <ShortcutRow keys={['i']} description="Edit card title (insert)" />
                    <ShortcutRow keys={['a']} description="Edit card title (append)" />
                    <ShortcutRow keys={['A']} description="Append to card description" />
                    <ShortcutRow keys={['Esc']} description="Exit edit mode" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ShortcutRow = ({ keys, description }: { keys: string[]; description: string }) => {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-gray-300 font-mono text-xs">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-gray-500 mx-1">+</span>}
          </span>
        ))}
      </div>
      <span className="text-gray-400">{description}</span>
    </div>
  );
};
