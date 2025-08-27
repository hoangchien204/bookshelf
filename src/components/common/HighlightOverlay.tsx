interface HighlightOverlayProps {
  highlights: {
    rects: { x: number; y: number; w: number; h: number }[];
    color: string;
  }[];
}

export default function HighlightOverlay({ highlights }: HighlightOverlayProps) {
  return (
    <>
      {highlights.map((h, idx) =>
        h.rects.map((r, i) => (
          <div
            key={`${idx}-${i}`}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              backgroundColor: h.color,
              opacity: 0.4,
              borderRadius: 2,
              zIndex: 20,
              pointerEvents: "none",
            }}
          />
        ))
      )}
    </>
  );
}
