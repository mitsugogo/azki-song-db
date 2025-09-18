import { LoadingOverlay, MantineProvider } from "@mantine/core";
import { theme } from "./theme";

export default function Loading() {
  return (
    <MantineProvider theme={theme}>
      <div className="flex items-center justify-center h-[calc(100dvh-64px)] md:h-[calc(100dvh-99px)]">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          loaderProps={{ color: "pink", type: "bars" }}
          overlayProps={{ radius: "md", blur: 2 }}
        />
      </div>
    </MantineProvider>
  );
}
