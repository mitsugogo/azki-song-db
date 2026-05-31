import { createTheme, Badge } from "@mantine/core";

/**
 * Mantineのテーマ設定
 * @see https://mantine.dev/theming/theme-object/
 */
export const theme = createTheme({
  primaryColor: "pink",
  cursorType: "pointer",
  colors: {
    tan: [
      "#faf7f2",
      "#f4eee0",
      "#e8dac0",
      "#d8c199",
      "#cba877",
      "#bc8c53",
      "#af7947",
      "#91603d",
      "#764f36",
      "#60422e",
    ],
  },
  components: {
    Badge: {
      defaultProps: {
        tt: "none",
      },
    },
    Breadcrumbs: {
      defaultProps: {
        className: "",
        "aria-label": "Breadcrumb",
      },
    },
  },
});

// 共通で使うパンくず向けの Tailwind クラスをエクスポート
export const breadcrumbClasses = {
  root: "bg-light-gray-100 px-5 py-3 dark:bg-gray-800 rounded-md flex mb-3 gap-x-0",
  link: "flex items-center text-sm font-medium text-gray-500 dark:text-gray-200",
  separator: "mx-1 h-4 w-4 text-gray-400",
};
