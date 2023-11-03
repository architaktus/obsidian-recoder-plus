import TimestampPlugin from "src/main";
import * as consts from "src/consts";
import { Editor, EditorPosition, MarkdownView, Notice } from "obsidian";
import { RecorderView } from "./Recorder";



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
        clearInterval(view.timerId);  // 清除之前的计时器
    }
    const updateTimer = ()=>{
        //let secondsElapsed = 0;
        if (view.plugin.recorderState === consts.recorderState.recording){
            const secondsElapsed = (view.recordedTimeTemp + (Date.now()-view.recordStartTime))/1000;
            el.textContent = `${convertSecondsToTimestamp(secondsElapsed, true)}`;
        }//secondsElapsed++;
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
 * streamOptions - audioBitsPerSecond
 * seems that ob only support max. 260kbps
 */
export const audioBitsPerSecond= new Map<string,number>([
    ['kbps 64', 64000],
    ['kbps 128', 128000],
    ['kbps 192', 192000],
    ['kbps 320', 320000],
    ['kbps 512', 512000],
    ['kbps 1411', 1411000]
]);

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


