//# sourceMappingURL=studio.mjs.map
import * as $int from "../gleam_stdlib/gleam/int.mjs";
import * as $list from "../gleam_stdlib/gleam/list.mjs";
import * as $string from "../gleam_stdlib/gleam/string.mjs";
import {
  setStudio as set_phase,
  setPen as set_pen,
  studioLines as lines,
  studioGoal as goal,
  studioUndo as undo,
  studioClear as clear,
} from "./canvas.mjs";
import {
  Ok,
  toList,
  Empty as $Empty,
  List$Empty$const as $List$Empty$const,
  prepend as listPrepend,
  CustomType as $CustomType,
} from "./gleam.mjs";
import * as $render from "./render.mjs";
import * as $shape from "./shape.mjs";

export { clear, goal, lines, set_pen, set_phase, undo };

export class Instrument extends $CustomType {
  constructor(name, color, code_color) {
    super();
    this.name = name;
    this.color = color;
    this.code_color = code_color;
  }
}
export const Instrument$Instrument = (name, color, code_color) =>
  new Instrument(name, color, code_color);
export const Instrument$isInstrument = (value) => value instanceof Instrument;
export const Instrument$Instrument$name = (value) => value.name;
export const Instrument$Instrument$0 = (value) => value.name;
export const Instrument$Instrument$color = (value) => value.color;
export const Instrument$Instrument$1 = (value) => value.color;
export const Instrument$Instrument$code_color = (value) => value.code_color;
export const Instrument$Instrument$2 = (value) => value.code_color;

/**
 * Tenths of a second between one sled and the next.
 * 
 * @ignore
 */
const sled_gap = 3;

/**
 * Tenths of a second each drawn line takes to appear.
 * 
 * @ignore
 */
const line_time = 2;

/**
 * The drawing in the drop-down that opens the Studio.
 */
export const drawing_name = "sled_symphony";

export const max_sleds = 50;

export function instruments() {
  return listPrepend(
    new Instrument("Piano", $render.line_color, ""),
    listPrepend(
      new Instrument("Bell", $render.color_hex($shape.Color$Blue$const), "Blue"),
      listPrepend(
        new Instrument("Drum", $render.color_hex($shape.Color$Red$const), "Red"),
        listPrepend(
          new Instrument(
            "Marimba",
            $render.color_hex($shape.Color$Green$const),
            "Green",
          ),
          listPrepend(
            new Instrument(
              "Bass",
              $render.color_hex($shape.Color$Purple$const),
              "Purple",
            ),
            listPrepend(
              new Instrument(
                "Synth",
                $render.color_hex($shape.Color$Gold$const),
                "Gold",
              ),
              $List$Empty$const,
            ),
          ),
        ),
      ),
    ),
  );
}

function point(x, y) {
  return ((("Point(" + $int.to_string(x)) + ", ") + $int.to_string(y)) + ")";
}

function plural(n, word) {
  if (n === 1) {
    return "1 " + word;
  } else {
    return (($int.to_string(n) + " ") + word) + "s";
  }
}

function spawn_point(lines) {
  if (lines instanceof $Empty) {
    return [0, -400];
  } else {
    let x1 = lines.head[0];
    let y1 = lines.head[1];
    let x2 = lines.head[2];
    let y2 = lines.head[3];
    let $ = y1 <= y2;
    if ($) {
      return [
        x1 + (globalThis.Math.trunc((x2 - x1) / 12)),
        (y1 + (globalThis.Math.trunc((y2 - y1) / 12))) - 25,
      ];
    } else {
      return [
        x2 + (globalThis.Math.trunc((x1 - x2) / 12)),
        (y2 + (globalThis.Math.trunc((y1 - y2) / 12))) - 25,
      ];
    }
  }
}

function code_color(color) {
  let $ = $list.find(instruments(), (i) => { return i.color === color; });
  if ($ instanceof Ok) {
    let instrument = $[0];
    return instrument.code_color;
  } else {
    return "";
  }
}

function line_path(line, start, end) {
  let x1 = line[0];
  let y1 = line[1];
  let x2 = line[2];
  let y2 = line[3];
  let color = line[4];
  let a = point(x1, y1);
  let b = point(x2, y2);
  let _block;
  let $ = code_color(color);
  if ($ === "") {
    _block = ((("Line(" + a) + ", ") + b) + ")";
  } else {
    let name = $;
    _block = ((((("ColorLine(" + a) + ", ") + b) + ", ") + name) + ")";
  }
  let shape = _block;
  return ((((("Path(" + shape) + ", ") + $int.to_string(start)) + ", ") + $int.to_string(
    end,
  )) + ", 4)";
}

/**
 * The source of a draw function for these lines, this flag, and this many
 * sleds: the Goal, one Path per line (in the order they were drawn, appearing
 * one after another), and a recursive helper that makes the sleds, which drop
 * in one after another above the first line once the track is complete.
 */
export function code(lines, goal, sleds) {
  let count = $list.length(lines);
  let track = $list.index_map(
    lines,
    (line, i) => {
      return ("    " + line_path(line, i * line_time, i * line_time + line_time)) + ",";
    },
  );
  let $ = spawn_point(lines);
  let sx = $[0];
  let sy = $[1];
  let first_sled = count * line_time + line_time;
  return $string.join(
    listPrepend(
      "fn draw(shape_slider: Int) -> List(Path) {",
      listPrepend(
        ((("  // Made in the Sled Studio: " + plural(count, "line")) + " and ") + plural(
          sleds,
          "sled",
        )) + ". Edit this code, or",
        listPrepend(
          "  // press \"Edit drawing\" to keep drawing with the mouse.",
          listPrepend(
            "  let sleds = " + $int.to_string(sleds),
            listPrepend(
              "  list.flatten([",
              listPrepend(
                ("    [Path(Goal(" + point(goal[0], goal[1])) + "), 0, 0, 0)],",
                listPrepend(
                  "    track(),",
                  listPrepend(
                    "    riders(0, sleds),",
                    listPrepend(
                      "  ])",
                      listPrepend(
                        "}",
                        listPrepend(
                          "",
                          listPrepend(
                            "// The drawn lines, appearing one after another. A line's length sets its",
                            listPrepend(
                              "// note, and its color its instrument (a plain Line is a piano).",
                              listPrepend(
                                "fn track() -> List(Path) {",
                                listPrepend(
                                  "  [",
                                  $list.append(
                                    track,
                                    toList([
                                      "  ]",
                                      "}",
                                      "",
                                      "// The sleds drop in one after another, just above the first line.",
                                      "fn riders(i: Int, n: Int) -> List(Path) {",
                                      "  case i == n {",
                                      "    True -> []",
                                      "    False -> {",
                                      ((("      let at = Point(" + $int.to_string(
                                        sx,
                                      )) + " + i % 5 * 6, ") + $int.to_string(
                                        sy,
                                      )) + ")",
                                      (("      let t = " + $int.to_string(
                                        first_sled,
                                      )) + " + i * ") + $int.to_string(sled_gap),
                                      "      [Path(Rider(at), t, t, 0), ..riders(i + 1, n)]",
                                      "    }",
                                      "  }",
                                      "}",
                                      "",
                                    ]),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
    "\n",
  );
}
