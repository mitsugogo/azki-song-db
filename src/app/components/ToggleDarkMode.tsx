import React, { useState, useEffect } from "react";

// テーマを切り替えるためのコンポーネント
const ThemeToggle = () => {
  // `localStorage`からテーマを取得し、ステートの初期値として設定
  // 存在しない場合はユーザーのOS設定をデフォルトにする
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // themeステートが変更されるたびに実行
  useEffect(() => {
    const html = document.documentElement;

    // 現在のテーマをlocalStorageに保存
    localStorage.setItem("theme", theme);

    // テーマに応じて`dark`クラスをトグル
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]); // themeが変更されたときのみuseEffectが実行される

  // ボタンクリックでテーマを切り替える関数
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-white bg-gray-800 dark:bg-white dark:text-gray-800"
    >
      テーマ切り替え
    </button>
  );
};

export default ThemeToggle;
