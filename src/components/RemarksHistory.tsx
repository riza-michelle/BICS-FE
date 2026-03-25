import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, User } from 'lucide-react';
import { bicsAPI } from '../services/api';
import { RemarksHistoryEntry } from '../types';

interface RemarksHistoryProps {
  recordId: number;
  /** If provided, shown as the "current" remark from before history was tracked */
  legacyRemark?: string;
  /** Read-only mode — hides the input and shows the feed only */
  readOnly?: boolean;
}

const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatFull = (iso: string): string =>
  new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const PREVIEW_COUNT = 5;

const RemarksHistory: React.FC<RemarksHistoryProps> = ({ recordId, legacyRemark, readOnly = false }) => {
  const [history, setHistory] = useState<RemarksHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    bicsAPI.getRemarksHistory(recordId).then(res => {
      if (!cancelled && res.success && res.data) setHistory(res.data);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [recordId]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await bicsAPI.addRemark(recordId, input.trim());
      if (res.success && res.data) {
        setHistory(prev => [res.data!, ...prev]);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      } else {
        setError('Failed to save remark.');
      }
    } catch {
      setError('Failed to save remark.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Show legacy remark as a faded entry at the bottom if no history exists yet
  const showLegacy = legacyRemark && history.length === 0;
  const visibleHistory = showAll ? history : history.slice(0, PREVIEW_COUNT);
  const hiddenCount = history.length - PREVIEW_COUNT;

  return (
    <div className="flex flex-col gap-3">
      {/* Input — hidden in read-only mode */}
      {!readOnly && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ADD REMARK</label>
            <div className="border border-gray-300 rounded-md shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <textarea
                ref={textareaRef}
                rows={4}
                value={input}
                onChange={autoResize}
                onKeyDown={handleKeyDown}
                placeholder="Type a new remark… (Ctrl+Enter to submit)"
                className="block w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none bg-white"
              />
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                <span className="text-xs text-gray-400">Ctrl+Enter to submit</span>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-3 w-3" />
                  {submitting ? 'Saving…' : 'Add Remark'}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </>
      )}

      {/* History label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">REMARKS HISTORY</label>
        <div ref={feedRef} className="flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            </div>
          ) : history.length === 0 && !showLegacy ? (
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <p className="text-sm text-gray-400 italic">
                {readOnly ? 'No remarks recorded for this site.' : 'No remarks yet.'}
              </p>
            </div>
          ) : (
            <>
              {visibleHistory.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`px-3 py-2 border rounded-md ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{entry.remark}</p>
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {entry.created_by_name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatFull(entry.created_at)}
                        <span className="text-gray-400">· {formatRelative(entry.created_at)}</span>
                      </span>
                    </div>
                    {i === 0 && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {showLegacy && (
                <div className="px-3 py-2 border border-dashed border-gray-300 rounded-md bg-gray-50 opacity-70">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{legacyRemark}</p>
                  <p className="text-xs text-gray-400 mt-1 italic">— existing remark (no timestamp)</p>
                </div>
              )}
              {!showAll && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Show all remarks ({hiddenCount} more)
                </button>
              )}
              {showAll && history.length > PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemarksHistory;
