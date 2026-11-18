//// Animator -- an application for program-generated drawings.

import builtins
import data
import drawing
import editor
import errors
import examples
import gleam/dynamic/decode
import gleam/float
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}

import gleam/result
import lustre
import lustre/attribute as attr
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import parser
import render
import shape.{type Path}
import studio

/// Your app's public address, once you've deployed it in Problem 13, such as
/// "https://your-username.github.io/animator/".
pub const public_url = ""

/// Set to True if you would like your app's URL included in the course gallery.
pub const include_app_in_gallery = True

/// A link to your video from Problem 14, which anyone with the link can watch.
pub const video_url = ""

/// Set to True if you would like your video included in the course gallery.
pub const include_video_in_gallery = True

const default_code =
  "fn draw(shape_slider: Int) -> List(Path) {\n  [Path(Line(Point(0, 0), Point(100, 100)), 0, 10, 2)]\n}\n"

const library_key = "animator.drawings"

const current_key = "animator.current"

// The colours a drawing without the extension's shapes cycles through.
const palette = ["#f5e6c0", "#f0b030", "#6fa8e0", "#2a2ae0"]

// ── Model ──────────────────────────────────────────────────────────────────────

pub type Model {
  Model(
    // The code in the editor.
    source: String,
    // Whether the code editor is shown.
    code_open: Bool,
    output: String,
    // prob 9~
    shape_slider: Int,
    speed: Float,
    controls_open: Bool,
    error: Option(String),
    drawings: List(#(String, String)),
    current: String,
    // Extension (Sled Symphony): whether sound is off.
    muted: Bool,
    // Whether the Sled Studio is open, and in which phase.
    studio: StudioPhase,
    // The colour the Studio's pen draws in.
    pen: String,
    // How many sleds the Studio sends.
    sleds: Int,
  )
}

/// The Sled Studio, which opens with the "sled_symphony" drawing: off for any
/// other drawing, Drawing while the user draws lines with the mouse, and Riding
/// once Done has written them as code and the sleds ride it.
pub type StudioPhase {
  Off
  Drawing
  Riding
}

pub type Msg {
  SetCode(String)

  // Layout controls
  ToggleCode

  //prob 9~~
  ToggleControls
  Reset
  Play
  Pause
  SetSpeed(String)
  SetShape(String)
  SelectDrawing(String)
  NewDrawing(String)

  // Extension (Sled Symphony)
  ToggleMute
  SetPen(String)
  SetSleds(String)
  StudioDone
  StudioEdit
  StudioUndo
  StudioClear
  RideAgain
}

// ── Init ───────────────────────────────────────────────────────────────────────

pub fn init(_flags: Nil) -> #(Model, Effect(Msg)) {
  let drawings = load_library()
  let current = case data.storage_get(current_key) {
    Ok(name) ->
      case list.key_find(drawings, name) {
        Ok(_) -> name
        Error(Nil) -> first_name(drawings)
      }
    Error(Nil) -> first_name(drawings)
  }
  let source = list.key_find(drawings, current) |> result.unwrap(default_code)

  #(
    Model(
      source: "",
      code_open: True,
      shape_slider: 10,
      speed: 1.0,
      controls_open: True,
      error: None,
      drawings: drawings,
      current: current,
      output: "",
      muted: False,
      studio: case current == studio.drawing_name {
        True -> Drawing
        False -> Off
      },
      pen: render.line_color,
      sleds: 12,
    ),
    // Effects that happen automatically at the start go here.
    effect.batch([
      editor.mount(source, SetCode),
      effect.from(fn(dispatch) { dispatch(SetCode(source)) }),
      // Open the Studio if the drawing opened last was its drawing.
      case current == studio.drawing_name {
        True -> effect.from(fn(_) { studio.set_phase("draw") })
        False -> effect.none()
      },
    ]),
  )
}

