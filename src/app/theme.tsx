import { createTheme, Badge } from "@mantine/core";

/**
 * Mantineのテーマ設定
 * @see https://mantine.dev/theming/theme-object/
 */
export const theme = createTheme({
  primaryColor: "pink",
  cursorType: "pointer",
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
