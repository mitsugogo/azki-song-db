"use client";

import { useEffect, useState } from "react";
import { FaCircleHalfStroke, FaMoon, FaSun } from "react-icons/fa6";

const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    typeof localStorage !== "undefined"
      ? localStorage.getItem("color-theme") || "system"
      : "system"
  );

  useEffect(() => {
    switch (theme) {
      case "light":
        document.documentElement.classList.remove("dark");
        break;
      case "dark":
        document.documentElement.classList.add("dark");
        break;
      case "system":
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.matches
          ? document.documentElement.classList.add("dark")
          : document.documentElement.classList.remove("dark");
        const handleChange = () => {
          mediaQuery.matches
            ? document.documentElement.classList.add("dark")
            : document.documentElement.classList.remove("dark");
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const handleClick = () => {
    switch (theme) {
      case "light":
        setTheme("dark");
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("color-theme", "dark");
        }
        break;
      case "dark":
        setTheme("system");
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("color-theme", "system");
        }
        break;
      case "system":
        setTheme("light");
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("color-theme", "light");
        }
        break;
    }
  };

  return (
    <button
      type="button"
      className="outline-none px-3 py-2 rounded-md cursor-pointer focus:ring-0 text-primary-200 dark:text-primary-200 bg-primary-700 hover:bg-primary-600 dark:bg-primary-900 dark:hover:bg-primary-700 focus:border-primary-700 focus:ring-primary-700 dark:focus:ring-primary-700"
      onClick={handleClick}
    >
      {theme === "light" ? (
        <FaSun />
      ) : theme === "dark" ? (
        <FaMoon />
      ) : (
        <FaCircleHalfStroke />
      )}
    </button>
  );
};

export default ThemeToggle;