fn first_name(drawings: List(#(String, String))) -> String {
  case drawings {
    [#(name, _), ..] -> name
    [] -> "untitled"
  }
}

fn load_library() -> List(#(String, String)) {
  let decoder =
    decode.list({
      use name <- decode.field("name", decode.string)
      use source <- decode.field("source", decode.string)
      decode.success(#(name, source))
    })
  case data.storage_get(library_key) {
    Ok(text) ->
      case json.parse(text, decoder) {
        Ok([_, ..] as drawings) -> with_new_examples(drawings)
        _ -> examples.all
      }
    Error(Nil) -> examples.all
  }
}

// A saved library plus any example it doesn't have yet, so that examples added
// to the app later still appear for someone who already has a library.
fn with_new_examples(
  drawings: List(#(String, String)),
) -> List(#(String, String)) {
  let missing =
    list.filter(examples.all, fn(example) {
      result.is_error(list.key_find(drawings, example.0))
    })
  list.append(drawings, missing)
}

fn save_library(drawings: List(#(String, String))) -> Nil {
  json.array(drawings, fn(d) {
    json.object([#("name", json.string(d.0)), #("source", json.string(d.1))])
  })
  |> json.to_string
  |> data.storage_set(library_key, _)
}

fn put_source(
  drawings: List(#(String, String)),
  name: String,
  source: String,
) -> List(#(String, String)) {
  case list.key_find(drawings, name) {
    Ok(_) ->
      list.map(drawings, fn(d) {
        case d.0 == name {
          True -> #(name, source)
          False -> d
        }
      })
    Error(Nil) -> list.append(drawings, [#(name, source)])
  }
}

// Parse and evaluate a draw function at the given shape-slider value, returning
// the rendered paths on success, or a human-readable message on failure.
fn run_source(shape_slider: Int, source: String) -> Result(List(Path), String) {
  case parser.parse_program(source, builtins.global_frame()) {
    Error(msg) -> Error(msg)
    Ok(program) ->
      drawing.try_draw(shape_slider, program)
      // Convert Error(EvalError) to Error(String) with a useful error message.
      |> result.map_error(errors.error_message)
  }
}

fn redraw(model: Model) -> #(Model, Effect(Msg)) {
  case run_source(model.shape_slider, model.source) {
    Ok(paths) -> #(
      Model(..model, error: None),
      effect.from(fn(_) {
        // Only a drawing that uses ColorLine, Rider, or Goal is a Sled Symphony
        // drawing, with notes, a sled, and cream plain lines. Any other drawing
        // keeps the cycling colours and stays silent.
        let game = render.uses_extension(paths)
        // The game and markers first, since set_drawing starts the sled's ride.
        render.set_game(game)
        render.set_markers(render.markers(paths))
        paths
        |> list.index_map(fn(path, i) {
          case game {
            True -> render.render_path(path, render.line_color)
            False -> render.render_path(path, color_at(i))
          }
        })
        |> render.set_drawing
      }),
    )
    Error(msg) -> #(Model(..model, error: Some(msg)), effect.none())
  }
}

fn color_at(i: Int) -> String {
  let n = list.length(palette)
  palette
  |> list.drop(i % n)
  |> list.first
  |> result.unwrap("#e8d8b0")
}

fn open_drawing(model: Model, name: String) -> #(Model, Effect(Msg)) {
  let source = list.key_find(model.drawings, name) |> result.unwrap("")
  data.storage_set(current_key, name)
  // The Studio's drawing opens on its drawing canvas; any other closes it.
  let phase = case name == studio.drawing_name {
    True -> Drawing
    False -> Off
  }
  let #(model, draw) =
    redraw(
      Model(..model, current: name, source: source, studio: phase, error: None),
    )
  let pen = model.pen
  #(
    model,
    effect.batch([
      effect.from(fn(_) {
        studio.set_phase(phase_name(phase))
        studio.set_pen(pen)
      }),
      editor.mount(source, SetCode),
      draw,
      effect.from(fn(_) { render.reset_clock() }),
    ]),
  )
}

fn phase_name(phase: StudioPhase) -> String {
  case phase {
    Off -> "off"
    Drawing -> "draw"
    Riding -> "ride"
  }
}

// Write the Studio's lines as code, put it in the editor, and send the sleds.
fn ride_studio(
  model: Model,
  lines: List(#(Int, Int, Int, Int, String)),
) -> #(Model, Effect(Msg)) {
  let source = studio.code(lines, studio.goal(), model.sleds)
  let drawings = put_source(model.drawings, model.current, source)
  save_library(drawings)
  let #(model, draw) =
    redraw(
      Model(
        ..model,
        source: source,
        drawings: drawings,
        studio: Riding,
        speed: 1.0,
        error: None,
      ),
    )
  #(
    model,
    effect.batch([
      // Back to time 0 before the new drawing arrives, so the ride starts fresh.
      effect.from(fn(_) {
        studio.set_phase("ride")
        render.reset_clock()
        render.set_speed(1.0)
      }),
      editor.mount(source, SetCode),
      draw,
    ]),
  )
}

// Slider values arrive as text such as "10" or "1.5".
fn parse_number(text: String) -> Result(Float, Nil) {
  case float.parse(text) {
    Ok(x) -> Ok(x)
    Error(Nil) -> int.parse(text) |> result.map(int.to_float)
  }
}

fn set_speed(model: Model, speed: Float) -> #(Model, Effect(Msg)) {
  #(
    Model(..model, speed: speed),
    effect.from(fn(_) { render.set_speed(speed) }),
  )
}

// ── Update ─────────────────────────────────────────────────────────────────────

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    ToggleCode -> #(Model(..model, code_open: !model.code_open), effect.none())
    ToggleControls -> #(
      Model(..model, controls_open: !model.controls_open),
      effect.none(),
    )
    ToggleMute -> {
      let muted = !model.muted
      #(
        Model(..model, muted: muted),
        effect.from(fn(_) { render.set_muted(muted) }),
      )
    }

    // ── The Sled Studio ──
    SetPen(color) -> #(
      Model(..model, pen: color),
      effect.from(fn(_) { studio.set_pen(color) }),
    )

    SetSleds(text) ->
      case parse_number(text) {
        Ok(value) -> {
          let sleds = int.clamp(float.round(value), 1, studio.max_sleds)
          let model = Model(..model, sleds: sleds)
          // While riding, a new count rewrites the code and rides again.
          case model.studio, studio.lines() {
            Riding, [_, ..] as lines -> ride_studio(model, lines)
            _, _ -> #(model, effect.none())
          }
        }
        Error(Nil) -> #(model, effect.none())
      }

    StudioDone ->
      case studio.lines() {
        [] -> #(
          Model(
            ..model,
            error: Some(
              "Draw at least one line on the canvas before pressing Done.",
            ),
          ),
          effect.none(),
        )
        lines -> ride_studio(model, lines)
      }

    StudioEdit -> #(
      Model(..model, studio: Drawing, error: None),
      effect.from(fn(_) { studio.set_phase("draw") }),
    )

    StudioUndo -> #(
      Model(..model, error: None),
      effect.from(fn(_) { studio.undo() }),
    )

    StudioClear -> #(
      Model(..model, error: None),
      effect.from(fn(_) { studio.clear() }),
    )

    RideAgain -> {
      let #(model, speed) = set_speed(model, 1.0)
      #(
        model,
        effect.batch([effect.from(fn(_) { render.reset_clock() }), speed]),
      )
    }

    SetCode(text) -> {
      let drawings = put_source(model.drawings, model.current, text)
      save_library(drawings)
      redraw(Model(..model, source: text, drawings: drawings))
    }

    Reset -> {
      let #(model, speed) = set_speed(model, 0.0)
      #(
        model,
        effect.batch([speed, effect.from(fn(_) { render.reset_clock() })]),
      )
    }

    Play -> set_speed(model, 1.0)
    Pause -> set_speed(model, 0.0)
    SetSpeed(text) ->
      case parse_number(text) {
        Ok(speed) -> set_speed(model, speed)
        Error(Nil) -> #(model, effect.none())
      }

    SetShape(text) ->
      case parse_number(text) {
        Ok(value) -> redraw(Model(..model, shape_slider: float.round(value)))
        Error(Nil) -> #(model, effect.none())
      }

    SelectDrawing("") -> #(
      model,
      effect.from(fn(dispatch) {
        dispatch(NewDrawing(data.prompt_drawing_name()))
      }),
    )

    SelectDrawing(name) -> open_drawing(model, name)

    NewDrawing("") -> #(model, effect.none())

    NewDrawing(name) ->
      case list.key_find(model.drawings, name) {
        Ok(_) -> open_drawing(model, name)
        Error(Nil) -> {
          let drawings = list.append(model.drawings, [#(name, default_code)])
          save_library(drawings)
          open_drawing(Model(..model, drawings: drawings), name)
        }
      }
    // After each keystroke in the editor, evaluate user code and report errors.
    // SetCode(text) ->
    //   case run_source(10, text) {
    //     // Parsed and evaluated: show the result.
    //     Ok(paths) -> #(
    //       Model(..model, output: string.inspect(paths), source: text),
    //       effect.none(),
    //     )
    //     // Broken (parse or evaluation): show the error.
    //     Error(msg) -> #(
    //       Model(..model, output: msg, source: text),
    //       effect.none(),
    //     )
    //   }
  }
}

