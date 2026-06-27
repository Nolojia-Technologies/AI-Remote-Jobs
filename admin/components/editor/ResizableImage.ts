import Image from "@tiptap/extension-image";

/**
 * Image with `width` (e.g. "50%") and `align` attributes so the bubble toolbar
 * can resize (preset widths) and align images — and the values survive in the
 * stored HTML (the mobile reader's CSS honours `width` + `data-align`).
 */
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.width || el.getAttribute("width") || null,
        renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}` } : {}),
      },
      align: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-align"),
        renderHTML: (attrs) => (attrs.align ? { "data-align": attrs.align } : {}),
      },
    };
  },
});
