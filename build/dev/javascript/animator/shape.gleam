//// The drawing Path types produced by the evaluator and rendered by the
//// animator.
////
//// The canvas maps a 1000-wide box centred on the origin onto its full size, and
//// x, y, and thickness are all in those units.

/// A point in world coordinates.
pub type Point {
  Point(x: Float, y: Float)
}

pub type Shape {
  Line(start: Point, end: Point)
  // Extension (Sled Symphony): a line drawn in one of the built-in colors, which
  // also chooses the instrument its note plays on.
  ColorLine(start: Point, end: Point, color: Color)
  // Where the sled drops in, at the Path's start time.
  Rider(start: Point)
  // The finish: the sled wins by reaching it.
  Goal(center: Point)
}

/// The built-in colors of a ColorLine. Each is also an instrument: Blue is a
/// bell, Red a drum, Green a marimba, Purple a bass, and Gold a synth. A plain
/// Line is cream and plays a piano.
pub type Color {
  Blue
  Red
  Green
  Purple
  Gold
}

pub type Path {
  // start and end are the times (in tenths of a second) between which the path is
  // drawn: the reveal runs linearly from nothing at start to the complete shape at
  // end. A path with end <= start appears complete the moment it starts.
  Path(shape: Shape, start: Float, end: Float, thickness: Float)
}