// ── View ──────────────────────────────────────────────────────────────────
//
// Two side-by-side panes: the code editor on the left and its rendered output on
// the right. The code column can be hidden to expand the right pane.

pub fn view(model: Model) -> Element(Msg) {
  let app_class = case model.code_open {
    True -> "app"
    False -> "app code-hidden"
  }
  // The code column still exists even when hidden (CSS collapses it) so the
  // mounted CodeMirror editor keeps its state across show/hide.
  html.div([attr.class(app_class)], [
    html.div([attr.class("code-col")], [
      editor.view_panel(ToggleCode, view_drawing_select(model)),
    ]),
    view_anim(model),
  ])
}

fn view_drawing_select(model: Model) -> Element(Msg) {
  let options =
    list.map(model.drawings, fn(d) {
      html.option([attr.value(d.0), attr.selected(d.0 == model.current)], d.0)
    })
  html.select(
    [
      attr.class("select"),
      attr.attribute("data-test-id", "drawing-select"),
      attr.value(model.current),
      event.on_change(SelectDrawing),
    ],
    list.append(options, [html.option([attr.value("")], "+ New drawing...")]),
  )
}

fn view_anim(model: Model) -> Element(Msg) {
  html.div([attr.class("canvas-area")], [
    html.canvas([attr.class("canvas"), attr.id("animation-canvas")]),
    view_reveal_code(model),
    view_error(model),
    view_controls(model),
  ])
}

