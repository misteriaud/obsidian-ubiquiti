import { App, Editor, MarkdownEditView, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, View } from 'obsidian';
import { WebsocketProvider } from "y-websocket"
import * as Y from 'yjs'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'

import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";

import * as random from 'lib0/random'
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
		this.ydoc =  new Y.Doc({guid: doc_name});
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

export default class MyPlugin extends Plugin {
	openedFiles: Map<CodeMirror.Doc, DistantFile> = new Map();
	plugs: Map<TFile, EditorState.Extension> = new Map();
	settings: MyPluginSettings;

	async onload() {
		this.registerEvent(this.app.workspace.on("editor-change", (editor, markdownView) => {
			this.app.workspace.getLeavesOfType("markdown").forEach(leave => {
				const viewState = leave.getViewState();
				console.log(leave);
				// if (viewState.state == "markdown" && !this.openedFiles.has(viewState.state))
				// {
				// 	const doc = cm.getDoc();
				// 	this.openedFiles.set(doc, new DistantFile(cm.get));
				// 	this.plugs.set(markdownView.file, this.openedFiles.get(markdownView.file)?.getPlugin());
					this.registerEditorExtension([...this.plugs.values()]);
				// 	this.app.workspace.updateOptions();
				// 	console.log("Register a new file: " + markdownView.file.name);
				// }

			})
			console.log('diff');
		}));

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
