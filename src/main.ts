import { TFolder, Plugin, FileSystemAdapter, Vault, TFile, TAbstractFile } from 'obsidian';
import { WebsocketProvider } from "y-websocket"
import * as Y from 'yjs'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
// import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { YMap, YText } from 'yjs/dist/src/internals';
import { YDelta, getDeltaOperations } from "./getDeltas"

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

// async function recursiveLs(path: string, fs: FileSystemAdapter, level: number)
// {
// 	if (path.contains("obsidian-ubiquiti"))
// 		return ;
// 	const list = await fs.list(path);
// 	list.files.forEach(async file => {
// 		console.log(await fs.stat(file));
// 	})
// 	level++;
// 	list.folders.forEach(async folder => {
// 		if (folder)
// 			recursiveLs(folder, fs, level);
// 	})
// }

// async function recusriveFill(folder: TFolder, doc: YMap<ArrayBuffer>, fs: FileSystemAdapter) {
// 	folder.children.forEach(async child => {
// 		// console.log(child);
// 		if ("children" in child)
// 			await recusriveFill(child as TFolder, doc, fs);
// 		else
// 			console.log("content of " + child.path + ": " + await fs.readBinary(child.path))
// 			// doc.set(child.path, await fs.readBinary(child.path));
// 			// doc.set(child.path, 0 as ArrayBuffer);
// 	})
// }


export default class MyPlugin extends Plugin {
	basePath: string = "Dev/obsidian_dev";
	ydoc: Y.Doc = new Y.Doc;
	ymap: YMap<string> = this.ydoc.getMap("markdown");
	settings: MyPluginSettings;
	distant_provider: WebsocketProvider;
	fs: FileSystemAdapter = new FileSystemAdapter(".");

	async onload() {
		// const basePath = (this.app.vault.adapter as any).basePath;
		// this.distant_provider = new WebsocketProvider('ws://localhost:8080', "vault_name", this.ydoc);
		await this.initDoc();
		console.log(this.ymap);
		this.app.vault.on("modify", async (file: TFile) => this.setYFile(file), this);
		this.ydoc.on('update', (update, origin) => {
			console.log(origin + ": " + update);
		})
		await this.loadSettings();
	}

	onunload() {
	}

	async initDoc() {
		this.app.vault.getMarkdownFiles().forEach(async file => this.setYFile(file))
	}

	async setYFile(file: TFile) {
		console.log(this.ydoc.getText("markdown"));
		if (this.ymap && this.app)
			this.ymap.set(file.path, await this.app.vault.read(file));
	}

	// async populateModifToYdoc(file: TFile) {
	// 	if (!this)
	// 		return ;
	// 	let delta: YDelta[] = [];
	// 	if (this.ymap && this.ymap.has(file.path))
	// 		delta = getDeltaOperations(this.ymap.get(file.path) as string, await this.app.vault.read(file));
	// 	if (delta.length > 0)
	// 		this.ymap.set(file.path, )
	// 	console.log(delta);
	// }

	// async recusriveFill(folder: TFolder) {
	// 	folder.children.forEach(async child => {
	// 		// console.log(child);
	// 		if ("children" in child)
	// 			await this.recusriveFill(child as TFolder);
	// 		else
	// 			// console.log("content of " + child.path + ": " + await this.fs.readBinary("./" + child.path))
	// 			console.log(await this.fs.list(this.basePath));
	// 			// console.log(await this.fs.readBinary(this.basePath + child.path))
	// 			// doc.set(child.path, await fs.readBinary(child.path));
	// 			// doc.set(child.path, 0 as ArrayBuffer);
	// 	})
	// }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
