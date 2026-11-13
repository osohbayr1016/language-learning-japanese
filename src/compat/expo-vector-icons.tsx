import React, { useEffect, useState } from "react";
import glyphMap from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json";
import core from "./icon-core.json";
import { toCssStyle } from "./style";

export type IoniconName = keyof typeof glyphMap;
export type IconProps = {
  name: IoniconName;
  size?: number;
  color?: string;
  style?: unknown;
  accessibilityLabel?: string;
  testID?: string;
};

// Primary navigation is immediately available. Less common outlines load once,
// without a blocking icon font or pulling every icon family into the bundle.
let paths: Record<string, string> = core;
let pending: Promise<Record<string, string>> | undefined;
function loadPaths() {
  return (pending ??= fetch("/icons.json")
    .then(async (response) => {
      if (!response.ok) throw new Error("Icon outlines unavailable");
      paths = { ...paths, ...(await response.json()) };
      return paths;
    })
    .catch(() => {
      pending = undefined;
      return paths;
    }));
}

export function Ionicons({
  name,
  size = 24,
  color = "currentColor",
  style,
  accessibilityLabel,
  testID,
}: IconProps) {
  const [path, setPath] = useState(paths[name]);
  useEffect(() => {
    let alive = true;
    setPath(paths[name]);
    if (!paths[name])
      void loadPaths().then((all) => {
        if (alive) setPath(all[name]);
      });
    return () => {
      alive = false;
    };
  }, [name]);
  return (
    <span
      data-testid={testID}
      aria-label={accessibilityLabel}
      aria-hidden={accessibilityLabel ? undefined : true}
      role={accessibilityLabel ? "img" : undefined}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        color,
        verticalAlign: "middle",
        ...toCssStyle(style),
      }}
    >
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        focusable="false"
        aria-hidden="true"
      >
        {path && (
          <path
            d={path}
            fill="currentColor"
            transform="translate(0 454) scale(1 -1)"
          />
        )}
      </svg>
    </span>
  );
}
Ionicons.glyphMap = glyphMap;
export default { Ionicons };
