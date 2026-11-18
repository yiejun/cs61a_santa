//// Convert each shape into a list of points called a RenderPath.

import gleam/list
import shape.{type Color, type Path, type Point, ColorLine, Goal, Line, Rider}

/// One path as canvas.mjs setDrawing consumes it (field by field): the
/// polyline, stroke colour/width, and the start and end times (in tenths of a second)
/// between which the reveal runs — so the renderer's clock needs no shape
/// knowledge.
pub type RenderPath {
  RenderPath(
    points: List(Point),
    thickness: Float,
    color: String,
    start: Float,
    end: Float,
  )
}

// ── The canvas (canvas.mjs) ───────────────────────────────────────────────────

/// Replace the drawing being animated in the page's
/// `<canvas id="animation-canvas">` element. If that element doesn't appear within
/// about 10 seconds, this logs an error to the browser console. This keeps the
/// current time, so a drawing that replaces a finished one appears complete. To
/// animate it from the start, also call reset_clock.
@external(javascript, "./canvas.mjs", "setDrawing")
pub fn set_drawing(paths: List(RenderPath)) -> Nil

/// Set the animation's speed, as a multiple of its normal speed: 1.0 is normal and
/// is where it starts, 0.0 pauses, and a negative rate plays it backward.
/// Time stops at the start of the drawing and when its last path finishes, so
/// playing a finished drawing again takes a call to reset_clock.
@external(javascript, "./canvas.mjs", "setSpeed")
pub fn set_speed(rate: Float) -> Nil

/// Jump the animation back to its start, where the canvas is empty.
@external(javascript, "./canvas.mjs", "resetClock")
pub fn reset_clock() -> Nil

pub fn render_path(path: Path, color: String) -> RenderPath {
  case path.shape {
    Line(a, b) ->
      RenderPath([a, b], path.thickness, color, path.start, path.end)
    // A ColorLine's color comes from the drawing, not from the app.
    ColorLine(a, b, c) ->
      RenderPath([a, b], path.thickness, color_hex(c), path.start, path.end)
    // A single point has no line to stroke; the sled and goal are drawn from
    // the markers instead.
    Rider(p) -> RenderPath([p], 0.0, color, path.start, path.end)
    Goal(p) -> RenderPath([p], 0.0, color, path.start, path.end)
  }
}

// ── Extension: Sled Symphony ──────────────────────────────────────────────────

/// The colour of a plain Line, which plays a piano.
pub const line_color = "#f5e6c0"

/// The colour each built-in Color draws in. canvas.mjs picks a line's instrument
/// from its colour, so these must match its INSTRUMENTS table.
pub fn color_hex(c: Color) -> String {
  case c {
    shape.Blue -> "#6fa8e0"
    shape.Red -> "#e0584f"
    shape.Green -> "#6cc070"
    shape.Purple -> "#a678e8"
    shape.Gold -> "#f0b030"
  }
}

/// A point the game uses rather than a line it strokes: where the sled drops in
/// ("rider") or the finish ("goal"), from the Path's start time on.
pub type Marker {
  Marker(kind: String, x: Float, y: Float, start: Float)
}

/// The sled and goal markers of a drawing, in order.
pub fn markers(paths: List(Path)) -> List(Marker) {
  list.filter_map(paths, fn(path) {
    case path.shape {
      Rider(p) -> Ok(Marker("rider", p.x, p.y, path.start))
      Goal(p) -> Ok(Marker("goal", p.x, p.y, path.start))
      _ -> Error(Nil)
    }
  })
}

/// Whether a drawing uses any of the extension's shapes (ColorLine, Rider, or
/// Goal). Only such a drawing plays notes and has a sled; any other drawing
/// animates exactly as it did before the extension.
pub fn uses_extension(paths: List(Path)) -> Bool {
  list.any(paths, fn(path) {
    case path.shape {
      Line(_, _) -> False
      _ -> True
    }
  })
}

/// Turn the game (notes and the sled) on or off for the next drawing. Call this
/// before set_drawing.
@external(javascript, "./canvas.mjs", "setGame")
pub fn set_game(on: Bool) -> Nil

/// Give the canvas the drawing's sled and goal markers. Call this before
/// set_drawing, which restarts the sled's ride from these markers.
@external(javascript, "./canvas.mjs", "setMarkers")
pub fn set_markers(markers: List(Marker)) -> Nil

/// Turn the drawing's sound off (True) or on (False).
@external(javascript, "./canvas.mjs", "setMuted")
pub fn set_muted(muted: Bool) -> Nil
