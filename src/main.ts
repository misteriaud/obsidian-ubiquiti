import { TFolder, Plugin, FileSystemAdapter, Vault, TFile, TAbstractFile } from 'obsidian';
import { WebsocketProvider } from "y-websocket"
import * as Y from 'yjs'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
// import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { ObsidianProvider } from "./file_provider"

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	basePath: string = "Dev/obsidian_dev";
	ydoc: Y.Doc = new Y.Doc;
	settings: MyPluginSettings;
	distantProvider: WebsocketProvider = new WebsocketProvider('ws://localhost:8080', "vault_name", this.ydoc);
	// distant_provider: WebsocketProvider;
	obsidianProvider: ObsidianProvider = new ObsidianProvider(this.app, this.ydoc, this.basePath);

	async onload() {
		console.log("version1");
		// this.ydoc.getText("vimium.md");
		// this.ydoc.getText("VScode.md");
		// this.ydoc.getText("trojan.md");
		// this.ydoc.getText("Maxime Riaud.md");

		await this.obsidianProvider.loadProvider();
		// const basePath = (this.app.vault.adapter as any).basePath;
		// this.distant_provider = new WebsocketProvider('ws://localhost:8080', "vault_name", this.ydoc);
		await this.loadSettings();
	}

	onunload() {
		console.log("conunload called")
		this.obsidianProvider.destroy();
		this.ydoc.destroy();
	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
