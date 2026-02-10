/**
 * 指定されたアンカー要素にスクロールする関数
 */
export async function scrollToAnchor(key: string): Promise<void> {
  const maxAttempts = 20;
  const delayMs = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const anchor = document.querySelector(
        `[data-discography-anchor="album-${key}"]`,
      ) as HTMLElement | null;

      // 要素が見つかり、レイアウトに反映されていればスクロール実行
      if (anchor && anchor.getBoundingClientRect().height > 0) {
        // nearest scrollable ancestor を探してスクロールする
        let ancestor: HTMLElement | null = anchor.parentElement;
        while (ancestor && ancestor !== document.body) {
          const style = window.getComputedStyle(ancestor);
          const overflowY = style.overflowY;
          if (
            (overflowY === "auto" || overflowY === "scroll") &&
            ancestor.scrollHeight > ancestor.clientHeight
          ) {
            break;
          }
          ancestor = ancestor.parentElement;
        }

        const header = document.querySelector("header");
        const headerHeight = header ? header.clientHeight : 0;

        // anchor 内に sticky 要素があればその高さも考慮する
        const stickyEl = anchor.querySelector(".sticky") as HTMLElement | null;
        const stickyHeight = stickyEl
          ? stickyEl.getBoundingClientRect().height
          : 0;

        if (!ancestor || ancestor === document.body) {
          const top =
            anchor.getBoundingClientRect().top +
            window.scrollY -
            headerHeight -
            stickyHeight -
            12;
          window.scrollTo({ top, behavior: "smooth" });
        } else {
          const ancestorRect = ancestor.getBoundingClientRect();
          const elRect = anchor.getBoundingClientRect();
          const offsetWithinAncestor =
            elRect.top - ancestorRect.top + ancestor.scrollTop;
          const desired =
            offsetWithinAncestor - headerHeight - stickyHeight - 12;
          try {
            ancestor.scrollTo({ top: desired, behavior: "smooth" });
          } catch (e) {
            ancestor.scrollTop = desired;
          }
        }

        return;
      }
    } catch (e) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
