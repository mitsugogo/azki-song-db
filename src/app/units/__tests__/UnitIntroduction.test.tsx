import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getUnitBySlug } from "../../config/units";
import UnitIntroduction from "../components/UnitIntroduction";

const introduction = getUnitBySlug("azki-else")!.introduction;

describe("UnitIntroduction", () => {
  it.each([
    {
      locale: "ja",
      title: "エルセさんについて",
      profileLabel: "エルセ 公式プロフィール",
      websiteLabel: "Lir.E 公式サイト",
      composer: "コンポーザーの彼方",
      musicAlias: "彼方はさめのぽきの音楽名義",
      pokiLabel: "さめのぽき 公式プロフィール",
      projectLabel: "ProjectBLUE 公式サイト",
    },
    {
      locale: "en",
      title: "About Else",
      profileLabel: "Else’s official profile",
      websiteLabel: "Lir.E official website",
      composer: "composer Kanata",
      musicAlias: "Kanata is Poki’s music alias",
      pokiLabel: "Poki’s official profile",
      projectLabel: "ProjectBLUE official website",
    },
  ])(
    "introduces Else and links to official sources in $locale",
    ({
      locale,
      title,
      profileLabel,
      websiteLabel,
      composer,
      musicAlias,
      pokiLabel,
      projectLabel,
    }) => {
      render(<UnitIntroduction introduction={introduction} locale={locale} />);

      expect(screen.getByRole("region", { name: title })).toBeVisible();
      expect(
        screen.getByRole("heading", { level: 2, name: title }),
      ).toBeVisible();
      expect(screen.getByText(new RegExp(composer))).toBeVisible();
      expect(screen.getByText(new RegExp(musicAlias))).toBeVisible();
      expect(screen.getByRole("link", { name: pokiLabel })).toHaveAttribute(
        "href",
        "https://puroburu.com/talent/detail/poki",
      );
      expect(screen.getByRole("link", { name: projectLabel })).toHaveAttribute(
        "href",
        "https://pjblue.com/",
      );
      expect(screen.getByRole("link", { name: profileLabel })).toHaveAttribute(
        "href",
        "https://puroburu.com/talent/detail/else",
      );
      const website = screen.getByRole("link", { name: websiteLabel });
      expect(website).toHaveAttribute("href", "https://lire-official.com/");
      expect(website).toHaveAttribute("target", "_blank");
      expect(website).toHaveAttribute("rel", "noopener noreferrer");
    },
  );

  it("omits the section for units without an introduction", () => {
    const { container } = render(
      <UnitIntroduction
        introduction={getUnitBySlug("aziro")!.introduction}
        locale="ja"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
