import TimestampPlugin from "src/main";
import * as consts from "src/consts";
import { Editor, EditorPosition, MarkdownView, Notice } from "obsidian";



/**
 * check if video view is open
 * @param plugin 
 * @returns 
 */
export function isViewOpen (plugin: TimestampPlugin, leafType: string){
	const isVideoViewOpen = plugin.app.workspace.getLeavesOfType(leafType).length > 0 ?? undefined;
	return isVideoViewOpen;
}


export async function activateRecorderView(plugin: TimestampPlugin) {
	if (isViewOpen(plugin, consts.RECORDER_VIEW)){
		plugin.app.workspace.revealLeaf(
			plugin.app.workspace.getLeavesOfType(consts.RECORDER_VIEW)[0]
		);
	}else {
		await plugin.app.workspace.getRightLeaf(true).setViewState({
			type: consts.RECORDER_VIEW,
			active: true,
		})
	}
}





///////////////////////////////////////////////////////////////////////////////////////////////
//Editor widget ///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Text -> clipboard
 * @param itemText 
 */
export async function CopyToClipboard(itemText:string){
	try {
	  await new Promise<void>(async (resolve) => {
		await navigator.clipboard.writeText(itemText);
		resolve();
	  });
	  new Notice("Copied to clipboard!", consts.SUCCESS_NOTICE_TIMEOUT);
	  } catch {
	  new Notice("[Error!] could not convert or copy!");
	  }
}

export function insertAtCursor(editor:Editor, text:string, cursorPos: EditorPosition, setline?: number){
	editor.replaceRange(text, cursorPos);
	if (setline){
		editor.setCursor(cursorPos.line + setline);
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Time Widgets ///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
/**
 * create a Timestamp from active player
 * seconds -> timestamp
 * @param totalSeconds 
 * @returns 
 */
export function convertSecondsToTimestamp (totalSeconds: number, withoutMilliSec?:boolean){		
	let hh = Math.floor(totalSeconds / 3600);
	let mm = Math.floor((totalSeconds - (hh * 3600)) / 60);
	let ssms = totalSeconds - (hh * 3600) - (mm * 60);

	// fix "01:11:60" issue
	if (ssms === 60){
		ssms = 0;
		mm = mm + 1;
	}
	if (mm === 60){
		mm = 0;
		hh = hh + 1;
	}
	let ss:number;
	ss = withoutMilliSec? Math.floor(ssms):ssms;
	const timestamp = createTimestamp(hh,mm,ss);
	return timestamp;
}

export function createTimestamp (hh:number,mm:number,ss:number){
	let timestamp: string;
	try{
		timestamp = `${hh !== 0 ? (hh.toString().padStart(2, '0') + ":") : ''}${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
	} catch {
		new Notice("[Error!] Timestamp format should be: [HH:mm:ss] or [HH:mm:ss.ms]");
	}
	return timestamp
	/*let timestamp='';
	if (hh && hh !== 0){timestamp = hh.toString().padStart(2, '0') + ":"}
	timestamp = mm.toString().padStart(2, '0') + ":" + ss.toString().padStart(2, '0');
	return timestamp;*/
}