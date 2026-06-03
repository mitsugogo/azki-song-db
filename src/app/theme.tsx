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
  root: "mb-5 flex min-w-0 gap-x-0 overflow-x-auto rounded-md bg-light-gray-100 px-4 py-3 dark:bg-gray-800 sm:px-5",
  link: "flex items-center text-sm font-medium text-gray-500 dark:text-gray-200",
  separator: "mx-1 h-4 w-4 text-gray-400",
};

export const pageClasses = {
  shell: "grow overflow-auto px-4 py-5 sm:px-6 lg:p-6 lg:pb-10",
  shellFlushBottom: "grow overflow-auto px-4 py-5 sm:px-6 lg:p-6 lg:pb-0",
  heading:
    "mb-2 text-2xl font-extrabold leading-tight text-gray-900 dark:text-gray-100",
  description: "mb-6 text-sm leading-6 text-gray-600 dark:text-gray-300",
};
