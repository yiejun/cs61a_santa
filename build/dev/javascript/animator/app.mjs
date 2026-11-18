//# sourceMappingURL=app.mjs.map
import * as $json from "../gleam_json/gleam/json.mjs";
import * as $decode from "../gleam_stdlib/gleam/dynamic/decode.mjs";
import * as $float from "../gleam_stdlib/gleam/float.mjs";
import * as $int from "../gleam_stdlib/gleam/int.mjs";
import * as $list from "../gleam_stdlib/gleam/list.mjs";
import * as $option from "../gleam_stdlib/gleam/option.mjs";
import { Some, Option$None$const } from "../gleam_stdlib/gleam/option.mjs";
import * as $result from "../gleam_stdlib/gleam/result.mjs";
import * as $lustre from "../lustre/lustre.mjs";
import * as $attr from "../lustre/lustre/attribute.mjs";
import * as $effect from "../lustre/lustre/effect.mjs";
import * as $element from "../lustre/lustre/element.mjs";
import * as $html from "../lustre/lustre/element/html.mjs";
import * as $event from "../lustre/lustre/event.mjs";
import * as $builtins from "./builtins.mjs";
import * as $data from "./data.mjs";
import * as $drawing from "./drawing.mjs";
import * as $editor from "./editor.mjs";
import * as $errors from "./errors.mjs";
import * as $examples from "./examples.mjs";
import {
  Ok,
  Empty as $Empty,
  List$Empty$const as $List$Empty$const,
  prepend as listPrepend,
  CustomType as $CustomType,
  makeError,
  remainderInt,
} from "./gleam.mjs";
import * as $parser from "./parser.mjs";
import * as $render from "./render.mjs";
import * as $shape from "./shape.mjs";
import * as $studio from "./studio.mjs";

const FILEPATH = "src/app.gleam";

export class Model extends $CustomType {
  constructor(source, code_open, output, shape_slider, speed, controls_open, error, drawings, current, muted, studio, pen, sleds) {
    super();
    this.source = source;
    this.code_open = code_open;
    this.output = output;
    this.shape_slider = shape_slider;
    this.speed = speed;
    this.controls_open = controls_open;
    this.error = error;
    this.drawings = drawings;
    this.current = current;
    this.muted = muted;
    this.studio = studio;
    this.pen = pen;
    this.sleds = sleds;
  }
}
export const Model$Model = (source, code_open, output, shape_slider, speed, controls_open, error, drawings, current, muted, studio, pen, sleds) =>
  new Model(source,
  code_open,
  output,
  shape_slider,
  speed,
  controls_open,
  error,
  drawings,
  current,
  muted,
  studio,
  pen,
  sleds);
export const Model$isModel = (value) => value instanceof Model;
export const Model$Model$source = (value) => value.source;
export const Model$Model$0 = (value) => value.source;
export const Model$Model$code_open = (value) => value.code_open;
export const Model$Model$1 = (value) => value.code_open;
export const Model$Model$output = (value) => value.output;
export const Model$Model$2 = (value) => value.output;
export const Model$Model$shape_slider = (value) => value.shape_slider;
export const Model$Model$3 = (value) => value.shape_slider;
export const Model$Model$speed = (value) => value.speed;
export const Model$Model$4 = (value) => value.speed;
export const Model$Model$controls_open = (value) => value.controls_open;
export const Model$Model$5 = (value) => value.controls_open;
export const Model$Model$error = (value) => value.error;
export const Model$Model$6 = (value) => value.error;
export const Model$Model$drawings = (value) => value.drawings;
export const Model$Model$7 = (value) => value.drawings;
export const Model$Model$current = (value) => value.current;
export const Model$Model$8 = (value) => value.current;
export const Model$Model$muted = (value) => value.muted;
export const Model$Model$9 = (value) => value.muted;
export const Model$Model$studio = (value) => value.studio;
export const Model$Model$10 = (value) => value.studio;
export const Model$Model$pen = (value) => value.pen;
export const Model$Model$11 = (value) => value.pen;
export const Model$Model$sleds = (value) => value.sleds;
export const Model$Model$12 = (value) => value.sleds;

export class Off extends $CustomType {}
export const StudioPhase$Off$const = new Off();
export const StudioPhase$Off = () => StudioPhase$Off$const;
export const StudioPhase$isOff = (value) => value instanceof Off;

export class Drawing extends $CustomType {}
export const StudioPhase$Drawing$const = new Drawing();
export const StudioPhase$Drawing = () => StudioPhase$Drawing$const;
export const StudioPhase$isDrawing = (value) => value instanceof Drawing;

export class Riding extends $CustomType {}
export const StudioPhase$Riding$const = new Riding();
export const StudioPhase$Riding = () => StudioPhase$Riding$const;
export const StudioPhase$isRiding = (value) => value instanceof Riding;

