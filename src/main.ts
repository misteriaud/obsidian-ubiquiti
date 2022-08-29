import { App, Editor, MarkdownEditView, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, View, FileSystemAdapter } from 'obsidian';
import { WebsocketProvider } from "y-websocket"
import * as Y from 'yjs'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
// import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { YText } from 'yjs/dist/src/internals';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

class DistantFile {
	uid: string;
	ydoc: Y.Doc;
	yText: YText;
	provider: WebsocketProvider;
	plugin: EditorState.Extension;

    constructor(doc_name: string) {
		this.ydoc =  new Y.Doc();
		this.ydoc
		this.yText = this.ydoc.getText();
		this.provider = new WebsocketProvider('ws://localhost:8080', doc_name, this.ydoc);
		this.plugin = yCollab(this.yText, this.provider.awareness);
    };
	destroy(): void {
		this.plugin.destroy();
		this.ydoc.destroy();
	}
	getPlugin(): EditorState.Extension {
		return (this.plugin);
	}
}

async function recursiveLs(path: string, fs: FileSystemAdapter, level: number)
{
	const list = await fs.list(path);
	let tab = "";
	for (let i = 0; i < level; i++) {
		tab += "\t";
	}
	list.files.forEach(file => {
		console.log(tab + file);
	})
	level++;
	list.folders.forEach(async folder => {
		if (tab + folder)
		recursiveLs(folder, fs, level);
	})
}

export default class MyPlugin extends Plugin {
	ydocs: Map<TFile, YText> = new Map();
	openedFiles: Map<TFile, DistantFile> = new Map();
	plugs: Array<EditorState.Extension> = [];
	current_file: TFile;
	settings: MyPluginSettings;
	fs: FileSystemAdapter = new FileSystemAdapter(".");

	updateSyncEngine(file: TFile | null): void {
		if (!file)
			return ;
		if (!this.openedFiles.has(file))
		{
			this.openedFiles.set(file, new DistantFile(file.path));
			console.log("Register a new file: " + file.name);
		}
		if (this.current_file != file)
		{
			this.plugs[0] = this.openedFiles.get(file)?.getPlugin();
			this.app.workspace.updateOptions();
			this.current_file = file;
			console.log("update view");
		}
	}

	async onload() {
		const basePath = (this.app.vault.adapter as any).basePath;
		console.log("loaded");
		console.log(basePath);
		recursiveLs(basePath, this.fs, 0);

		// this.registerEditorExtension(this.plugs);
		// this.registerEvent(this.app.workspace.on("editor-change",
		// 	(_, markdownView) => this.updateSyncEngine(markdownView.file)
		// ));
		// this.registerEvent(this.app.workspace.on("file-open",
		// 	file => this.updateSyncEngine(file)
		// ));

		await this.loadSettings();
	}

	onunload() {
		this.openedFiles.forEach(file => file.destroy());
		this.openedFiles.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
