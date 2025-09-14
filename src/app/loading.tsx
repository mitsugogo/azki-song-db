import { Spinner } from "flowbite-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <Spinner size="xl" />
    </div>
  );
}
