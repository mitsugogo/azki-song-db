import { LoadingOverlay } from "@mantine/core";
import SearchBreadcrumb from "./SearchBreadcrumb";
import { pageClasses } from "../../theme";

const SearchLoadingView = () => {
  return (
    <div className={`${pageClasses.shellFlushBottom} relative`}>
      <SearchBreadcrumb />
      <LoadingOverlay
        visible={true}
        zIndex={1000}
        loaderProps={{ color: "pink", type: "bars" }}
        overlayProps={{ blur: 2 }}
      />
    </div>
  );
};

export default SearchLoadingView;
