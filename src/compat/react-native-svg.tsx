import React from 'react';
import { toCssStyle } from './style';

/**
 * react-native-svg, as actual SVG.
 *
 * The library exists to project an SVG API onto native canvases. In a browser
 * there is already SVG, so this maps straight onto it. Four files use it, and
 * between them only Svg, Circle and Path — the package's own web entry does not
 * even export those, so aliasing to it would have built cleanly and then been
 * undefined at runtime.
 *
 * Two things have to be normalised before props reach a DOM node:
 *
 *  - `style` may be a React Native array, which cannot be assigned to a
 *    CSSStyleDeclaration (`Failed to set an indexed property [0]`).
 *  - Any prop may be an `Animated.Value` rather than a number, because
 *    `Animated.createAnimatedComponent(Circle)` wraps these components — the
 *    daily-goal ring animates `strokeDashoffset` that way. Rendering the object
 *    itself would put `[object Object]` in the attribute.
 */

type Num = number | string;

type AnimatedNode = {
  __getValue: () => number;
  addListener: (cb: (state: { value: number }) => void) => string;
  removeListener: (id: string) => void;
};

function isAnimatedNode(value: unknown): value is AnimatedNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AnimatedNode).__getValue === 'function'
  );
}

/**
 * Resolve Animated props to their current numbers, re-rendering as they change.
 *
 * The hook count is fixed regardless of how many animated props there are, so
 * this cannot break the rules of hooks.
 */
function useResolvedProps<P extends Record<string, unknown>>(props: P): P {
  const [, force] = React.useReducer((n: number) => n + 1, 0);

  const animated: AnimatedNode[] = [];
  for (const value of Object.values(props)) if (isAnimatedNode(value)) animated.push(value);

  // Identity of the node objects is stable across renders; count is the only
  // thing that realistically changes, and re-subscribing on it is cheap.
  const count = animated.length;
  const nodesRef = React.useRef<AnimatedNode[]>(animated);
  nodesRef.current = animated;

  React.useEffect(() => {
    if (count === 0) return;
    const subs = nodesRef.current.map((node) => ({
      node,
      id: node.addListener(() => force()),
    }));
    return () => subs.forEach(({ node, id }) => node.removeListener?.(id));
  }, [count]);

  if (count === 0) return props;

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = isAnimatedNode(value) ? value.__getValue() : value;
  }
  return resolved as P;
}

/** Shared normalisation for every leaf SVG element. */
function useDomProps<P extends { style?: unknown }>(props: P) {
  const resolved = useResolvedProps(props as Record<string, unknown>);
  const { style, ...rest } = resolved as P & Record<string, unknown>;
  return { ...rest, style: toCssStyle(style) };
}

export type SvgProps = Omit<React.SVGProps<SVGSVGElement>, 'style'> & {
  width?: Num;
  height?: Num;
  viewBox?: string;
  /** A React Native style prop — object, array, or nested arrays. */
  style?: unknown;
  children?: React.ReactNode;
};

export const Svg = React.forwardRef<SVGSVGElement, SvgProps>(function Svg(
  { width, height, viewBox, children, style, ...rest },
  ref
) {
  // Without an explicit viewBox the drawing would not scale with the box.
  const box =
    viewBox ?? (width != null && height != null ? `0 0 ${width} ${height}` : undefined);
  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={box}
      xmlns="http://www.w3.org/2000/svg"
      style={toCssStyle(style)}
      {...rest}
    >
      {children}
    </svg>
  );
});

/** Builds a leaf element (circle, path, …) that normalises its props first. */
function leaf<E extends Element>(tag: string, displayName: string) {
  const Component = React.forwardRef<E, Record<string, unknown>>(function Leaf(props, ref) {
    const domProps = useDomProps(props);
    return React.createElement(tag, { ref, ...domProps });
  });
  Component.displayName = displayName;
  return Component as unknown as React.ForwardRefExoticComponent<
    Omit<React.SVGProps<E>, 'style'> & { style?: unknown; ref?: React.Ref<E> }
  >;
}

export const Circle = leaf<SVGCircleElement>('circle', 'Circle');
export const Path = leaf<SVGPathElement>('path', 'Path');
export const G = leaf<SVGGElement>('g', 'G');
export const Rect = leaf<SVGRectElement>('rect', 'Rect');
export const Line = leaf<SVGLineElement>('line', 'Line');
export const Ellipse = leaf<SVGEllipseElement>('ellipse', 'Ellipse');
export const Polygon = leaf<SVGPolygonElement>('polygon', 'Polygon');
export const Polyline = leaf<SVGPolylineElement>('polyline', 'Polyline');
export const Text = leaf<SVGTextElement>('text', 'Text');

export default Svg;
