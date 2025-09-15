import { createTheme } from "@mantine/core";
import { CustomFlowbiteTheme } from "flowbite-react/types";
import { createTheme as createFlowbiteTheme } from "flowbite-react";

export const theme = createTheme({});

export const flowbiteTheme: CustomFlowbiteTheme = createFlowbiteTheme({
  textInput: {
    base: "block w-full",
    field: {
      base: "rounded-lg border border-gray-50 dark:border-gray-500",
      input: {
        base: "px-3 py-2",
        sizes: {
          sm: "text-sm",
          md: "text-base",
        },
        colors: {
          gray: "border-0 bg-gray-50/20",
          error: "border-red-500 bg-red-50",
        },
      },
    },
  },
  button: {
    base: "rounded-lg",
  },
  table: {
    root: {
      base: "w-full text-left text-sm text-gray-500 dark:text-gray-400",
      shadow:
        "absolute left-0 top-0 -z-10 h-full w-full rounded-lg bg-white drop-shadow-md dark:bg-black",
      wrapper: "relative",
    },
    body: {
      base: "group/body",
      cell: {
        base: "px-6 py-4 group-first/body:group-first/row:first:rounded-tl-lg group-first/body:group-first/row:last:rounded-tr-lg group-last/body:group-last/row:first:rounded-bl-lg group-last/body:group-last/row:last:rounded-br-lg",
      },
    },
    head: {
      base: "group/head text-xs uppercase text-gray-700 dark:text-gray-400",
      cell: {
        base: "bg-gray-50/50 px-6 py-3 group-first/head:first:rounded-tl-lg group-first/head:last:rounded-tr-lg dark:bg-gray-700",
      },
    },
    row: {
      base: "group/row",
      hovered: "hover:bg-gray-50/50 dark:hover:bg-gray-600",
      striped:
        "odd:bg-white even:bg-gray-50/50 odd:dark:bg-gray-800 even:dark:bg-gray-700",
    },
  },
  list: {
    base: "space-y-1",
    item: {
      base: "flex items-center space-x-2 dark:text-white",
      icon: "h-5 w-5",
    },
  },
  modal: {
    root: {
      base: "fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
      show: {
        on: "flex bg-gray-900/50 dark:bg-gray-900/80",
        off: "hidden",
      },
    },
    header: {
      base: "flex items-start justify-between rounded-t border-b py-3 px-5 dark:border-gray-600",
      popup: "border-b-0 p-2",
      title: "text-xl font-semibold text-gray-900 dark:text-white",
      close: {
        base: "ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white",
        icon: "h-5 w-5",
      },
    },
    footer: {
      base: "flex items-center space-x-2 rounded-b border-gray-200 p-3 dark:border-gray-600",
      popup: "border-t",
    },
  },
});
