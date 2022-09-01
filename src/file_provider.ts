import * as Y from 'yjs';
import { App, TFile } from 'obsidian';
import { YText } from 'yjs/dist/src/internals';
import { Observable } from 'lib0/observable.js';
import { YDelta, getDeltaOperations } from "./getDeltas"

export class ObsidianProvider extends Observable<string> {
	app: App;
	doc: Y.Doc;
	// vault_path: String;
	constructor(app: App, doc: Y.Doc, vault_path: String) {
		super();
		this.app = app;
		this.doc = doc;
		this.initDoc();

		// When documents are modified locally
		this.app.vault.on("modify", async (file: TFile) => this.populateModifToYdoc(file), this);

		//When documents are modifier remotely
		doc.on('update', (update, origin) => {
			if (origin === this)
				return ;
			this.emit('update', [update])
		})
	}

	destroy(): void {
		this.doc.off("update", () => {});
	}

	async initDoc() {
		let current_text: YText;
		this.app.vault.getMarkdownFiles().forEach(async file => {
			current_text = this.doc.getText(file.path);
			current_text.insert(0, await this.app.vault.read(file));
		})
	}

	async populateModifToYdoc(file: TFile) {
		if (!this || !this.doc)
			return ;
		console.log('update');
		let current_text: YText = this.doc.getText(file.path);
		let delta: YDelta[] = [];
		delta = getDeltaOperations(current_text.toString(), await this.app.vault.read(file));
		if (delta.length > 0)
			current_text.applyDelta(delta);
	}

	async populateModifToFile(path: string, ytext: Y.YTextEvent) {
		console.log(path);
		console.log(ytext.changes.delta);
		// if (!this || !this.ydoc)
		// 	return ;
		// let current_text: YText = this.ydoc.getText(file.path);
		// let delta: YDelta[] = [];
		// delta = getDeltaOperations(current_text.toString(), await this.app.vault.read(file));
		// if (delta.length > 0)
		// 	current_text.applyDelta(delta);
	}

	get (key: String | number | ArrayBuffer | Date) {
		console.log("provider get: " + key);
	}

	set (key: String | number | ArrayBuffer | Date, value: String | number | ArrayBuffer | Date) {
		console.log("provider set: " + key + "\nvalue: " + value);
	}

	del(key: String | number | ArrayBuffer | Date) {
		console.log("provider del: " + key);
	}
}