export class SetCode extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetCode = ($0) => new SetCode($0);
export const Msg$isSetCode = (value) => value instanceof SetCode;
export const Msg$SetCode$0 = (value) => value[0];

export class ToggleCode extends $CustomType {}
export const Msg$ToggleCode$const = new ToggleCode();
export const Msg$ToggleCode = () => Msg$ToggleCode$const;
export const Msg$isToggleCode = (value) => value instanceof ToggleCode;

export class ToggleControls extends $CustomType {}
export const Msg$ToggleControls$const = new ToggleControls();
export const Msg$ToggleControls = () => Msg$ToggleControls$const;
export const Msg$isToggleControls = (value) => value instanceof ToggleControls;

export class Reset extends $CustomType {}
export const Msg$Reset$const = new Reset();
export const Msg$Reset = () => Msg$Reset$const;
export const Msg$isReset = (value) => value instanceof Reset;

export class Play extends $CustomType {}
export const Msg$Play$const = new Play();
export const Msg$Play = () => Msg$Play$const;
export const Msg$isPlay = (value) => value instanceof Play;

export class Pause extends $CustomType {}
export const Msg$Pause$const = new Pause();
export const Msg$Pause = () => Msg$Pause$const;
export const Msg$isPause = (value) => value instanceof Pause;

export class SetSpeed extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetSpeed = ($0) => new SetSpeed($0);
export const Msg$isSetSpeed = (value) => value instanceof SetSpeed;
export const Msg$SetSpeed$0 = (value) => value[0];

export class SetShape extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetShape = ($0) => new SetShape($0);
export const Msg$isSetShape = (value) => value instanceof SetShape;
export const Msg$SetShape$0 = (value) => value[0];

export class SelectDrawing extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SelectDrawing = ($0) => new SelectDrawing($0);
export const Msg$isSelectDrawing = (value) => value instanceof SelectDrawing;
export const Msg$SelectDrawing$0 = (value) => value[0];

export class NewDrawing extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$NewDrawing = ($0) => new NewDrawing($0);
export const Msg$isNewDrawing = (value) => value instanceof NewDrawing;
export const Msg$NewDrawing$0 = (value) => value[0];

export class ToggleMute extends $CustomType {}
export const Msg$ToggleMute$const = new ToggleMute();
export const Msg$ToggleMute = () => Msg$ToggleMute$const;
export const Msg$isToggleMute = (value) => value instanceof ToggleMute;

export class SetPen extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetPen = ($0) => new SetPen($0);
export const Msg$isSetPen = (value) => value instanceof SetPen;
export const Msg$SetPen$0 = (value) => value[0];

export class SetSleds extends $CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
export const Msg$SetSleds = ($0) => new SetSleds($0);
export const Msg$isSetSleds = (value) => value instanceof SetSleds;
export const Msg$SetSleds$0 = (value) => value[0];

export class StudioDone extends $CustomType {}
export const Msg$StudioDone$const = new StudioDone();
export const Msg$StudioDone = () => Msg$StudioDone$const;
export const Msg$isStudioDone = (value) => value instanceof StudioDone;

export class StudioEdit extends $CustomType {}
export const Msg$StudioEdit$const = new StudioEdit();
export const Msg$StudioEdit = () => Msg$StudioEdit$const;
export const Msg$isStudioEdit = (value) => value instanceof StudioEdit;

export class StudioUndo extends $CustomType {}
export const Msg$StudioUndo$const = new StudioUndo();
export const Msg$StudioUndo = () => Msg$StudioUndo$const;
export const Msg$isStudioUndo = (value) => value instanceof StudioUndo;

export class StudioClear extends $CustomType {}
export const Msg$StudioClear$const = new StudioClear();
export const Msg$StudioClear = () => Msg$StudioClear$const;
export const Msg$isStudioClear = (value) => value instanceof StudioClear;

export class RideAgain extends $CustomType {}
export const Msg$RideAgain$const = new RideAgain();
export const Msg$RideAgain = () => Msg$RideAgain$const;
export const Msg$isRideAgain = (value) => value instanceof RideAgain;

const default_code = "fn draw(shape_slider: Int) -> List(Path) {\n  [Path(Line(Point(0, 0), Point(100, 100)), 0, 10, 2)]\n}\n";

const current_key = "animator.current";

const library_key = "animator.drawings";

const palette = /* @__PURE__ */ listPrepend(
  "#f5e6c0",
  listPrepend(
    "#f0b030",
    listPrepend("#6fa8e0", listPrepend("#2a2ae0", $List$Empty$const)),
  ),
);

/**
 * Your app's public address, once you've deployed it in Problem 13, such as
 * "https://your-username.github.io/animator/".
 */
