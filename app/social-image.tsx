import { ImageResponse } from "next/og";

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };

const ROWS = 6;
const COLUMNS = 22;
const MESSAGE = ["", "DIGIBOARD", "", "SPLIT FLAP DISPLAY", "", ""];

function center(text: string): string {
  const padding = Math.max(0, COLUMNS - text.length);
  const left = Math.floor(padding / 2);
  return `${" ".repeat(left)}${text}${" ".repeat(padding - left)}`;
}

/** Build the shared Open Graph and Twitter card without external image assets. */
export function createSocialImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#111111",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            padding: 28,
            borderRadius: 30,
            background: "#111111",
            border: "1px solid #292929",
            boxShadow: "0 28px 70px rgba(0,0,0,0.65)",
          }}
        >
          {Array.from({ length: ROWS }, (_, row) => (
            <div key={row} style={{ display: "flex", gap: 7 }}>
              {[...center(MESSAGE[row] ?? "")].map((character, column) => (
                <div
                  key={column}
                  style={{
                    position: "relative",
                    width: 43,
                    height: 43,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                    background: "#e9e6dc",
                    borderBottom: "2px solid #b7b3aa",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 25,
                    fontWeight: 500,
                  }}
                >
                  {character === " " ? "\u00a0" : character}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 20,
                      height: 1,
                      background: "rgba(0,0,0,0.16)",
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            color: "#a3a3a3",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 20,
            letterSpacing: 3,
          }}
        >
          COMPOSE · ACTIVATE · PRESENT
        </div>
      </div>
    ),
    SOCIAL_IMAGE_SIZE,
  );
}
