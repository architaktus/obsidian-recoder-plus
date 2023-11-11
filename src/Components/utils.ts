import RecorderPlusPlugin from "src/main";
import * as consts from "src/consts";
import { Editor, EditorPosition, MarkdownView, Notice } from "obsidian";
import { RecorderView } from "./Recorder";
import dayjs from "dayjs";
import { join, normalize } from "path";



/**
 * check if video view is open
 * @param plugin 
 * @returns 
 */
export function isViewOpen (plugin: RecorderPlusPlugin, leafType: string){
	const isVideoViewOpen = plugin.app.workspace.getLeavesOfType(leafType).length > 0 ?? undefined;
	return isVideoViewOpen;
}


export async function activateRecorderView(plugin: RecorderPlusPlugin) {
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

/**
 * typical way of saving file:
 * 		button click -> create <a> -> user save file
 * @param blob 
 * @param filename 
 */
export function saveBlobAsFile(blob:Blob, filename:string){   
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.style.display = "none";
    a.href = url;
    a.download = filename;   
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * get file name from current time
 * @param plugin 
 * @returns file name without extensionsname
 */
export function handleRecordingFileName (plugin:RecorderPlusPlugin, view: RecorderView): string{
    const now = dayjs(view.pipeline.recordStartTime).format(plugin.settings.recordingFileNameDateFormat);
    const prefix = plugin.settings.recordingFileNamePrefix;
    const filename = `${prefix}-${now}`;
    //console.log(plugin,'filename: ' + filename);
    return filename;
}

export function getUniqueFileName(view: RecorderView, filePath: string, baseFileName: string){ 
    let basePath = join(filePath, baseFileName);
    let index = 0
	let newFileName = baseFileName;
    let newFilePath = filePath;
    //consoleLog(plugin,'oldfilename: ' + basePath);
    while (view.plugin.app.vault.getAbstractFileByPath(newFilePath)){
        index++;
        newFilePath = `${basePath}-${index.toString()}`;
    }
    if (index >0){
        newFileName = `${baseFileName}-${index.toString()}`
    }
    console.log(view.plugin,'newfilename: ' + newFileName);
    return newFileName;
}


export function getSaveFileName (view: RecorderView){
    const fileDirect = normalize(view.plugin.settings.chosenFolderPathForRecordingFile);
	let fileName = view.currentRecordingFileName;	
	fileName = getUniqueFileName(view, fileDirect, fileName);

	view.currentRecordingFileName = fileName;
    return fileName;
}

export async function getSaveSrc (view: RecorderView, fileName:string){
    const fileDirect = normalize(view.plugin.settings.chosenFolderPathForRecordingFile);

    //check folder directory
    const fileDirectTest = fileDirect.replace(/\\/g,'/')
    const folder = view.plugin.app.vault.getAbstractFileByPath(fileDirectTest)
    if (!folder){
        await view.plugin.app.vault.createFolder(fileDirect)
    }
    
    return join(fileDirect, `${fileName}.${view.audioFormat.format}`);
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



/**
 * timer of recorder ui (show record last)
 * @param view 
 * @param el 
 */
// start/restart timer
export function timer(view:RecorderView, el: HTMLElement){
    if (view.timerId) {
        clearInterval(view.timerId);  // clear 清除之前的计时器
    }
    const updateTimer = ()=>{        
        const secondsElapsed = view.pipeline.audioContext.currentTime;
        el.textContent = `${convertSecondsToTimestamp(secondsElapsed, true)}`;
    }
    view.timerId = setInterval(updateTimer, 1000);
    //console.log(`${view.timerId}`)
}

// stop/pause timer
export function pauseTimer(view: RecorderView) {
    if (view.timerId) {
        clearInterval(view.timerId);
        view.timerId = null;
    }
}

export function timerSetToZero(el: HTMLElement){
    el.textContent = '00:00';
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Recorder Widgets ///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////


/**
 * streamOptions - mimeType: `audio/${audioExt()};codecs=opus`,
 * ref:  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 * @returns 
 */
export function audioExt ():string{
    let extension: string;
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        extension = "webm";
    } else {
        extension = "ogg";
    }
    return extension;
}

/** for getUserMedia */
export function constraints(view:RecorderView){
    return {
        audio:{
            deviceId: view.selectedMicrophoneId?view.selectedMicrophoneId:'default',
            //TODO: check navigator.mediaDevices.getSupportedConstraints()& setting开启设置, 开启下述内容
            //sampleRate: 48000,
            // 16/24 位
            //sampleSize: 24,
            //声道数量
            //channelCount: 2,
            //回声消除
            //echoCancellation: false, 
            //自动增益
            //autoGainControl: false,
            //降噪
            //noiseSuppression: false,
            //延迟期望
            //latency: 0.01,
        }
    }

}

/**
 * get microphone devices
 * @returns a map of <deviceId, deviceLabel(name of mc)>
 */
export async function getDevices(): Promise<Map<string, string>> {
    let microphonesMap = new Map<string, string>();

    if (!navigator.mediaDevices?.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
        new Notice ('no Recorder Devices');        
    } else {
        // List microphones.
        const microphones = (
            await navigator.mediaDevices.enumerateDevices()
        ).filter((d) => d.kind === "audioinput" && d.deviceId !== 'communications');

        
        microphones.map((mc)=>{
            microphonesMap.set(mc.deviceId, mc.label || "Unknown microphone");            
        })
        return microphonesMap;
  }
}



//////////////////////////////////
//其他
export function createFormatToCodecMap(
    codecInfoMap: { [key: string]: { description: string, matroskaCodec: string, supportFormat: string[] } }
): { [key: string]: string[] } {
    let formatToCodecMap: { [key: string]: string[] } = {};

    for (const codec in codecInfoMap) {
        const info = codecInfoMap[codec];
        info.supportFormat.forEach(format => {
            if (!formatToCodecMap[format]) {
                formatToCodecMap[format] = [];
            }
            formatToCodecMap[format].push(codec);
        });
    }

    return formatToCodecMap;
}