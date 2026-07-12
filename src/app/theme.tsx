import { createTheme, Badge, MantineColorsTuple } from "@mantine/core";

/**
 * Mantineのテーマ設定
 * @see https://mantine.dev/theming/theme-object/
 */
export const theme = createTheme({
  primaryColor: "azki",
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
    ] as MantineColorsTuple,
    magenta: [
      "#ffe9f6",
      "#ffd1e6",
      "#faa1c9",
      "#f66eab",
      "#f24391",
      "#f02981",
      "#f01879",
      "#d60867",
      "#c0005c",
      "#a9004f",
    ] as MantineColorsTuple,
    brown: [
      "#f7f3f2",
      "#e8e6e5",
      "#d2c9c6",
      "#bdaaa4",
      "#ab9087",
      "#a17f74",
      "#9d766a",
      "#896459",
      "#7b594e",
      "#5d4037",
    ] as MantineColorsTuple,
    azki: [
      "#ffeaf7",
      "#fcd4e8",
      "#f3a7cd",
      "#ec77b1",
      "#e55099",
      "#e2378b",
      "#e12883",
      "#d11c76", // base
      "#b31264",
      "#9e0157",
    ] as MantineColorsTuple,
    miku: [
      "#e3fdfc",
      "#d5f6f3",
      "#b0e9e5",
      "#87dcd6",
      "#66d1ca",
      "#4fcbc2",
      "#39c5bb",
      "#2eb0a7", // base
      "#1d9d95",
      "#008881",
    ] as MantineColorsTuple,
    hololive: [
      "#e1fdff",
      "#cff6fc",
      "#a4ebf5", // base
      "#66dbec",
      "#50d5e8",
      "#38cee5",
      "#24cce4",
      "#09b4cb",
      "#00a0b5",
      "#008b9f",
    ] as MantineColorsTuple,
    palePurple: [
      "#f1f1ff",
      "#e0dff2",
      "#bfbdde",
      "#9b98ca",
      "#7d79b9",
      "#6a66af",
      "#605cac",
      "#504c97",
      "#464388",
      "#3b3979",
    ] as MantineColorsTuple,
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
