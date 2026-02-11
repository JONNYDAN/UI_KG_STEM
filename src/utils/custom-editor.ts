// src/utils/custom-editor.ts

import "ckeditor5/ckeditor5.css";

import {
  Alignment,
  Bold,
  ButtonView,
  ClassicEditor,
  Essentials,
  Font,
  Heading,
  Highlight,
  Italic,
  List,
  Paragraph,
  Plugin,
} from "ckeditor5";

// ✅ Plugin Timestamp (custom button)
class Timestamp extends Plugin {
  public static get pluginName() {
    return "Timestamp" as const;
  }

  public init(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add("timestamp", () => {
      const button = new ButtonView();

      button.set({
        label: "🕒 Thời gian",
        tooltip: true,
        withText: true,
      });

      button.on("execute", () => {
        const now = new Date().toLocaleString("vi-VN");
        editor.model.change((writer) => {
          editor.model.insertContent(writer.createText(now));
        });
      });

      return button;
    });
  }
}

class InlineTabPlugin extends Plugin {
  public init(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    this.listenTo(viewDocument, "keydown", (evt, data) => {
      if (!viewDocument.isFocused) return;
      if (data.keyCode !== 9) return; 

      data.preventDefault();

      const model = editor.model;
      model.change((writer) => {
        const range = model.document.selection.getFirstRange();
        if (range) {
          writer.insertText("   ", range.start);
        }
      });

      evt.stop();
    });
  }
}




export const Editor = {
  ClassicEditor,
  plugins: [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Font,
    Alignment,
    Highlight,
    List,
    Timestamp,
    InlineTabPlugin, 
  ],
  toolbar: {
    items: [
      "heading",
      "|",
      "bold",
      "italic",
      "fontSize",
      "fontColor",
      "fontBackgroundColor",
      "alignment",
      "|",
      "bulletedList",
      "numberedList",
      "timestamp",
      "|",
      "undo",
      "redo",
    ],
  },
};

