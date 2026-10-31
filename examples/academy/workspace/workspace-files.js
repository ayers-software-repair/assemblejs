// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Unsaved buffers belong to the editor; compare-and-write belongs to the shared project. */
export class WorkspaceFiles {
  #buffers = new Map();
  #saving = new Set();

  constructor(project, paths) {
    if (
      paths.some(
        (path) =>
          typeof path !== "string" ||
          path.includes("\\") ||
          path.includes("\0") ||
          /^[a-z]:/i.test(path) ||
          path.split("/").some((part) => ["", ".", ".."].includes(part)),
      )
    )
      throw new Error("workspace paths must be confined project files");
    if (new Set(paths).size !== paths.length) throw new Error("duplicate workspace path");
    this.project = project;
    this.paths = Object.freeze([...paths].sort());
  }

  async open(path) {
    if (!this.paths.includes(path)) throw new Error("file is outside this workspace");
    if (!this.#buffers.has(path)) {
      const contents = await this.project.readFile(path);
      if (typeof contents !== "string") throw new Error("source must be text");
      // Keep edits made while a second open was reading the same file.
      if (!this.#buffers.has(path)) this.#buffers.set(path, { base: contents, text: contents });
    }
    return this.buffer(path);
  }

  buffer(path) {
    const value = this.#buffers.get(path);
    if (!value) throw new Error("file has not been opened");
    return Object.freeze({ ...value, dirty: value.text !== value.base });
  }

  edit(path, text) {
    if (typeof text !== "string") throw new Error("source must be text");
    const value = this.#buffers.get(path);
    if (!value) throw new Error("file has not been opened");
    value.text = text;
  }

  async save(path) {
    if (this.#saving.has(path)) throw new Error("this file is already being saved");
    const { base, text, dirty } = this.buffer(path);
    if (!dirty) return this.buffer(path);
    this.#saving.add(path);
    try {
      // The provider must refuse a changed base; a preceding read is not a safe replacement.
      await this.project.writeFile(path, text, base);
      this.#buffers.get(path).base = text;
      return this.buffer(path);
    } finally {
      this.#saving.delete(path);
    }
  }
}
