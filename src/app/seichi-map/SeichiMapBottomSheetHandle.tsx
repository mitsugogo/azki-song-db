"use client";

import { UnstyledButton } from "@mantine/core";
import { useRef } from "react";
import {
  cycleSeichiMapSheetSnap,
  getSeichiMapSheetSnapAfterDrag,
  type SeichiMapSheetSnap,
} from "./sheetSnap";
import classes from "./SeichiMapStage.module.css";

type Props = {
  snap: SeichiMapSheetSnap;
  onSnapChange: (snap: SeichiMapSheetSnap) => void;
  label: string;
};

/**
 * ボトムシート上端のつまみ。lg 以上ではシートが右カラムになるため CSS で隠す。
 * タップで段階を循環し、上下ドラッグで1段階ずつ動かす。キーボードは Enter / Space（クリック扱い）。
 */
export function SeichiMapBottomSheetHandle({
  snap,
  onSnapChange,
  label,
}: Props) {
  const dragStartYRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  return (
    <UnstyledButton
      type="button"
      className={classes.handle}
      aria-label={label}
      aria-expanded={snap !== "peek"}
      onPointerDown={(event) => {
        dragStartYRef.current = event.clientY;
        draggedRef.current = false;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (dragStartYRef.current === null) return;
        if (Math.abs(event.clientY - dragStartYRef.current) > 8) {
          draggedRef.current = true;
        }
      }}
      onPointerUp={(event) => {
        const startY = dragStartYRef.current;
        dragStartYRef.current = null;
        if (startY === null || !draggedRef.current) return;
        onSnapChange(
          getSeichiMapSheetSnapAfterDrag(snap, event.clientY - startY),
        );
      }}
      onPointerCancel={() => {
        dragStartYRef.current = null;
        draggedRef.current = false;
      }}
      onClick={() => {
        // ドラッグ操作の終わりに続けて発火するクリックは無視する
        if (draggedRef.current) {
          draggedRef.current = false;
          return;
        }
        onSnapChange(cycleSeichiMapSheetSnap(snap));
      }}
    >
      <span className={classes.grip} aria-hidden="true" />
    </UnstyledButton>
  );
}
