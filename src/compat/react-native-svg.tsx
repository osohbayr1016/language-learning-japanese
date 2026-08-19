import React from 'react';

/**
 * react-native-svg, as actual SVG.
 *
 * The library exists to project an SVG API onto native canvases. In a browser
 * there is already SVG, so this maps straight onto it. Four files use it, and
 * between them only Svg, Circle and Path — the package's own web entry does not
 * even export those, so aliasing to it would have built cleanly and then been
 * undefined at runtime.
 *
 * React forwards camelCased SVG props (strokeWidth, strokeDasharray) to the
 * correct attributes, so props pass through untouched.
 */

type Num = number | string;

export type SvgProps = React.SVGProps<SVGSVGElement> & {
  width?: Num;
  height?: Num;
  viewBox?: string;
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
      style={style}
      {...rest}
    >
      {children}
    </svg>
  );
});

export const Circle = React.forwardRef<SVGCircleElement, React.SVGProps<SVGCircleElement>>(
  function Circle(props, ref) {
    // RN's default is a filled shape; SVG's is black fill. Stroke-only rings
    // (the progress rings) pass fill="none" explicitly, so only the default differs.
    return <circle ref={ref} {...props} />;
  }
);

export const Path = React.forwardRef<SVGPathElement, React.SVGProps<SVGPathElement>>(
  function Path(props, ref) {
    return <path ref={ref} {...props} />;
  }
);

export const G = React.forwardRef<SVGGElement, React.SVGProps<SVGGElement>>(function G(props, ref) {
  return <g ref={ref} {...props} />;
});

export const Rect = React.forwardRef<SVGRectElement, React.SVGProps<SVGRectElement>>(
  function Rect(props, ref) {
    return <rect ref={ref} {...props} />;
  }
);

export const Line = React.forwardRef<SVGLineElement, React.SVGProps<SVGLineElement>>(
  function Line(props, ref) {
    return <line ref={ref} {...props} />;
  }
);

export const Text = React.forwardRef<SVGTextElement, React.SVGProps<SVGTextElement>>(
  function Text(props, ref) {
    return <text ref={ref} {...props} />;
  }
);

export default Svg;
