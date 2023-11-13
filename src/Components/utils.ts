import { Editor, EditorPosition, MarkdownView, Notice } from "obsidian";
import { WaveFile } from 'wavefile';
import dayjs from "dayjs";

import RecorderPlusPlugin from "src/main";
import * as consts from "src/consts";
import { RecorderView } from "./Recorder";
import { join, normalize } from "path";
import { AudioFormat } from "./Settings";



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







///////////////////////////////////////////////////////////
// handle PCM
/**
 * map f32-planar -> f32 (interleaved) -> wunsched bitDepth
 * @param audioData raw audio Data from audio context
 * @returns interleaved pcm data array (Float32Array)
 */
export function handleAudioRaw (audioData: AudioData, audioFormat: AudioFormat, pcmEncoder: (floatSample: number) => number){

    if (audioData.format !== 'f32-planar'){
        console.log(`![ERROR] unexpected audio raw Data Format: ${audioData.format}`)
        return;
    }

    const numberOfFrames = audioData.numberOfFrames;
    const numberOfChannels = audioData.numberOfChannels;
    // Buffer Array type
    let audioSampleArray =getArrayFormat(audioFormat, numberOfFrames * numberOfChannels);

    for (let channel = 0; channel < numberOfChannels; channel++) {
        // each channel: one Plane https://www.w3.org/TR/webcodecs/#enumdef-audiosampleformat
        const planarDataOnPlane = new Float32Array(audioData.allocationSize({planeIndex: channel}) / Float32Array.BYTES_PER_ELEMENT);
        audioData.copyTo(planarDataOnPlane, {planeIndex: channel});
        //console.log('原始音频样本:', planarDataOnPlane.slice(0, 10));

        for (let i = 0; i < numberOfFrames; i++) {
            let floatSample  = planarDataOnPlane[i];//[channel * numberOfFrames + i];
            audioSampleArray[i *numberOfChannels + channel] = pcmEncoder(floatSample);
        }
    }
    return audioSampleArray;

}

/**
 * define Array from codec type
 * @param audioFormat 
 * @param length 
 * @returns 
 */
function getArrayFormat(audioFormat: AudioFormat, length:number){
    let audioSampleArray;
    switch(audioFormat.codec){
        case ('pcm-u8'): 
            audioSampleArray = new Uint8Array(length);
            return audioSampleArray;
        case ('pcm-s16'): 
            audioSampleArray = new Int16Array(length);
            return audioSampleArray;
        case ('pcm-s32'):
            audioSampleArray = new Int32Array(length);
            return audioSampleArray;
        case ('pcm-f32'):
            audioSampleArray = new Float32Array(length);
            return audioSampleArray;
    }
}

/**
 * floatSample (f32) -> selected pcm format
 * @param audioFormat 
 * @returns 
 */
export function getPCMMappingFormat(audioFormat: AudioFormat): ((floatSample: number) => number) {
    const bitDepth = audioFormat.bitDepth
    switch(audioFormat.codec){
        case ('pcm-u8'): 
            return (floatSample: number)=> {
                let s = Math.max(-1, Math.min(1, floatSample));
                return Math.floor((s + 1.0) * 127.5);
            }
        case ('pcm-s16'): 
            return (floatSample: number)=> {
                let s = Math.max(-1, Math.min(1, floatSample));
                return Math.floor(s < 0 ? s * 0x8000 : s * 0x7FFF);
            }
        case ('pcm-s32'):
            return (floatSample: number)=> {
                let s = Math.max(-1, Math.min(1, floatSample));
                return Math.floor(s < 0 ? s * 0x80000000 : s * 0x7FFFFFFF);
            }
        case ('pcm-f32'):
            return (floatSample: number)=> {
                return floatSample;
            }
    }
}




//https://github.com/2fps/recorder/blob/master/src/transform/transform.ts#L15
/**
 * 在data中的offset位置开始写入str字符串
 * @param {TypedArrays} data    二进制数据
 * @param {Number}      offset  偏移量
 * @param {String}      str     字符串
 */
function writeString(data: DataView, offset: number, str:string): void {
    for (let i = 0; i < str.length; i++) {
        data.setUint8(offset + i, str.charCodeAt(i));
    }
}