export const public_url = "";

/**
 * Set to True if you would like your app's URL included in the course gallery.
 */
export const include_app_in_gallery = true;

/**
 * A link to your video from Problem 14, which anyone with the link can watch.
 */
export const video_url = "";

/**
 * Set to True if you would like your video included in the course gallery.
 */
export const include_video_in_gallery = true;

function first_name(drawings) {
  if (drawings instanceof $Empty) {
    return "untitled";
  } else {
    let name = drawings.head[0];
    return name;
  }
}

function with_new_examples(drawings) {
  let missing = $list.filter(
    $examples.all,
    (example) => {
      return $result.is_error($list.key_find(drawings, example[0]));
    },
  );
  return $list.append(drawings, missing);
}

function load_library() {
  let decoder = $decode.list(
    $decode.field(
      "name",
      $decode.string,
      (name) => {
        return $decode.field(
          "source",
          $decode.string,
          (source) => { return $decode.success([name, source]); },
        );
      },
    ),
  );
  let $ = $data.storage_get(library_key);
  if ($ instanceof Ok) {
    let text = $[0];
    let $1 = $json.parse(text, decoder);
    if ($1 instanceof Ok) {
      let $2 = $1[0];
      if ($2 instanceof $Empty) {
        return $examples.all;
      } else {
        let drawings = $2;
        return with_new_examples(drawings);
      }
    } else {
      return $examples.all;
    }
  } else {
    return $examples.all;
  }
}

export function init(_) {
  let drawings = load_library();
  let _block;
  let $ = $data.storage_get(current_key);
  if ($ instanceof Ok) {
    let name = $[0];
    let $1 = $list.key_find(drawings, name);
    if ($1 instanceof Ok) {
      _block = name;
    } else {
      _block = first_name(drawings);
    }
  } else {
    _block = first_name(drawings);
  }
  let current = _block;
  let _block$1;
  let _pipe = $list.key_find(drawings, current);
  _block$1 = $result.unwrap(_pipe, default_code);
  let source = _block$1;
  return [
    new Model(
      "",
      true,
      "",
      10,
      1.0,
      true,
      Option$None$const,
      drawings,
      current,
      false,
      (() => {
        let $1 = current === $studio.drawing_name;
        if ($1) {
          return StudioPhase$Drawing$const;
        } else {
          return StudioPhase$Off$const;
        }
      })(),
      $render.line_color,
      12,
    ),
    $effect.batch(
      listPrepend(
        $editor.mount(source, (var0) => { return new SetCode(var0); }),
        listPrepend(
          $effect.from((dispatch) => { return dispatch(new SetCode(source)); }),
          listPrepend(
            (() => {
              let $1 = current === $studio.drawing_name;
              if ($1) {
                return $effect.from(
                  (_) => { return $studio.set_phase("draw"); },
                );
              } else {
                return $effect.none();
              }
            })(),
            $List$Empty$const,
          ),
        ),
      ),
    ),
  ];
}

function save_library(drawings) {
  let _pipe = $json.array(
    drawings,
    (d) => {
      return $json.object(
        listPrepend(
          ["name", $json.string(d[0])],
          listPrepend(["source", $json.string(d[1])], $List$Empty$const),
        ),
      );
    },
  );
  let _pipe$1 = $json.to_string(_pipe);
  return ((_capture) => { return $data.storage_set(library_key, _capture); })(
    _pipe$1,
  );
}

function put_source(drawings, name, source) {
  let $ = $list.key_find(drawings, name);
  if ($ instanceof Ok) {
    return $list.map(
      drawings,
      (d) => {
        let $1 = d[0] === name;
        if ($1) {
          return [name, source];
        } else {
          return d;
        }
      },
    );
  } else {
    return $list.append(
      drawings,
      listPrepend([name, source], $List$Empty$const),
    );
  }
}

function run_source(shape_slider, source) {
  let $ = $parser.parse_program(source, $builtins.global_frame());
  if ($ instanceof Ok) {
    let program = $[0];
    let _pipe = $drawing.try_draw(shape_slider, program);
    return $result.map_error(_pipe, $errors.error_message);
  } else {
    return $;
  }
}

function color_at(i) {
  let n = $list.length(palette);
  let _pipe = palette;
  let _pipe$1 = $list.drop(_pipe, remainderInt(i, n));
  let _pipe$2 = $list.first(_pipe$1);
  return $result.unwrap(_pipe$2, "#e8d8b0");
}

