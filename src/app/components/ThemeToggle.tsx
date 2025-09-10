import { useEffect, useState } from "react";
import { FaCircleHalfStroke, FaMoon, FaSun } from "react-icons/fa6";

const ThemeToggle = () => {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const storedTheme = localStorage.getItem("color-theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

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
        localStorage.setItem("color-theme", "dark");
        break;
      case "dark":
        setTheme("system");
        localStorage.setItem("color-theme", "system");
        break;
      case "system":
        setTheme("light");
        localStorage.setItem("color-theme", "light");
        break;
    }
  };

  return (
    <button
      type="button"
      className="outline-none cursor-pointer ml-2 hover:bg-primary-600 dark:hover:bg-primary-800 p-2 rounded-md"
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
