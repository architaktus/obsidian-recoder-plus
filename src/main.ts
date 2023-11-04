import { App, Editor, Plugin, } from 'obsidian';
///////////////////////////////////////////////////////////////////////////////////////////////
import * as consts from './consts';
import { RecorderView } from './Components/Recorder';
import {pluginSettings, TimestampPluginSettingTab} from 'src/Components/Settings';
import { addCommands } from './Components/Commands';

// DEFAULT ////////////////////////////////////////////////////////////////////////////////////
export const DEFAULT_SETTINGS: pluginSettings = {
	chosenFolderPathForRecordingFile: "_attachments/recordings",
	recordingFileNamePrefix:"Recording",
	recordingFileNameDateFormat:"YYYYMMDDHHmmss", //https://momentjs.com/
}

export default class TimestampPlugin extends Plugin {
	app: App;	
	settings: pluginSettings;
	editor: Editor;
	recorderState: string | undefined = undefined;

	// load Plugin settings
	async loadSettings() {		
		this.settings = Object.assign({}, structuredClone(DEFAULT_SETTINGS));
		Object.assign(this.settings, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload(): Promise<void>  {	
		console.log("loading Recorder Plus");

		// Register settings
		await this.loadSettings();

		// Register view
		this.registerView(
			consts.RECORDER_VIEW,
			(leaf) => new RecorderView(this, leaf)
		);	
		
		// settings tab
		this.addSettingTab(new TimestampPluginSettingTab(this.app, this));

		// Commands
		addCommands.call(this);
	}

	async onunload() {
		this.editor = null;
		this.app.workspace.detachLeavesOfType(consts.RECORDER_VIEW);
		this.recorderState = undefined;
	}	
}