//# sourceMappingURL=render.mjs.map
import * as $list from "../gleam_stdlib/gleam/list.mjs";
import {
  setDrawing as set_drawing,
  setSpeed as set_speed,
  resetClock as reset_clock,
  setGame as set_game,
  setMarkers as set_markers,
  setMuted as set_muted,
} from "./canvas.mjs";
import {
  Ok,
  Error,
  List$Empty$const as $List$Empty$const,
  prepend as listPrepend,
  CustomType as $CustomType,
} from "./gleam.mjs";
import * as $shape from "./shape.mjs";
import { ColorLine, Goal, Line, Rider } from "./shape.mjs";

export { reset_clock, set_drawing, set_game, set_markers, set_muted, set_speed };

export class RenderPath extends $CustomType {
  constructor(points, thickness, color, start, end) {
    super();
    this.points = points;
    this.thickness = thickness;
    this.color = color;
    this.start = start;
    this.end = end;
  }
}
export const RenderPath$RenderPath = (points, thickness, color, start, end) =>
  new RenderPath(points, thickness, color, start, end);
export const RenderPath$isRenderPath = (value) => value instanceof RenderPath;
export const RenderPath$RenderPath$points = (value) => value.points;
export const RenderPath$RenderPath$0 = (value) => value.points;
export const RenderPath$RenderPath$thickness = (value) => value.thickness;
export const RenderPath$RenderPath$1 = (value) => value.thickness;
export const RenderPath$RenderPath$color = (value) => value.color;
export const RenderPath$RenderPath$2 = (value) => value.color;
export const RenderPath$RenderPath$start = (value) => value.start;
export const RenderPath$RenderPath$3 = (value) => value.start;
export const RenderPath$RenderPath$end = (value) => value.end;
export const RenderPath$RenderPath$4 = (value) => value.end;

export class Marker extends $CustomType {
  constructor(kind, x, y, start) {
    super();
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.start = start;
  }
}
export const Marker$Marker = (kind, x, y, start) =>
  new Marker(kind, x, y, start);
export const Marker$isMarker = (value) => value instanceof Marker;
export const Marker$Marker$kind = (value) => value.kind;
export const Marker$Marker$0 = (value) => value.kind;
export const Marker$Marker$x = (value) => value.x;
export const Marker$Marker$1 = (value) => value.x;
export const Marker$Marker$y = (value) => value.y;
export const Marker$Marker$2 = (value) => value.y;
export const Marker$Marker$start = (value) => value.start;
export const Marker$Marker$3 = (value) => value.start;

/**
 * The colour of a plain Line, which plays a piano.
 */
export const line_color = "#f5e6c0";

/**
 * The colour each built-in Color draws in. canvas.mjs picks a line's instrument
 * from its colour, so these must match its INSTRUMENTS table.
 */
export function color_hex(c) {
  if (c instanceof $shape.Blue) {
    return "#6fa8e0";
  } else if (c instanceof $shape.Red) {
    return "#e0584f";
  } else if (c instanceof $shape.Green) {
    return "#6cc070";
  } else if (c instanceof $shape.Purple) {
    return "#a678e8";
  } else {
    return "#f0b030";
  }
}

export function render_path(path, color) {
  let $ = path.shape;
  if ($ instanceof Line) {
    let a = $.start;
    let b = $.end;
    return new RenderPath(
      listPrepend(a, listPrepend(b, $List$Empty$const)),
      path.thickness,
      color,
      path.start,
      path.end,
    );
  } else if ($ instanceof ColorLine) {
    let a = $.start;
    let b = $.end;
    let c = $.color;
    return new RenderPath(
      listPrepend(a, listPrepend(b, $List$Empty$const)),
      path.thickness,
      color_hex(c),
      path.start,
      path.end,
    );
  } else if ($ instanceof Rider) {
    let p = $.start;
    return new RenderPath(
      listPrepend(p, $List$Empty$const),
      0.0,
      color,
      path.start,
      path.end,
    );
  } else {
    let p = $.center;
    return new RenderPath(
      listPrepend(p, $List$Empty$const),
      0.0,
      color,
      path.start,
      path.end,
    );
  }
}

/**
 * The sled and goal markers of a drawing, in order.
 */
export function markers(paths) {
  return $list.filter_map(
    paths,
    (path) => {
      let $ = path.shape;
      if ($ instanceof Rider) {
        let p = $.start;
        return new Ok(new Marker("rider", p.x, p.y, path.start));
      } else if ($ instanceof Goal) {
        let p = $.center;
        return new Ok(new Marker("goal", p.x, p.y, path.start));
      } else {
        return new Error(undefined);
      }
    },
  );
}

/**
 * Whether a drawing uses any of the extension's shapes (ColorLine, Rider, or
 * Goal). Only such a drawing plays notes and has a sled; any other drawing
 * animates exactly as it did before the extension.
 */
export function uses_extension(paths) {
  return $list.any(
    paths,
    (path) => {
      let $ = path.shape;
      if ($ instanceof Line) {
        return false;
      } else {
        return true;
      }
    },
  );
}
