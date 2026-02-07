import { useEffect, useState } from "react";
import { FaCircleHalfStroke, FaMoon, FaSun } from "react-icons/fa6";
import { useMantineColorScheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

const ThemeToggle = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isSystemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mounted, setMounted] = useState(false);

  // MantineのカラースキームからFlowbiteのモードを決定
  useEffect(() => {
    if (colorScheme === "auto" && isSystemDark) {
      document.documentElement.classList.add("dark");
    } else if (colorScheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [colorScheme, isSystemDark]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    switch (colorScheme) {
      case "light":
        setColorScheme("dark");
        break;
      case "dark":
        setColorScheme("auto");
        break;
      case "auto":
        setColorScheme("light");
        break;
    }
  };

  const getThemeIcon = () => {
    if (!mounted) {
      return <FaSun />;
    }
    if (colorScheme === "light") {
      return <FaSun />;
    }
    if (colorScheme === "dark") {
      return <FaMoon />;
    }
    return <FaCircleHalfStroke />;
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="outline-none cursor-pointer ml-2 hover:bg-primary-600 dark:hover:bg-primary-800 p-2 rounded-md"
      onClick={handleClick}
    >
      {getThemeIcon()}
    </button>
  );
};

export default ThemeToggle;