function redraw(model) {
  let $ = run_source(model.shape_slider, model.source);
  if ($ instanceof Ok) {
    let paths = $[0];
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        Option$None$const,
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
      $effect.from(
        (_) => {
          let game = $render.uses_extension(paths);
          $render.set_game(game);
          $render.set_markers($render.markers(paths));
          let _pipe = paths;
          let _pipe$1 = $list.index_map(
            _pipe,
            (path, i) => {
              if (game) {
                return $render.render_path(path, $render.line_color);
              } else {
                return $render.render_path(path, color_at(i));
              }
            },
          );
          return $render.set_drawing(_pipe$1);
        },
      ),
    ];
  } else {
    let msg = $[0];
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        new Some(msg),
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
      $effect.none(),
    ];
  }
}

function phase_name(phase) {
  if (phase instanceof Off) {
    return "off";
  } else if (phase instanceof Drawing) {
    return "draw";
  } else {
    return "ride";
  }
}

function open_drawing(model, name) {
  let _block;
  let _pipe = $list.key_find(model.drawings, name);
  _block = $result.unwrap(_pipe, "");
  let source = _block;
  $data.storage_set(current_key, name);
  let _block$1;
  let $ = name === $studio.drawing_name;
  if ($) {
    _block$1 = StudioPhase$Drawing$const;
  } else {
    _block$1 = StudioPhase$Off$const;
  }
  let phase = _block$1;
  let $1 = redraw(
    new Model(
      source,
      model.code_open,
      model.output,
      model.shape_slider,
      model.speed,
      model.controls_open,
      Option$None$const,
      model.drawings,
      name,
      model.muted,
      phase,
      model.pen,
      model.sleds,
    ),
  );
  let model$1 = $1[0];
  let draw = $1[1];
  let pen = model$1.pen;
  return [
    model$1,
    $effect.batch(
      listPrepend(
        $effect.from(
          (_) => {
            $studio.set_phase(phase_name(phase));
            return $studio.set_pen(pen);
          },
        ),
        listPrepend(
          $editor.mount(source, (var0) => { return new SetCode(var0); }),
          listPrepend(
            draw,
            listPrepend(
              $effect.from((_) => { return $render.reset_clock(); }),
              $List$Empty$const,
            ),
          ),
        ),
      ),
    ),
  ];
}

function ride_studio(model, lines) {
  let source = $studio.code(lines, $studio.goal(), model.sleds);
  let drawings = put_source(model.drawings, model.current, source);
  save_library(drawings);
  let $ = redraw(
    new Model(
      source,
      model.code_open,
      model.output,
      model.shape_slider,
      1.0,
      model.controls_open,
      Option$None$const,
      drawings,
      model.current,
      model.muted,
      StudioPhase$Riding$const,
      model.pen,
      model.sleds,
    ),
  );
  let model$1 = $[0];
  let draw = $[1];
  return [
    model$1,
    $effect.batch(
      listPrepend(
        $effect.from(
          (_) => {
            $studio.set_phase("ride");
            $render.reset_clock();
            return $render.set_speed(1.0);
          },
        ),
        listPrepend(
          $editor.mount(source, (var0) => { return new SetCode(var0); }),
          listPrepend(draw, $List$Empty$const),
        ),
      ),
    ),
  ];
}

function parse_number(text) {
  let $ = $float.parse(text);
  if ($ instanceof Ok) {
    return $;
  } else {
    let _pipe = $int.parse(text);
    return $result.map(_pipe, $int.to_float);
  }
}

function set_speed(model, speed) {
  return [
    new Model(
      model.source,
      model.code_open,
      model.output,
      model.shape_slider,
      speed,
      model.controls_open,
      model.error,
      model.drawings,
      model.current,
      model.muted,
      model.studio,
      model.pen,
      model.sleds,
    ),
    $effect.from((_) => { return $render.set_speed(speed); }),
  ];
}