fn view_error(model: Model) -> Element(Msg) {
  case model.error {
    None -> element.none()
    Some(msg) ->
      html.div([attr.class("error-toast")], [
        html.div([attr.class("error")], [html.text(msg)]),
      ])
  }
}

fn view_controls(model: Model) -> Element(Msg) {
  case model.controls_open, model.studio {
    True, Drawing -> view_studio_draw(model)
    True, Riding -> view_studio_ride(model)
    _, _ -> view_classic_controls(model)
  }
}

// The control panel of every drawing but the Studio's.
fn view_classic_controls(model: Model) -> Element(Msg) {
  case model.controls_open {
    False ->
      html.button(
        [
          attr.class("icon-btn controls-show"),
          attr.attribute("data-test-id", "controls-toggle"),
          attr.attribute("title", "Show controls"),
          event.on_click(ToggleControls),
        ],
        [html.text("▴")],
      )

    True ->
      html.div([attr.class("controls")], [
        html.div([attr.class("controls-head")], [
          html.button(
            [
              attr.class("icon-btn"),
              attr.attribute("data-test-id", "controls-toggle"),
              attr.attribute("title", "Hide controls"),
              event.on_click(ToggleControls),
            ],
            [html.text("▾")],
          ),
        ]),
        html.div([attr.class("controls-row")], [
          ctrl_button("Reset (speed 0, time 0)", "🔄", Reset),
          ctrl_button("Play (speed 1)", "▶️", Play),
          ctrl_button("Pause (speed 0)", "⏸️", Pause),
          case model.muted {
            True -> ctrl_button("Sound on", "🔇", ToggleMute)
            False -> ctrl_button("Sound off", "🔊", ToggleMute)
          },
          html.input([
            attr.class("range"),
            attr.attribute("data-test-id", "speed-slider"),
            attr.type_("range"),
            attr.min("-6.0"),
            attr.max("6.0"),
            attr.step("0.1"),
            attr.value(float.to_string(model.speed)),
            attr.attribute("title", "Speed"),
            event.on_input(SetSpeed),
          ]),
        ]),
        html.div([attr.class("slider-row")], [
          html.div([attr.class("label")], [
            html.text("Shape: " <> int.to_string(model.shape_slider)),
          ]),
          html.input([
            attr.class("range"),
            attr.attribute("data-test-id", "shape-slider"),
            attr.type_("range"),
            attr.min("0"),
            attr.max("100"),
            attr.step("1"),
            attr.value(int.to_string(model.shape_slider)),
            event.on_input(SetShape),
          ]),
        ]),
      ])
  }
}

// ── The Sled Studio's panels ─────────────────────────────────────────────────

