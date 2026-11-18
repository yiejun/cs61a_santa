//# sourceMappingURL=shape.mjs.map
import { CustomType as $CustomType } from "./gleam.mjs";

export class Point extends $CustomType {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
}
export const Point$Point = (x, y) => new Point(x, y);
export const Point$isPoint = (value) => value instanceof Point;
export const Point$Point$x = (value) => value.x;
export const Point$Point$0 = (value) => value.x;
export const Point$Point$y = (value) => value.y;
export const Point$Point$1 = (value) => value.y;

export class Line extends $CustomType {
  constructor(start, end) {
    super();
    this.start = start;
    this.end = end;
  }
}
export const Shape$Line = (start, end) => new Line(start, end);
export const Shape$isLine = (value) => value instanceof Line;
export const Shape$Line$start = (value) => value.start;
export const Shape$Line$0 = (value) => value.start;
export const Shape$Line$end = (value) => value.end;
export const Shape$Line$1 = (value) => value.end;

export class ColorLine extends $CustomType {
  constructor(start, end, color) {
    super();
    this.start = start;
    this.end = end;
    this.color = color;
  }
}
export const Shape$ColorLine = (start, end, color) =>
  new ColorLine(start, end, color);
export const Shape$isColorLine = (value) => value instanceof ColorLine;
export const Shape$ColorLine$start = (value) => value.start;
export const Shape$ColorLine$0 = (value) => value.start;
export const Shape$ColorLine$end = (value) => value.end;
export const Shape$ColorLine$1 = (value) => value.end;
export const Shape$ColorLine$color = (value) => value.color;
export const Shape$ColorLine$2 = (value) => value.color;

export class Rider extends $CustomType {
  constructor(start) {
    super();
    this.start = start;
  }
}
export const Shape$Rider = (start) => new Rider(start);
export const Shape$isRider = (value) => value instanceof Rider;
export const Shape$Rider$start = (value) => value.start;
export const Shape$Rider$0 = (value) => value.start;

export class Goal extends $CustomType {
  constructor(center) {
    super();
    this.center = center;
  }
}
export const Shape$Goal = (center) => new Goal(center);
export const Shape$isGoal = (value) => value instanceof Goal;
export const Shape$Goal$center = (value) => value.center;
export const Shape$Goal$0 = (value) => value.center;

export class Blue extends $CustomType {}
export const Color$Blue$const = new Blue();
export const Color$Blue = () => Color$Blue$const;
export const Color$isBlue = (value) => value instanceof Blue;

export class Red extends $CustomType {}
export const Color$Red$const = new Red();
export const Color$Red = () => Color$Red$const;
export const Color$isRed = (value) => value instanceof Red;

export class Green extends $CustomType {}
export const Color$Green$const = new Green();
export const Color$Green = () => Color$Green$const;
export const Color$isGreen = (value) => value instanceof Green;

export class Purple extends $CustomType {}
export const Color$Purple$const = new Purple();
export const Color$Purple = () => Color$Purple$const;
export const Color$isPurple = (value) => value instanceof Purple;

export class Gold extends $CustomType {}
export const Color$Gold$const = new Gold();
export const Color$Gold = () => Color$Gold$const;
export const Color$isGold = (value) => value instanceof Gold;

export class Path extends $CustomType {
  constructor(shape, start, end, thickness) {
    super();
    this.shape = shape;
    this.start = start;
    this.end = end;
    this.thickness = thickness;
  }
}
export const Path$Path = (shape, start, end, thickness) =>
  new Path(shape, start, end, thickness);
export const Path$isPath = (value) => value instanceof Path;
export const Path$Path$shape = (value) => value.shape;
export const Path$Path$0 = (value) => value.shape;
export const Path$Path$start = (value) => value.start;
export const Path$Path$1 = (value) => value.start;
export const Path$Path$end = (value) => value.end;
export const Path$Path$2 = (value) => value.end;
export const Path$Path$thickness = (value) => value.thickness;
export const Path$Path$3 = (value) => value.thickness;
