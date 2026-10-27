import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getUnitBySlug } from "@/app/config/units";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));
vi.mock("@/app/components/YoutubeThumbnail", () => ({ default: () => null }));
vi.mock("../components/UnitMemberAvatars", () => ({ default: () => null }));

import UnitCard from "../components/UnitCard";

const renderCard = (slug: string) =>
  render(
    <UnitCard
      unit={getUnitBySlug(slug)!}
      locale="ja"
      anniversaryLabel="記念日"
      openLabel="履歴を見る"
    />,
  );

describe("UnitCard", () => {
  it("links to the collaboration history without inventing an anniversary", () => {
    renderCard("azki-else");
    expect(screen.getByRole("heading", { name: "エルあず" })).toBeVisible();
    expect(screen.getByText("AZKi × エルセ")).toBeVisible();
    expect(screen.getByRole("link", { name: "履歴を見る" })).toHaveAttribute(
      "href",
      "/units/azki-else",
    );
    expect(screen.getByText("Since 2019.06.23")).toBeVisible();
    expect(screen.queryByText("記念日")).not.toBeInTheDocument();
  });

  it("preserves established units' anniversary badges", () => {
    renderCard("aziro");
    expect(screen.getByText("記念日")).toBeVisible();
    expect(screen.getByText("9月17日")).toBeVisible();
  });
});
