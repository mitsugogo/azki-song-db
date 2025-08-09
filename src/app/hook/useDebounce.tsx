import { useState, useEffect } from 'react';

// ジェネリクス <T> を使用して、任意の型に対応できるようにする
function useDebounce<T>(value: T, delay: number): T {
  // debounce後の値を保持するstate
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // delayミリ秒後にdebouncedValueを更新するタイマーを設定
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // cleanup関数:
    // valueまたはdelayが変更された場合、前のタイマーをクリアする
    // これにより、入力が連続してもタイマーがリセットされる
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // valueまたはdelayが変更されたときのみエフェクトを実行

  return debouncedValue;
}

export default useDebounce;