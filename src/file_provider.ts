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
	// vault_path: String;
	constructor(app: App, doc: Y.Doc, vault_path: String) {
		super();
		this.app = app;
		this.doc = doc;
	}

	destroy(): void {
		this.doc.off("update", () => { });
	}

	async loadProvider() {
		// When documents are modified locally
		this.app.vault.on("create", async (file: TFile) => this.populateCreateToYdoc(file), this);
		this.app.vault.on("modify", async (file: TFile) => this.populateModifToYdoc(file), this);
		this.app.vault.on("delete", async (file: TFile) => this.populateDeleteToYdoc(file), this);
		this.app.vault.on("rename", async (file: TFile, oldPath) => this.populateRenameToYdoc(file, oldPath), this);

		//When documents are modifier remotely
		// this.doc.on('update', (update, origin) => {
		// 	if (origin === this)
		// 		return;
		// 	Y.logUpdate(update)
		// 	// this.emit('update', [update])
		// })
		await this.initDoc();
		console.log(this.doc)
		this.doc.getText("trojan.md").insert(0, "coucouuuu");
	}

	async initDoc() {
		let current_text: Y.Text;
		const files = this.doc.share.entries();

		// copy all file from distant to local
		let localMarkdown: TFile[] = this.app.vault.getMarkdownFiles();
		console.log(localMarkdown);
		for (let item of files) {
			const index = localMarkdown.findIndex(file => file.path == item[0]);
			// if distant file doesnt exist in local
			if (index < 0) {
				console.log(item[0]);
				let temp_dir = "";
				const temp_filesystem = item[0].split("/");
				for (let level = 0; level < temp_filesystem.length - 1; level++) {
					console.log("create dir " + temp_dir + temp_filesystem[level]);
					await this.app.vault.createFolder(temp_dir + temp_filesystem[level]);
					temp_dir += temp_filesystem[level] + "/";
				}
				console.log("create " + item[0]);
				await this.app.vault.create(item[0], item[1].toString());
			}

			// if distant file already exist we merge them
			else {
				const deltas: YDelta[] = getDeltaOperations(
					item[1].toString(),
					await this.app.vault.read(localMarkdown[index])
				);
				if (deltas.length > 0)
					(item[1] as Y.Text).applyDelta(deltas);
				// we retrieve the file from localMarkdown to only process after files that only exist in local
				localMarkdown.splice(index, 1);
			}
		}

		//adding files existing only in local
		asyncForEach(localMarkdown, async (file: TFile) => {
			current_text = this.doc.getText(file.path);
			current_text.insert(0, await this.app.vault.read(file));
		})

		//create observable for each yFiles
		for (let item of this.doc.share.entries()) {
			item[1].observe( (event, trans) => {
				console.log(item[0] + ": " + event);
			})
		}
	}

	// ToYDoc
	async populateCreateToYdoc(file: TFile) {
		if (!this || !this.doc)
			return;
		let current_text = this.doc.getText(file.path);
		current_text.insert(0, await this.app.vault.read(file));
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
	}
	async populateRenameToYdoc(file: TFile, oldPath: string) {
		if (!this || !this.doc)
			return;
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
