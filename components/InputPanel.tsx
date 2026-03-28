'use client';

import { useState } from 'react';

type Props = {
  onSubmit: (text: string) => void;
  loading: boolean;
};

export default function InputPanel({ onSubmit, loading }: Props) {
  const [tab, setTab] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);

  async function handleSubmit() {
    setError('');

    if (tab === 'text') {
      if (!text.trim()) {
        setError('テキストを入力してください。');
        return;
      }
      if (text.length > 10000) {
        setError('10,000文字以内で入力してください。');
        return;
      }
      onSubmit(text);
    } else {
      if (!url.trim()) {
        setError('URLを入力してください。');
        return;
      }
      setFetching(true);
      try {
        const res = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'このページは取得できませんでした。X(Twitter)などログインが必要なページは、テキストタブからテキストを直接コピー&ペーストしてください。');
          return;
        }
        onSubmit(data.text);
      } catch {
        setError('このページは取得できませんでした。X(Twitter)などログインが必要なページは、テキストタブからテキストを直接コピー&ペーストしてください。');
      } finally {
        setFetching(false);
      }
    }
  }

  const isLoading = loading || fetching;
  const charCount = text.length;
  const overLimit = charCount > 10000;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setTab('text')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            tab === 'text'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          テキスト貼り付け
        </button>
        <button
          onClick={() => setTab('url')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            tab === 'url'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          URLで指定
        </button>
      </div>

      {/* Input area */}
      {tab === 'text' ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="記事本文・タイトル・SNS投稿などを貼り付けてください..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            disabled={isLoading}
          />
          <div className={`text-right text-xs mt-1 ${overLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
            {charCount.toLocaleString()} / 10,000文字
          </div>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full p-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            disabled={isLoading}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
          />
          <p className="text-xs text-gray-400 mt-2">
            ※ ログイン必須ページや一部のサイトは取得できない場合があります
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || overLimit}
        className="mt-4 w-full py-3 px-6 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors text-sm"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {fetching ? 'ページを取得中...' : '判定中...'}
          </span>
        ) : (
          'クソ度を判定する'
        )}
      </button>
    </div>
  );
}
