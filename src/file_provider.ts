import * as Y from 'yjs';
import { App, TFile } from 'obsidian';
// import { YMap, YText } from 'yjs/dist/src/internals';
import { Observable } from 'lib0/observable.js';
import { YDelta, getDeltaOperations } from "./getDeltas"

async function asyncForEach(array: Array<any>, callback: Function) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

export class ObsidianProvider extends Observable<string> {
	app: App;
	doc: Y.Doc;
	filesystem: Y.Map<Y.Text>;
	// vault_path: String;
	constructor(app: App, doc: Y.Doc, vault_path: String) {
		super();
		this.app = app;
		this.doc = doc;
		this.filesystem = doc.getMap("filesystem");

		let temp_text = new Y.Text();

		this.filesystem.set("file1.md", temp_text);
		this.filesystem.set("file2.md", temp_text);
		this.filesystem.set("test/file3.md", temp_text);
		this.filesystem.set("test/file4.md", temp_text);
		this.filesystem.set("test/subtest/file5.md", temp_text);
	}

	destroy(): void {
		this.doc.off("update", () => { });
	}

	async loadProvider() {
		// console.log(this.doc);

		// When documents are modified locally
		this.app.vault.on("create", async (file: TFile) => this.populateCreateToYdoc(file), this);
		this.app.vault.on("modify", async (file: TFile) => this.populateModifToYdoc(file), this);
		this.app.vault.on("delete", async (file: TFile) => this.populateDeleteToYdoc(file), this);
		this.app.vault.on("rename", async (file: TFile, oldPath) => this.populateRenameToYdoc(file, oldPath), this);

		//When documents are modifier remotely
		this.doc.on('update', (update, origin) => {
			if (origin === this)
				return;
			this.emit('update', [update])
		})
		await this.initDoc();
	}

	async initDoc() {
		const localDoc: Y.Doc = new Y.Doc();
		let current_text: Y.Text;
		// copy all file from distant to local
		const localMarkdown: TFile[] = this.app.vault.getMarkdownFiles();
		this.filesystem.forEach(async (text, path) => {
			if (!localMarkdown.some(file => file.path === path)) {
				console.log(path);
				let temp_dir = "";
				const temp_filesystem = path.split("/");
				for (let level = 0; level < temp_filesystem.length - 1; level++) {
					console.log("create dir " + temp_dir + temp_filesystem[level]);
					await this.app.vault.createFolder(temp_dir + temp_filesystem[level]);
					temp_dir += temp_filesystem[level] + "/";
				}
				console.log("create " + path);
				await this.app.vault.create(path, text.toString());
				current_text = localDoc.getText(path);
				current_text.insert(0, text.toString());
			}
		});

		// create a local doc
		await asyncForEach(this.app.vault.getMarkdownFiles(), async (file: TFile) => {
			current_text = localDoc.getText(file.path);
			current_text.insert(0, await this.app.vault.read(file));
		});

		// merge both
		Y.applyUpdate(this.doc, Y.encodeStateAsUpdate(localDoc));

		//clean localDoc
		localDoc.destroy();
	}

	// ToYDoc
	async populateCreateToYdoc(file: TFile) {
		if (!this || !this.doc)
			return;
		let current_text = this.doc.getText(file.path);
		current_text.insert(0, await this.app.vault.read(file));
		this.filesystem.set(file.path, current_text);
	}
	async populateModifToYdoc(file: TFile) {
		if (!this || !this.doc)
			return;
		let current_text: Y.Text = this.doc.getText(file.path);
		let delta: YDelta[] = [];
		delta = getDeltaOperations(current_text.toString(), await this.app.vault.read(file));
		if (delta.length > 0)
			current_text.applyDelta(delta);
	}
	async populateDeleteToYdoc(file: TFile) {
		if (!this || !this.doc)
			return;
		this.doc.getText(file.path).delete(0, this.doc.getText.length);
		this.filesystem.delete(file.path);
	}
	async populateRenameToYdoc(file: TFile, oldPath: string) {
		if (!this || !this.doc)
			return;
		this.filesystem.set(file.path, this.filesystem.get(oldPath) as Y.Text);
		this.filesystem.delete(oldPath);
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

	get(key: String | number | ArrayBuffer | Date) {
		console.log("provider get: " + key);
	}

	set(key: String | number | ArrayBuffer | Date, value: String | number | ArrayBuffer | Date) {
		console.log("provider set: " + key + "\nvalue: " + value);
	}

	del(key: String | number | ArrayBuffer | Date) {
		console.log("provider del: " + key);
	}
}
