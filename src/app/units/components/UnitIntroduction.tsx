import { LiaExternalLinkAltSolid } from "react-icons/lia";
import {
  getLocalizedUnitText,
  type UnitIntroduction as UnitIntroductionData,
} from "@/app/config/units";

export default function UnitIntroduction({
  introduction,
  locale,
}: {
  introduction?: UnitIntroductionData;
  locale: string;
}) {
  if (!introduction) return null;

  return (
    <section aria-labelledby="unit-introduction-title" className="mt-8">
      <h2
        id="unit-introduction-title"
        className="text-xl font-bold text-gray-900 dark:text-gray-100"
      >
        {getLocalizedUnitText(introduction.title, locale)}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-700 dark:text-gray-200">
        {introduction.paragraphs.map((paragraph) => (
          <p key={paragraph.ja}>{getLocalizedUnitText(paragraph, locale)}</p>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {introduction.links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-700 underline underline-offset-4 hover:text-primary-500 dark:text-pink-200 dark:hover:text-pink-100"
            >
              {getLocalizedUnitText(link.label, locale)}
              <LiaExternalLinkAltSolid
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
                focusable="false"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
