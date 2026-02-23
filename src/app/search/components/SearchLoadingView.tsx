import { LoadingOverlay } from "@mantine/core";
import SearchBreadcrumb from "./SearchBreadcrumb";

const SearchLoadingView = () => {
  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto relative">
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
