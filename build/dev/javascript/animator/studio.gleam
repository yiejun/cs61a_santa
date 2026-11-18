//// Extension (Sled Symphony): the Sled Studio. In the "sled_symphony" drawing the
//// user draws lines with the mouse on the canvas (canvas.mjs keeps them), and
//// pressing Done turns them into the source of a draw function, written here.

import gleam/int
import gleam/list
import gleam/string
import render
import shape

/// The drawing in the drop-down that opens the Studio.
pub const drawing_name = "sled_symphony"

/// An instrument the pen can draw with: its name, the colour it draws in, and
/// the Color the code names it by ("" for a plain Line, the piano).
pub type Instrument {
  Instrument(name: String, color: String, code_color: String)
}

pub fn instruments() -> List(Instrument) {
  [
    Instrument("Piano", render.line_color, ""),
    Instrument("Bell", render.color_hex(shape.Blue), "Blue"),
    Instrument("Drum", render.color_hex(shape.Red), "Red"),
    Instrument("Marimba", render.color_hex(shape.Green), "Green"),
    Instrument("Bass", render.color_hex(shape.Purple), "Purple"),
    Instrument("Synth", render.color_hex(shape.Gold), "Gold"),
  ]
}

pub const max_sleds = 50

// ── The canvas (canvas.mjs) ───────────────────────────────────────────────────

/// "off" for an ordinary drawing, "draw" while the user draws, or "ride" once
/// the Studio's code is riding.
@external(javascript, "./canvas.mjs", "setStudio")
pub fn set_phase(phase: String) -> Nil

/// The colour of the next line the user draws.
@external(javascript, "./canvas.mjs", "setPen")
pub fn set_pen(color: String) -> Nil

/// The lines drawn so far, each #(x1, y1, x2, y2, colour), oldest first.
@external(javascript, "./canvas.mjs", "studioLines")
pub fn lines() -> List(#(Int, Int, Int, Int, String))

/// Where the flag is.
@external(javascript, "./canvas.mjs", "studioGoal")
pub fn goal() -> #(Int, Int)

@external(javascript, "./canvas.mjs", "studioUndo")
pub fn undo() -> Nil

@external(javascript, "./canvas.mjs", "studioClear")
pub fn clear() -> Nil

// ── Writing the code ──────────────────────────────────────────────────────────

/// Tenths of a second each drawn line takes to appear.
const line_time = 2

/// Tenths of a second between one sled and the next.
const sled_gap = 3

/// The source of a draw function for these lines, this flag, and this many
/// sleds: the Goal, one Path per line (in the order they were drawn, appearing
/// one after another), and a recursive helper that makes the sleds, which drop
/// in one after another above the first line once the track is complete.
pub fn code(
  lines: List(#(Int, Int, Int, Int, String)),
  goal: #(Int, Int),
  sleds: Int,
) -> String {
  let count = list.length(lines)
  let track =
    list.index_map(lines, fn(line, i) {
      "    " <> line_path(line, i * line_time, i * line_time + line_time) <> ","
    })
  let #(sx, sy) = spawn_point(lines)
  let first_sled = count * line_time + line_time
  string.join(
    [
      "fn draw(shape_slider: Int) -> List(Path) {",
      "  // Made in the Sled Studio: "
        <> plural(count, "line")
        <> " and "
        <> plural(sleds, "sled")
        <> ". Edit this code, or",
      "  // press \"Edit drawing\" to keep drawing with the mouse.",
      "  let sleds = " <> int.to_string(sleds),
      "  list.flatten([",
      "    [Path(Goal(" <> point(goal.0, goal.1) <> "), 0, 0, 0)],",
      "    track(),",
      "    riders(0, sleds),",
      "  ])",
      "}",
      "",
      "// The drawn lines, appearing one after another. A line's length sets its",
      "// note, and its color its instrument (a plain Line is a piano).",
      "fn track() -> List(Path) {",
      "  [",
      ..list.append(track, [
        "  ]",
        "}",
        "",
        "// The sleds drop in one after another, just above the first line.",
        "fn riders(i: Int, n: Int) -> List(Path) {",
        "  case i == n {",
        "    True -> []",
        "    False -> {",
        "      let at = Point("
          <> int.to_string(sx)
          <> " + i % 5 * 6, "
          <> int.to_string(sy)
          <> ")",
        "      let t = "
          <> int.to_string(first_sled)
          <> " + i * "
          <> int.to_string(sled_gap),
        "      [Path(Rider(at), t, t, 0), ..riders(i + 1, n)]",
        "    }",
        "  }",
        "}",
        "",
      ])
    ],
    "\n",
  )
}

fn line_path(
  line: #(Int, Int, Int, Int, String),
  start: Int,
  end: Int,
) -> String {
  let #(x1, y1, x2, y2, color) = line
  let a = point(x1, y1)
  let b = point(x2, y2)
  let shape = case code_color(color) {
    "" -> "Line(" <> a <> ", " <> b <> ")"
    name -> "ColorLine(" <> a <> ", " <> b <> ", " <> name <> ")"
  }
  "Path("
  <> shape
  <> ", "
  <> int.to_string(start)
  <> ", "
  <> int.to_string(end)
  <> ", 4)"
}

// The Color a drawn colour is called in code, or "" for the piano's Line.
fn code_color(color: String) -> String {
  case list.find(instruments(), fn(i) { i.color == color }) {
    Ok(instrument) -> instrument.code_color
    Error(Nil) -> ""
  }
}

// Just above the first line, a little way in from its higher end, so the sleds
// ride it downhill rather than balancing on its tip.
fn spawn_point(lines: List(#(Int, Int, Int, Int, String))) -> #(Int, Int) {
  case lines {
    [#(x1, y1, x2, y2, _), ..] ->
      case y1 <= y2 {
        True -> #(x1 + { x2 - x1 } / 12, y1 + { y2 - y1 } / 12 - 25)
        False -> #(x2 + { x1 - x2 } / 12, y2 + { y1 - y2 } / 12 - 25)
      }
    [] -> #(0, -400)
  }
}

fn point(x: Int, y: Int) -> String {
  "Point(" <> int.to_string(x) <> ", " <> int.to_string(y) <> ")"
}

fn plural(n: Int, word: String) -> String {
  case n {
    1 -> "1 " <> word
    _ -> int.to_string(n) <> " " <> word <> "s"
  }
}