// The panel's header: its title and the button that hides it.
fn studio_head(title: String) -> Element(Msg) {
  html.div([attr.class("controls-head studio-head")], [
    html.span([attr.class("studio-title")], [html.text(title)]),
    html.button(
      [
        attr.class("icon-btn"),
        attr.attribute("data-test-id", "controls-toggle"),
        attr.attribute("title", "Hide controls"),
        event.on_click(ToggleControls),
      ],
      [html.text("▾")],
    ),
  ])
}

fn sleds_slider(model: Model) -> Element(Msg) {
  html.div([attr.class("slider-row")], [
    html.div([attr.class("label")], [
      html.text("Sleds: " <> int.to_string(model.sleds)),
    ]),
    html.input([
      attr.class("range"),
      attr.attribute("data-test-id", "sled-slider"),
      attr.type_("range"),
      attr.min("1"),
      attr.max(int.to_string(studio.max_sleds)),
      attr.step("1"),
      attr.value(int.to_string(model.sleds)),
      event.on_input(SetSleds),
    ]),
  ])
}

fn text_button(label: String, class: String, msg: Msg) -> Element(Msg) {
  html.button([attr.class("text-btn " <> class), event.on_click(msg)], [
    html.text(label),
  ])
}

// Drawing: pick the pen's instrument and the number of sleds, then Done.
fn view_studio_draw(model: Model) -> Element(Msg) {
  html.div([attr.class("controls studio")], [
    studio_head("🛷 Sled Studio · draw"),
    html.div([attr.class("label")], [html.text("Instrument for new lines")]),
    html.div(
      [attr.class("swatches")],
      list.map(studio.instruments(), fn(instrument) {
        let selected = case instrument.color == model.pen {
          True -> " selected"
          False -> ""
        }
        html.button(
          [
            attr.class("swatch" <> selected),
            attr.attribute("title", instrument.name),
            event.on_click(SetPen(instrument.color)),
          ],
          [
            html.span(
              [
                attr.class("swatch-dot"),
                attr.style("background", instrument.color),
              ],
              [],
            ),
            html.text(instrument.name),
          ],
        )
      }),
    ),
    sleds_slider(model),
    html.div([attr.class("studio-actions")], [
      text_button("↶ Undo", "", StudioUndo),
      text_button("🗑 Clear", "", StudioClear),
      text_button("✓ Done", "primary", StudioDone),
    ]),
  ])
}

// Riding: replay, pause, mute, speed, the sled count, and back to drawing.
fn view_studio_ride(model: Model) -> Element(Msg) {
  html.div([attr.class("controls studio")], [
    studio_head("🛷 Sled Studio · ride"),
    html.div([attr.class("controls-row")], [
      ctrl_button("Ride again", "🔄", RideAgain),
      ctrl_button("Play (speed 1)", "▶️", Play),
      ctrl_button("Pause (speed 0)", "⏸️", Pause),
      case model.muted {
        True -> ctrl_button("Sound on", "🔇", ToggleMute)
        False -> ctrl_button("Sound off", "🔊", ToggleMute)
      },
      html.input([
        attr.class("range"),
        attr.attribute("data-test-id", "speed-slider"),
        attr.type_("range"),
        attr.min("-6.0"),
        attr.max("6.0"),
        attr.step("0.1"),
        attr.value(float.to_string(model.speed)),
        attr.attribute("title", "Speed"),
        event.on_input(SetSpeed),
      ]),
    ]),
    sleds_slider(model),
    html.div([attr.class("studio-actions")], [
      text_button("✏️ Edit drawing", "primary", StudioEdit),
    ]),
  ])
}

fn ctrl_button(title: String, glyph: String, msg: Msg) -> Element(Msg) {
  html.button(
    [
      attr.class("icon-btn ctrl-btn"),
      attr.attribute("title", title),
      event.on_click(msg),
    ],
    [html.text(glyph)],
  )
}

// fn view_anim(model: Model) -> Element(Msg) {
//   html.div([attr.class("canvas-area")], [
//     view_reveal_code(model),
//     html.pre([attr.class("output")], [html.text(model.output)]),
//   ])
// }

// The button that brings the code column back, overlaid on the top-left of the
// right pane. Nothing is rendered while the column is already showing (its own
// header holds the button that hides it).
fn view_reveal_code(model: Model) -> Element(Msg) {
  case model.code_open {
    True -> element.none()
    False ->
      html.button(
        [
          attr.class("icon-btn reveal-code"),
          attr.attribute("title", "Show code"),
          event.on_click(ToggleCode),
        ],
        [html.text("⟩")],
      )
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

pub fn main() -> Nil {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