export function setWAVHead (audioFormat:AudioFormat, littleEdian: boolean = true, pcmDataLength: number){
    const bitDepth = audioFormat.bitDepth;
    const sampleRate = audioFormat.sampleRate;
    const numberOfChannels = audioFormat.numberOfChannels;    

    let headBuffer = new ArrayBuffer(44),
        data = new DataView(headBuffer),
        offset = 0;
        // 资源交换文件标识符
    writeString(data, offset, 'RIFF'); offset += 4;
 //   // 下个地址开始到文件尾总字节数（offset = 4）
    data.setUint32(offset, 36+pcmDataLength, littleEdian); offset += 4;
    // WAV文件标志
    writeString(data, offset, 'WAVE'); offset += 4;
    // 波形格式标志
    writeString(data, offset, 'fmt '); offset += 4;
    // 过滤字节,一般为 0x10 = 16
    data.setUint32(offset, 16, littleEdian); offset += 4;
    // 格式类别 (PCM形式采样数据)
    data.setUint16(offset, 1, littleEdian); offset += 2;
    // 声道数
    data.setUint16(offset, numberOfChannels, littleEdian); offset += 2;
    // 采样率,每秒样本数,表示每个通道的播放速度
    data.setUint32(offset, sampleRate, littleEdian); offset += 4;
    // 波形数据传输率 (每秒平均字节数) 声道数 × 采样频率 × 采样位数 / 8
    data.setUint32(offset, numberOfChannels * sampleRate * (bitDepth / 8), littleEdian); offset += 4;
    // 快数据调整数 采样一次占用字节数 声道数 × 采样位数 / 8
    data.setUint16(offset, numberOfChannels * (bitDepth / 8), littleEdian); offset += 2;
    // 采样位数
    data.setUint16(offset, bitDepth, littleEdian); offset += 2;
    // 数据标识符
    writeString(data, offset, 'data'); offset += 4;
//    // 采样数据总数（offset = 40）
    data.setUint32(offset, pcmDataLength, littleEdian); offset += 4;

    return data;
}



//https://github.com/2fps/recorder/blob/master/src/transform/transform.ts#L116
/**
 * 编码wav，一般wav格式是在pcm文件前增加44个字节的文件头，
 * 所以，此处只需要在pcm数据前增加下就行了。
 *
 * @param  bytes            pcm二进制数据
 * @param  inputSampleRate  输入采样率
 * @param  outputSampleRate 输出采样率
 * @param  numChannels      声道数
 * @param  oututSampleBits  输出采样位数
 * @param  littleEdian      是否是小端字节序
 * @returns                 wav二进制数据
 */
export function encodeWAV(bytes: Uint8Array | Int16Array | Int32Array | Float32Array, inputSampleRate: number, outputSampleRate: number, numChannels: number, oututSampleBits: number, littleEdian: boolean = true) {
    let sampleRate = outputSampleRate > inputSampleRate ? inputSampleRate : outputSampleRate,   // 输出采样率较大时，仍使用输入的值，
        sampleBits = oututSampleBits,        
        buffer = new ArrayBuffer(44 + bytes.byteLength),
        data = new DataView(buffer),
        channelCount = numChannels, // 声道
        offset = 0;

    // 资源交换文件标识符
    writeString(data, offset, 'RIFF'); offset += 4;
    // 下个地址开始到文件尾总字节数,即文件大小-8
    data.setUint32(offset, 36 + bytes.byteLength, littleEdian); offset += 4;
    // WAV文件标志
    writeString(data, offset, 'WAVE'); offset += 4;
    // 波形格式标志
    writeString(data, offset, 'fmt '); offset += 4;
    // 过滤字节,一般为 0x10 = 16
    data.setUint32(offset, 16, littleEdian); offset += 4;
    // 格式类别 (PCM形式采样数据)
    data.setUint16(offset, 1, littleEdian); offset += 2;
    // 声道数
    data.setUint16(offset, channelCount, littleEdian); offset += 2;
    // 采样率,每秒样本数,表示每个通道的播放速度
    data.setUint32(offset, sampleRate, littleEdian); offset += 4;
    // 波形数据传输率 (每秒平均字节数) 声道数 × 采样频率 × 采样位数 / 8
    data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), littleEdian); offset += 4;
    // 快数据调整数 采样一次占用字节数 声道数 × 采样位数 / 8
    data.setUint16(offset, channelCount * (sampleBits / 8), littleEdian); offset += 2;
    // 采样位数
    data.setUint16(offset, sampleBits, littleEdian); offset += 2;
    // 数据标识符
    writeString(data, offset, 'data'); offset += 4;
    // 采样数据总数,即数据总大小-44
    data.setUint32(offset, bytes.byteLength, littleEdian); offset += 4;

    return data;
}