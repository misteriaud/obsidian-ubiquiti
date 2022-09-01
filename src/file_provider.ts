import * as Y from 'yjs';
import { FileSystemAdapter } from 'obsidian';
import { Observable } from 'lib0/observable.js';

async function recursiveLs(path: string, fs: FileSystemAdapter, level: number)
{
	if (path.contains("obsidian-ubiquiti"))
		return ;
	const list = await fs.list(path);
	list.files.forEach(async file => {
		console.log(await fs.stat(file));
	})
	level++;
	list.folders.forEach(async folder => {
		if (folder)
			recursiveLs(folder, fs, level);
	})
}

export class FilePersistence extends Observable {
	name: String;
	doc: Y.Doc;
	vault_path: String;
	fs: FileSystemAdapter = new FileSystemAdapter();
	constructor(name: String, doc: Y.Doc, vault_path: String) {
		super()
	}
}