export function update(model, msg) {
  if (msg instanceof SetCode) {
    let text = msg[0];
    let drawings = put_source(model.drawings, model.current, text);
    save_library(drawings);
    return redraw(
      new Model(
        text,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        model.error,
        drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
    );
  } else if (msg instanceof ToggleCode) {
    return [
      new Model(
        model.source,
        !model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        model.error,
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
      $effect.none(),
    ];
  } else if (msg instanceof ToggleControls) {
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        !model.controls_open,
        model.error,
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
      $effect.none(),
    ];
  } else if (msg instanceof Reset) {
    let $ = set_speed(model, 0.0);
    let model$1 = $[0];
    let speed = $[1];
    return [
      model$1,
      $effect.batch(
        listPrepend(
          speed,
          listPrepend(
            $effect.from((_) => { return $render.reset_clock(); }),
            $List$Empty$const,
          ),
        ),
      ),
    ];
  } else if (msg instanceof Play) {
    return set_speed(model, 1.0);
  } else if (msg instanceof Pause) {
    return set_speed(model, 0.0);
  } else if (msg instanceof SetSpeed) {
    let text = msg[0];
    let $ = parse_number(text);
    if ($ instanceof Ok) {
      let speed = $[0];
      return set_speed(model, speed);
    } else {
      return [model, $effect.none()];
    }
  } else if (msg instanceof SetShape) {
    let text = msg[0];
    let $ = parse_number(text);
    if ($ instanceof Ok) {
      let value = $[0];
      return redraw(
        new Model(
          model.source,
          model.code_open,
          model.output,
          $float.round(value),
          model.speed,
          model.controls_open,
          model.error,
          model.drawings,
          model.current,
          model.muted,
          model.studio,
          model.pen,
          model.sleds,
        ),
      );
    } else {
      return [model, $effect.none()];
    }
  } else if (msg instanceof SelectDrawing) {
    let $ = msg[0];
    if ($ === "") {
      return [
        model,
        $effect.from(
          (dispatch) => {
            return dispatch(new NewDrawing($data.prompt_drawing_name()));
          },
        ),
      ];
    } else {
      let name = $;
      return open_drawing(model, name);
    }
  } else if (msg instanceof NewDrawing) {
    let $ = msg[0];
    if ($ === "") {
      return [model, $effect.none()];
    } else {
      let name = $;
      let $1 = $list.key_find(model.drawings, name);
      if ($1 instanceof Ok) {
        return open_drawing(model, name);
      } else {
        let drawings = $list.append(
          model.drawings,
          listPrepend([name, default_code], $List$Empty$const),
        );
        save_library(drawings);
        return open_drawing(
          new Model(
            model.source,
            model.code_open,
            model.output,
            model.shape_slider,
            model.speed,
            model.controls_open,
            model.error,
            drawings,
            model.current,
            model.muted,
            model.studio,
            model.pen,
            model.sleds,
          ),
          name,
        );
      }
    }
  } else if (msg instanceof ToggleMute) {
    let muted = !model.muted;
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        model.error,
        model.drawings,
        model.current,
        muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
      $effect.from((_) => { return $render.set_muted(muted); }),
    ];
  } else if (msg instanceof SetPen) {
    let color = msg[0];
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        model.error,
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        color,
        model.sleds,
      ),
      $effect.from((_) => { return $studio.set_pen(color); }),
    ];
  } else if (msg instanceof SetSleds) {
    let text = msg[0];
    let $ = parse_number(text);
    if ($ instanceof Ok) {
      let value = $[0];
      let sleds = $int.clamp($float.round(value), 1, $studio.max_sleds);
      let model$1 = new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        model.error,
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        sleds,
      );
      let $1 = model$1.studio;
      let $2 = $studio.lines();
      if ($2 instanceof $Empty) {
        return [model$1, $effect.none()];
      } else if ($1 instanceof Riding) {
        let lines = $2;
        return ride_studio(model$1, lines);
      } else {
        return [model$1, $effect.none()];
      }
    } else {
      return [model, $effect.none()];
    }
  } else if (msg instanceof StudioDone) {
    let $ = $studio.lines();
    if ($ instanceof $Empty) {
      return [
        new Model(
          model.source,
          model.code_open,
          model.output,
          model.shape_slider,
          model.speed,
          model.controls_open,
          new Some("Draw at least one line on the canvas before pressing Done."),
          model.drawings,
          model.current,
          model.muted,
          model.studio,
          model.pen,
          model.sleds,
        ),
        $effect.none(),
      ];
    } else {
      let lines = $;
      return ride_studio(model, lines);
    }
  } else if (msg instanceof StudioEdit) {
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        Option$None$const,
        model.drawings,
        model.current,
        model.muted,
        StudioPhase$Drawing$const,
        model.pen,
        model.sleds,
      ),
      $effect.from((_) => { return $studio.set_phase("draw"); }),
    ];
  } else if (msg instanceof StudioUndo) {
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        Option$None$const,
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
      $effect.from((_) => { return $studio.undo(); }),
    ];
  } else if (msg instanceof StudioClear) {
    return [
      new Model(
        model.source,
        model.code_open,
        model.output,
        model.shape_slider,
        model.speed,
        model.controls_open,
        Option$None$const,
        model.drawings,
        model.current,
        model.muted,
        model.studio,
        model.pen,
        model.sleds,
      ),
      $effect.from((_) => { return $studio.clear(); }),
    ];
  } else {
    let $ = set_speed(model, 1.0);
    let model$1 = $[0];
    let speed = $[1];
    return [
      model$1,
      $effect.batch(
        listPrepend(
          $effect.from((_) => { return $render.reset_clock(); }),
          listPrepend(speed, $List$Empty$const),
        ),
      ),
    ];
  }
}

function ctrl_button(title, glyph, msg) {
  return $html.button(
    listPrepend(
      $attr.class$("icon-btn ctrl-btn"),
      listPrepend(
        $attr.attribute("title", title),
        listPrepend($event.on_click(msg), $List$Empty$const),
      ),
    ),
    listPrepend($html.text(glyph), $List$Empty$const),
  );
}

