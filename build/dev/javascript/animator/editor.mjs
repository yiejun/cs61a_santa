//# sourceMappingURL=editor.mjs.map
import * as $list from "../gleam_stdlib/gleam/list.mjs";
import * as $attr from "../lustre/lustre/attribute.mjs";
import * as $effect from "../lustre/lustre/effect.mjs";
import * as $element from "../lustre/lustre/element.mjs";
import * as $html from "../lustre/lustre/element/html.mjs";
import * as $event from "../lustre/lustre/event.mjs";
import { mountEditor as do_mount } from "./editor_ffi.mjs";
import {
  List$Empty$const as $List$Empty$const,
  prepend as listPrepend,
  CustomType as $CustomType,
} from "./gleam.mjs";

class RefEntry extends $CustomType {
  constructor(signature, description) {
    super();
    this.signature = signature;
    this.description = description;
  }
}

/**
 * Mount a CodeMirror editor showing text, routing every edit through on_change.
 * Mounting tears down any previous editor itself, so re-mounting just calls this
 * again — there is no separate unmount.
 * Mounting an editor doesn't change the animation. To animate the text in a
 * new editor, the caller has to update the animation too.
 */
export function mount(text, on_change) {
  return $effect.from(
    (dispatch) => {
      return do_mount(text, (t) => { return dispatch(on_change(t)); });
    },
  );
}

function list_functions() {
  return listPrepend(
    new RefEntry(
      "list.map(list, fn(a) -> b) -> List(b)",
      "each element through `fn`",
    ),
    listPrepend(
      new RefEntry(
        "list.filter(list, fn(a) -> Bool) -> List(a)",
        "only the elements `fn` says True to",
      ),
      listPrepend(
        new RefEntry(
          "list.append(list, list) -> List(a)",
          "one list after the other",
        ),
        listPrepend(
          new RefEntry("list.length(list) -> Int", "the number of elements"),
          listPrepend(
            new RefEntry(
              "list.flatten(List(List(a))) -> List(a)",
              "the inner lists, end to end",
            ),
            $List$Empty$const,
          ),
        ),
      ),
    ),
  );
}

function ref_group(title, entries) {
  return $html.div(
    listPrepend($attr.class$("reference-group"), $List$Empty$const),
    listPrepend(
      $html.div(
        listPrepend($attr.class$("reference-group-title"), $List$Empty$const),
        listPrepend($html.text(title), $List$Empty$const),
      ),
      listPrepend(
        $html.div(
          listPrepend($attr.class$("reference-rows"), $List$Empty$const),
          $list.map(
            entries,
            (e) => {
              return $html.div(
                listPrepend($attr.class$("reference-row"), $List$Empty$const),
                listPrepend(
                  $html.code(
                    listPrepend(
                      $attr.class$("reference-sig"),
                      $List$Empty$const,
                    ),
                    listPrepend($html.text(e.signature), $List$Empty$const),
                  ),
                  listPrepend(
                    $html.span(
                      listPrepend(
                        $attr.class$("reference-desc"),
                        $List$Empty$const,
                      ),
                      listPrepend($html.text(e.description), $List$Empty$const),
                    ),
                    $List$Empty$const,
                  ),
                ),
              );
            },
          ),
        ),
        $List$Empty$const,
      ),
    ),
  );
}

function sled_shapes() {
  return listPrepend(
    new RefEntry(
      "ColorLine(start: Point, end: Point, color)",
      "a line in a color, whose note plays on that color's instrument",
    ),
    listPrepend(
      new RefEntry(
        "Blue  Red  Green  Purple  Gold",
        "bell, drum, marimba, bass, synth (a plain Line is cream and plays piano)",
      ),
      listPrepend(
        new RefEntry(
          "Rider(start: Point)",
          "where the sled drops in, at the Path's start time (default: above the first line)",
        ),
        listPrepend(
          new RefEntry(
            "Goal(center: Point)",
            "the finish: reach it to win; leaving the canvas is a crash",
          ),
          $List$Empty$const,
        ),
      ),
    ),
  );
}

function functions() {
  return listPrepend(
    new RefEntry(
      "random(min: Int, max: Int) -> Int",
      "a random int in [min, max)",
    ),
    listPrepend(
      new RefEntry("abs(n: Int) -> Int", "the absolute value of `n`"),
      listPrepend(
        new RefEntry(
          "Point(x: Int, y: Int)",
          "a point on the canvas: (0, 0) is the center, x and y run from -500 to 500, and y grows downward",
        ),
        listPrepend(
          new RefEntry(
            "Line(start: Point, end: Point)",
            "a straight-line shape",
          ),
          listPrepend(
            new RefEntry(
              "Path(shape, start: Int, end: Int, thickness: Int)",
              "draws a shape between times `start` and `end`, in 1/10 s (end <= start draws it instantly)",
            ),
            $List$Empty$const,
          ),
        ),
      ),
    ),
  );
}

function inputs() {
  return listPrepend(
    new RefEntry("shape_slider: Int", "the shape slider value, in [0, 100]"),
    $List$Empty$const,
  );
}

function view_reference_panel() {
  return $html.details(
    listPrepend(
      $attr.class$("reference"),
      listPrepend($attr.attribute("open", ""), $List$Empty$const),
    ),
    listPrepend(
      $html.summary(
        listPrepend($attr.class$("reference-summary"), $List$Empty$const),
        listPrepend(
          $html.text("Built-in inputs & functions"),
          $List$Empty$const,
        ),
      ),
      listPrepend(
        $html.div(
          listPrepend($attr.class$("reference-body"), $List$Empty$const),
          listPrepend(
            ref_group("Inputs", inputs()),
            listPrepend(
              ref_group("Functions", functions()),
              listPrepend(
                ref_group("Sled Symphony", sled_shapes()),
                listPrepend(
                  ref_group("Lists", list_functions()),
                  $List$Empty$const,
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

/**
 * The code panel that sits beside the drawing: the live editor and a reference
 * of the built-in inputs and functions. The latest code that runs is rendered
 * continuously, so there is no explicit apply step.
 */
export function view_panel(on_collapse, controls) {
  return $html.div(
    listPrepend($attr.class$("code-panel"), $List$Empty$const),
    listPrepend(
      $html.div(
        listPrepend($attr.class$("code-header"), $List$Empty$const),
        listPrepend(
          $html.span(
            listPrepend($attr.class$("code-title"), $List$Empty$const),
            listPrepend($html.text("draw code"), $List$Empty$const),
          ),
          listPrepend(
            $html.button(
              listPrepend(
                $attr.class$("icon-btn"),
                listPrepend(
                  $attr.attribute("title", "Hide code"),
                  listPrepend($event.on_click(on_collapse), $List$Empty$const),
                ),
              ),
              listPrepend($html.text("⟨"), $List$Empty$const),
            ),
            $List$Empty$const,
          ),
        ),
      ),
      listPrepend(
        $html.div(
          listPrepend($attr.class$("code-controls"), $List$Empty$const),
          listPrepend(controls, $List$Empty$const),
        ),
        listPrepend(
          $html.div(
            listPrepend($attr.class$("code-editor-wrap"), $List$Empty$const),
            listPrepend(
              $element.unsafe_raw_html(
                "",
                "div",
                listPrepend(
                  $attr.id("code-editor"),
                  listPrepend($attr.class$("code-editor"), $List$Empty$const),
                ),
                "",
              ),
              $List$Empty$const,
            ),
          ),
          listPrepend(view_reference_panel(), $List$Empty$const),
        ),
      ),
    ),
  );
}