function view_classic_controls(model) {
  let $ = model.controls_open;
  if ($) {
    return $html.div(
      listPrepend($attr.class$("controls"), $List$Empty$const),
      listPrepend(
        $html.div(
          listPrepend($attr.class$("controls-head"), $List$Empty$const),
          listPrepend(
            $html.button(
              listPrepend(
                $attr.class$("icon-btn"),
                listPrepend(
                  $attr.attribute("data-test-id", "controls-toggle"),
                  listPrepend(
                    $attr.attribute("title", "Hide controls"),
                    listPrepend(
                      $event.on_click(Msg$ToggleControls$const),
                      $List$Empty$const,
                    ),
                  ),
                ),
              ),
              listPrepend($html.text("▾"), $List$Empty$const),
            ),
            $List$Empty$const,
          ),
        ),
        listPrepend(
          $html.div(
            listPrepend($attr.class$("controls-row"), $List$Empty$const),
            listPrepend(
              ctrl_button("Reset (speed 0, time 0)", "🔄", Msg$Reset$const),
              listPrepend(
                ctrl_button("Play (speed 1)", "▶️", Msg$Play$const),
                listPrepend(
                  ctrl_button("Pause (speed 0)", "⏸️", Msg$Pause$const),
                  listPrepend(
                    (() => {
                      let $1 = model.muted;
                      if ($1) {
                        return ctrl_button(
                          "Sound on",
                          "🔇",
                          Msg$ToggleMute$const,
                        );
                      } else {
                        return ctrl_button(
                          "Sound off",
                          "🔊",
                          Msg$ToggleMute$const,
                        );
                      }
                    })(),
                    listPrepend(
                      $html.input(
                        listPrepend(
                          $attr.class$("range"),
                          listPrepend(
                            $attr.attribute("data-test-id", "speed-slider"),
                            listPrepend(
                              $attr.type_("range"),
                              listPrepend(
                                $attr.min("-6.0"),
                                listPrepend(
                                  $attr.max("6.0"),
                                  listPrepend(
                                    $attr.step("0.1"),
                                    listPrepend(
                                      $attr.value($float.to_string(model.speed)),
                                      listPrepend(
                                        $attr.attribute("title", "Speed"),
                                        listPrepend(
                                          $event.on_input(
                                            (var0) => {
                                              return new SetSpeed(var0);
                                            },
                                          ),
                                          $List$Empty$const,
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
                      $List$Empty$const,
                    ),
                  ),
                ),
              ),
            ),
          ),
          listPrepend(
            $html.div(
              listPrepend($attr.class$("slider-row"), $List$Empty$const),
              listPrepend(
                $html.div(
                  listPrepend($attr.class$("label"), $List$Empty$const),
                  listPrepend(
                    $html.text("Shape: " + $int.to_string(model.shape_slider)),
                    $List$Empty$const,
                  ),
                ),
                listPrepend(
                  $html.input(
                    listPrepend(
                      $attr.class$("range"),
                      listPrepend(
                        $attr.attribute("data-test-id", "shape-slider"),
                        listPrepend(
                          $attr.type_("range"),
                          listPrepend(
                            $attr.min("0"),
                            listPrepend(
                              $attr.max("100"),
                              listPrepend(
                                $attr.step("1"),
                                listPrepend(
                                  $attr.value(
                                    $int.to_string(model.shape_slider),
                                  ),
                                  listPrepend(
                                    $event.on_input(
                                      (var0) => { return new SetShape(var0); },
                                    ),
                                    $List$Empty$const,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  $List$Empty$const,
                ),
              ),
            ),
            $List$Empty$const,
          ),
        ),
      ),
    );
  } else {
    return $html.button(
      listPrepend(
        $attr.class$("icon-btn controls-show"),
        listPrepend(
          $attr.attribute("data-test-id", "controls-toggle"),
          listPrepend(
            $attr.attribute("title", "Show controls"),
            listPrepend(
              $event.on_click(Msg$ToggleControls$const),
              $List$Empty$const,
            ),
          ),
        ),
      ),
      listPrepend($html.text("▴"), $List$Empty$const),
    );
  }
}

function text_button(label, class$, msg) {
  return $html.button(
    listPrepend(
      $attr.class$("text-btn " + class$),
      listPrepend($event.on_click(msg), $List$Empty$const),
    ),
    listPrepend($html.text(label), $List$Empty$const),
  );
}

function sleds_slider(model) {
  return $html.div(
    listPrepend($attr.class$("slider-row"), $List$Empty$const),
    listPrepend(
      $html.div(
        listPrepend($attr.class$("label"), $List$Empty$const),
        listPrepend(
          $html.text("Sleds: " + $int.to_string(model.sleds)),
          $List$Empty$const,
        ),
      ),
      listPrepend(
        $html.input(
          listPrepend(
            $attr.class$("range"),
            listPrepend(
              $attr.attribute("data-test-id", "sled-slider"),
              listPrepend(
                $attr.type_("range"),
                listPrepend(
                  $attr.min("1"),
                  listPrepend(
                    $attr.max($int.to_string($studio.max_sleds)),
                    listPrepend(
                      $attr.step("1"),
                      listPrepend(
                        $attr.value($int.to_string(model.sleds)),
                        listPrepend(
                          $event.on_input(
                            (var0) => { return new SetSleds(var0); },
                          ),
                          $List$Empty$const,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        $List$Empty$const,
      ),
    ),
  );
}

function studio_head(title) {
  return $html.div(
    listPrepend($attr.class$("controls-head studio-head"), $List$Empty$const),
    listPrepend(
      $html.span(
        listPrepend($attr.class$("studio-title"), $List$Empty$const),
        listPrepend($html.text(title), $List$Empty$const),
      ),
      listPrepend(
        $html.button(
          listPrepend(
            $attr.class$("icon-btn"),
            listPrepend(
              $attr.attribute("data-test-id", "controls-toggle"),
              listPrepend(
                $attr.attribute("title", "Hide controls"),
                listPrepend(
                  $event.on_click(Msg$ToggleControls$const),
                  $List$Empty$const,
                ),
              ),
            ),
          ),
          listPrepend($html.text("▾"), $List$Empty$const),
        ),
        $List$Empty$const,
      ),
    ),
  );
}

function view_studio_ride(model) {
  return $html.div(
    listPrepend($attr.class$("controls studio"), $List$Empty$const),
    listPrepend(
      studio_head("🛷 Sled Studio · ride"),
      listPrepend(
        $html.div(
          listPrepend($attr.class$("controls-row"), $List$Empty$const),
          listPrepend(
            ctrl_button("Ride again", "🔄", Msg$RideAgain$const),
            listPrepend(
              ctrl_button("Play (speed 1)", "▶️", Msg$Play$const),
              listPrepend(
                ctrl_button("Pause (speed 0)", "⏸️", Msg$Pause$const),
                listPrepend(
                  (() => {
                    let $ = model.muted;
                    if ($) {
                      return ctrl_button("Sound on", "🔇", Msg$ToggleMute$const);
                    } else {
                      return ctrl_button("Sound off", "🔊", Msg$ToggleMute$const);
                    }
                  })(),
                  listPrepend(
                    $html.input(
                      listPrepend(
                        $attr.class$("range"),
                        listPrepend(
                          $attr.attribute("data-test-id", "speed-slider"),
                          listPrepend(
                            $attr.type_("range"),
                            listPrepend(
                              $attr.min("-6.0"),
                              listPrepend(
                                $attr.max("6.0"),
                                listPrepend(
                                  $attr.step("0.1"),
                                  listPrepend(
                                    $attr.value($float.to_string(model.speed)),
                                    listPrepend(
                                      $attr.attribute("title", "Speed"),
                                      listPrepend(
                                        $event.on_input(
                                          (var0) => {
                                            return new SetSpeed(var0);
                                          },
                                        ),
                                        $List$Empty$const,
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
                    $List$Empty$const,
                  ),
                ),
              ),
            ),
          ),
        ),
        listPrepend(
          sleds_slider(model),
          listPrepend(
            $html.div(
              listPrepend($attr.class$("studio-actions"), $List$Empty$const),
              listPrepend(
                text_button("✏️ Edit drawing", "primary", Msg$StudioEdit$const),
                $List$Empty$const,
              ),
            ),
            $List$Empty$const,
          ),
        ),
      ),
    ),
  );
}

function view_studio_draw(model) {
  return $html.div(
    listPrepend($attr.class$("controls studio"), $List$Empty$const),
    listPrepend(
      studio_head("🛷 Sled Studio · draw"),
      listPrepend(
        $html.div(
          listPrepend($attr.class$("label"), $List$Empty$const),
          listPrepend($html.text("Instrument for new lines"), $List$Empty$const),
        ),
        listPrepend(
          $html.div(
            listPrepend($attr.class$("swatches"), $List$Empty$const),
            $list.map(
              $studio.instruments(),
              (instrument) => {
                let _block;
                let $ = instrument.color === model.pen;
                if ($) {
                  _block = " selected";
                } else {
                  _block = "";
                }
                let selected = _block;
                return $html.button(
                  listPrepend(
                    $attr.class$("swatch" + selected),
                    listPrepend(
                      $attr.attribute("title", instrument.name),
                      listPrepend(
                        $event.on_click(new SetPen(instrument.color)),
                        $List$Empty$const,
                      ),
                    ),
                  ),
                  listPrepend(
                    $html.span(
                      listPrepend(
                        $attr.class$("swatch-dot"),
                        listPrepend(
                          $attr.style("background", instrument.color),
                          $List$Empty$const,
                        ),
                      ),
                      $List$Empty$const,
                    ),
                    listPrepend($html.text(instrument.name), $List$Empty$const),
                  ),
                );
              },
            ),
          ),
          listPrepend(
            sleds_slider(model),
            listPrepend(
              $html.div(
                listPrepend($attr.class$("studio-actions"), $List$Empty$const),
                listPrepend(
                  text_button("↶ Undo", "", Msg$StudioUndo$const),
                  listPrepend(
                    text_button("🗑 Clear", "", Msg$StudioClear$const),
                    listPrepend(
                      text_button("✓ Done", "primary", Msg$StudioDone$const),
                      $List$Empty$const,
                    ),
                  ),
                ),
              ),
              $List$Empty$const,
            ),
          ),
        ),
      ),
    ),
  );
}

function view_controls(model) {
  let $ = model.controls_open;
  let $1 = model.studio;
  if ($) {
    if ($1 instanceof Drawing) {
      return view_studio_draw(model);
    } else if ($1 instanceof Riding) {
      return view_studio_ride(model);
    } else {
      return view_classic_controls(model);
    }
  } else {
    return view_classic_controls(model);
  }
}

function view_error(model) {
  let $ = model.error;
  if ($ instanceof Some) {
    let msg = $[0];
    return $html.div(
      listPrepend($attr.class$("error-toast"), $List$Empty$const),
      listPrepend(
        $html.div(
          listPrepend($attr.class$("error"), $List$Empty$const),
          listPrepend($html.text(msg), $List$Empty$const),
        ),
        $List$Empty$const,
      ),
    );
  } else {
    return $element.none();
  }
}

function view_reveal_code(model) {
  let $ = model.code_open;
  if ($) {
    return $element.none();
  } else {
    return $html.button(
      listPrepend(
        $attr.class$("icon-btn reveal-code"),
        listPrepend(
          $attr.attribute("title", "Show code"),
          listPrepend($event.on_click(Msg$ToggleCode$const), $List$Empty$const),
        ),
      ),
      listPrepend($html.text("⟩"), $List$Empty$const),
    );
  }
}

function view_anim(model) {
  return $html.div(
    listPrepend($attr.class$("canvas-area"), $List$Empty$const),
    listPrepend(
      $html.canvas(
        listPrepend(
          $attr.class$("canvas"),
          listPrepend($attr.id("animation-canvas"), $List$Empty$const),
        ),
      ),
      listPrepend(
        view_reveal_code(model),
        listPrepend(
          view_error(model),
          listPrepend(view_controls(model), $List$Empty$const),
        ),
      ),
    ),
  );
}

function view_drawing_select(model) {
  let options = $list.map(
    model.drawings,
    (d) => {
      return $html.option(
        listPrepend(
          $attr.value(d[0]),
          listPrepend($attr.selected(d[0] === model.current), $List$Empty$const),
        ),
        d[0],
      );
    },
  );
  return $html.select(
    listPrepend(
      $attr.class$("select"),
      listPrepend(
        $attr.attribute("data-test-id", "drawing-select"),
        listPrepend(
          $attr.value(model.current),
          listPrepend(
            $event.on_change((var0) => { return new SelectDrawing(var0); }),
            $List$Empty$const,
          ),
        ),
      ),
    ),
    $list.append(
      options,
      listPrepend(
        $html.option(
          listPrepend($attr.value(""), $List$Empty$const),
          "+ New drawing...",
        ),
        $List$Empty$const,
      ),
    ),
  );
}

export function view(model) {
  let _block;
  let $ = model.code_open;
  if ($) {
    _block = "app";
  } else {
    _block = "app code-hidden";
  }
  let app_class = _block;
  return $html.div(
    listPrepend($attr.class$(app_class), $List$Empty$const),
    listPrepend(
      $html.div(
        listPrepend($attr.class$("code-col"), $List$Empty$const),
        listPrepend(
          $editor.view_panel(Msg$ToggleCode$const, view_drawing_select(model)),
          $List$Empty$const,
        ),
      ),
      listPrepend(view_anim(model), $List$Empty$const),
    ),
  );
}

export function main() {
  let app = $lustre.application(init, update, view);
  let $ = $lustre.start(app, "#app", undefined);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "app",
      772,
      "main",
      "Pattern match failed, no pattern matched the value.",
      {
        value: $,
        start: 22892,
        end: 22941,
        pattern_start: 22903,
        pattern_end: 22908
      }
    )
  }
  return undefined;
}
