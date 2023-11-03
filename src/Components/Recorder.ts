import { ItemView, WorkspaceLeaf,MarkdownView,Notice, TFile, TFolder, FileSystemAdapter } from "obsidian";
import { join, normalize } from "path";
import moment from 'moment';
import fs from "fs";
import fixWebmMetaInfo from "@w-xuefeng/fix-webm-metainfo";

import TimestampPlugin from "src/main";
import * as consts from "src/consts";
import { AfterRecordModal } from "./UI&Menu/modal";
import * as utl from "./utils";



/**
 * main Page of the Recorder
 */
export class RecorderView extends ItemView {
    plugin: TimestampPlugin
    recorder: MediaRecorder = null;
    currentRecordingFileName: string;
    mediaStream: MediaStream;
    chunks: BlobPart[] = [];
    selectedMicrophoneId: string = null;
    selectedAudioBitsperSec: number = 320000;

    recordStartTime: number=0;
    recordedTimeOnPause: number=0;
    recordedTimeTemp: number=0;

    //Interval Ids
    timerId: any = null;//number | null = null;
    saveIntervalId: any = null;

    get recordedTime (): number {
        if (this.recordStartTime <= 0) return 0;
        if (this.plugin.recorderState === consts.recorderState.recording){
            console.log(`record start time: ${this.recordStartTime/1000}, recorded temp: ${this.recordedTimeTemp/1000}, total time: ${(this.recordedTimeTemp + (Date.now()-this.recordStartTime))/1000}`);
            return (this.recordedTimeTemp + (Date.now()-this.recordStartTime))/1000;
        };
        return this.recordedTimeTemp/1000;
    };

    //ticker:number = 0;
    //chunksIndex: number = 0;
    constructor(
        plugin: TimestampPlugin,
        leaf: WorkspaceLeaf,
    ) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return consts.RECORDER_VIEW;
    }

    getDisplayText() {
        return "Recorder Plus";
    }

    getIcon(): string {
        return "microphone";
    }

    async onOpen() {
        const containerWrap = this.containerEl.children[1];
        containerWrap.empty();
        //const headDiv = container.createEl("div");
        //const recorderTitle = headDiv.createEl("h4", { text: "Media Timestamp Audio Recorder" });
        const container = containerWrap.createDiv();

        const stateDiv = container.createDiv("flexbox-left-align");
        const recordState = stateDiv.createEl('p', "recorder-note remark-text");    
        const recordTimer = stateDiv.createEl('p', "recorder-note remark-text");
        updateRecordstateText(this.plugin.recorderState, recordState);
        updateTimerShowState(this, this.plugin.recorderState, recordTimer);         
        
        const configDiv = container.createEl("div");
        configDiv.style.textAlign = "center";
        
        //const audio_tag = mainRecorderDiv.createEl("audio");        
        const microphones = await utl.getDevices();
        createSelectMc(
            microphones, 
            (id)=>{this.selectedMicrophoneId = id;},
            configDiv);
        createSelectAudioBitperSec(
            (rate)=>{this.selectedAudioBitsperSec = Number(rate);},
            configDiv
            );
        //const line_break = configDiv.createEl("br");
        const mainRecorderDiv = container.createEl("div");
        mainRecorderDiv.style.textAlign = "center";
        const recordButton = mainRecorderDiv.createEl("button", { text: "Record", cls: "startRecord"  });
            recordButton.innerText = "Start"; 
            recordButton.onclick = async () => {
                switch(this.plugin.recorderState){
                    case undefined:   
                    case 'inactive':                 
                        try {
                            this.currentRecordingFileName = handleRecordingFileName(this.plugin);                        
                            //this.ticker = 0;
                            //this.chunksIndex = 0;
                            this.mediaStream = await navigator.mediaDevices.getUserMedia(utl.constraints(this));
                            this.recorder = new MediaRecorder(this.mediaStream, {
                                audioBitsPerSecond: this.selectedAudioBitsperSec,
                                mimeType: "audio/" + utl.audioExt() + ";codecs=opus",
                            });
                            this.recorder.start(consts.RECORDER_TIMESCLICE); 
                            this.recorder.ondataavailable = (e) => this.chunks.push(e.data);

                            recorderConfig.call(this);

                            // save to Temp every 10min
                            this.saveIntervalId = setInterval(async () => {
                                if (this.chunks.length > 0) { 
                                    await saveRecord(this, this.chunks, false);
                                    //this.ticker++;
                                }
                                /*if (this.ticker > 3 ){
                                    //>30min, clear chunks, then use ffmpeg to join everything. but would be too big for a plugin..
                                    chunks = [];
                                    this.chunksIndex++;
                                }*/
                            }, 10 * 60 * 1000); // 10min
                        }catch(error) {
                            console.log(error);
                            new Notice (`![ERROR] by starting Recorder.\n${error}`); 
                        }
                        break;
                    case 'recording':
                        this.recorder.pause();
                        new Notice('Record paused', consts.SUCCESS_NOTICE_TIMEOUT); 
                        await saveRecord(this, this.chunks, false);
                        break;
                    case 'paused':
                        this.recorder.resume();
                        new Notice('Record continue', consts.SUCCESS_NOTICE_TIMEOUT); 
                        break;
                }
                updateRecorderState(this.plugin, this.recorder);
                updateTimerShowState(this, this.plugin.recorderState, recordTimer);
                updateRecordButtonTextBasedOnState(this.plugin.recorderState, recordButton);
                updateRecordstateText(this.plugin.recorderState, recordState);
            }
        const stopRecord = mainRecorderDiv.createEl("button", { text: "Stop", cls: "stopRecord"  });
        //stopRecord.setAttribute("disabled", "true");
        stopRecord.onclick = async () => {
                if (!this.plugin.recorderState || this.plugin.recorderState === 'inactive'){
                    return;
                } else {
                    this.recorder.stop();

                    updateRecorderState(this.plugin, this.recorder);
                    updateRecordButtonTextBasedOnState(this.plugin.recorderState, recordButton);
                    updateRecordstateText(this.plugin.recorderState, recordState);
                    updateTimerShowState(this, this.plugin.recorderState, recordTimer);
                } 
            }    
    }


    //TODO set everything back
    async onClose() {
        this.recorder = null;
        updateRecorderState(this.plugin, this.recorder);
        this.currentRecordingFileName = null;
        //this.ticker = 0;
        //this.chunksIndex = 0;
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
        this.chunks = null;

        this.timerId = null;//number | null = null;
        this.saveIntervalId = null;
        this.selectedMicrophoneId = null;
    }
}















////////////////////////////////////////////
//widget

function createSelectMc(optionsMap: Map<string, string>, callback:(selected:string)=>void, parent?:HTMLElement): HTMLSelectElement{
	const selectEl = document.createElement('select');

    function addChild(optionsMap: Map<string, string>){
        const defaultOptionEl = document.createElement('option');
            const defaultLabel = optionsMap.get('default').replace('Default - ', '');
            defaultOptionEl.textContent = `${defaultLabel} (Default)`;
            defaultOptionEl.value= 'default'; 
            defaultOptionEl.selected = true;
            selectEl.appendChild(defaultOptionEl);

        for (let key of optionsMap.keys()){
            const optionValue = optionsMap.get(key);
            if (!optionValue.contains(defaultLabel)){                
                const optionEl = document.createElement('option');
                optionEl.textContent = optionValue; //label
                optionEl.value= key;                //deviceId
                selectEl.appendChild(optionEl);
            }
        }
    
        const extraOptionEl = document.createElement('option');
        extraOptionEl.textContent = 'update Devices List';
        extraOptionEl.value= 'update'; 
        selectEl.appendChild(extraOptionEl);
    }

    function removeAllOptions(selectElement: HTMLSelectElement) {
        while (selectElement.options.length > 0) {
            selectElement.remove(0);
        }
    }

    addChild(optionsMap);

	selectEl.addEventListener('change',async (e)=>{
		const selected = (e.target as HTMLSelectElement).value;
        if(selected ==="update"){
            removeAllOptions(selectEl);
            const newOptionsMap = await utl.getDevices();
            addChild(newOptionsMap);
        } else {            
            callback(selected);
        }
	});

	parent? parent.appendChild(selectEl): null;
	return selectEl;
}


function createSelectAudioBitperSec(callback:(selected:string)=>void, parent?:HTMLElement): HTMLSelectElement{
	const selectEl = document.createElement('select');
        
    for (let rate of utl.audioBitsPerSecond.keys()){
        const optionValue = utl.audioBitsPerSecond.get(rate);       
        const optionEl = document.createElement('option');
        optionEl.textContent = rate;
        optionEl.value= optionValue.toString();
        selectEl.appendChild(optionEl);
        if(optionValue === 320000){
            optionEl.selected = true;
        }
    }

	selectEl.addEventListener('change',async (e)=>{
		const selected = (e.target as HTMLSelectElement).value;    
        callback(selected);
	});

    parent? parent.appendChild(selectEl): null;
	return selectEl;
}






/**
 * configure recorder: on-states
 * @param this 
 */
function recorderConfig (this: RecorderView){
    this.recorder.onstart = async (e) => {
        new Notice(`Recording!\nBit/s: ${this.selectedAudioBitsperSec/1000}, Format: ${utl.audioExt()}`, consts.SUCCESS_NOTICE_TIMEOUT);  
        this.recordStartTime = Date.now();
    }     
    this.recorder.onpause = (e) => {
        this.recordedTimeOnPause = Date.now();
        this.recordedTimeTemp = this.recordedTimeTemp + this.recordedTimeOnPause-this.recordStartTime;
    } //TODO  保存临时文件 
    this.recorder.onresume = (e) =>{
        this.recordStartTime = Date.now();
    }                        
    this.recorder.onstop = async (e) =>{
        if (this.recordedTimeOnPause > this.recordStartTime){ //pause then stop
            this.recordedTimeTemp = this.recordedTimeTemp;
        } else { // start/(pause-resume) then stop
            this.recordedTimeTemp = this.recordedTimeTemp + Date.now()-this.recordStartTime;
        }
        await saveRecord(this, this.chunks, true);        

        //consoleLog(this.plugin, `record stopped, time: ${Date.now().toString()}`)

        // Close the media stream     
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
        this.recorder = null;
        this.chunks = [];
        this.currentRecordingFileName = null;

        this.recordedTimeTemp = 0;
        this.recordStartTime = 0;
        this.recordedTimeOnPause = 0;
        //this.ticker = 0;
        //this.chunksIndex = 0;
        this.timerId = null;
        this.saveIntervalId = null;
        this.selectedMicrophoneId = null;
    }
    this.recorder.onerror = (e) =>{
        //console.error(`error recording stream: ${e.type} - ${e.error.name}`);
        new Notice ('Recording Error');
        this.recorder.stop();
    }
}


function updateRecorderState(plugin:TimestampPlugin, recorder:MediaRecorder): string| undefined{
    if (!recorder){
        plugin.recorderState = consts.recorderState.undefined;//undefined;
    }else {
        plugin.recorderState =  recorder.state; //"recording" & "paused" & "inactive"
    }
    return plugin.recorderState;
}



function updateRecordButtonTextBasedOnState(state: string, button: HTMLElement): void {
    //TODO recordButton.innerText 改成 icon
    switch(state){
        case consts.recorderState.recording:
            button.innerText = "Recording: Click to Pause";
            break;
        case consts.recorderState.paused:
            button.innerText = "paused: Click to Resume";
            break;
        case consts.recorderState.inactive:
        case consts.recorderState.undefined:
        default:
            button.innerText = "Start";
    }
}


function updateRecordstateText(state: string, note: HTMLElement): void {
    switch(state){
        case consts.recorderState.recording:
            note.innerText = "Recording";
            break;
        case consts.recorderState.paused:
            note.innerText = "paused";
            break;
        case consts.recorderState.inactive:
        case consts.recorderState.undefined:
        default:
            note.innerText = "ready";
    }
}

//TODO 开始似乎有延迟？
function updateTimerShowState(view: RecorderView, state: string, timerEl: HTMLElement): void {
    switch(state){
        case consts.recorderState.recording:
            timerEl.show();
            utl.timer(view, timerEl);
            break;
        case consts.recorderState.paused:
            utl.pauseTimer(view);
            break;
        case consts.recorderState.inactive:
        case consts.recorderState.undefined:
        default:
            utl.timerSetToZero(timerEl);
            utl.pauseTimer(view);
            timerEl.hide();
    }
}

function getUniqueFilePath(plugin: TimestampPlugin, filePath:string ){
    let basePath = filePath;
    let index = 0
    let newFilePath = filePath;
    //consoleLog(plugin,'oldfilename: ' + basePath);
    while (plugin.app.vault.getAbstractFileByPath(newFilePath)){
        index++;
        newFilePath = basePath + index.toString();
    }
    //consoleLog(plugin,'newfilename: ' + newFilePath);
    return newFilePath;
}


function handleRecordingFileName (plugin:TimestampPlugin): string{
    const now = moment().format(plugin.settings.recordingFileNameDateFormat);
    const prefix = plugin.settings.recordingFileNamePrefix;
    const filename = `${prefix}-${now}.${utl.audioExt()}`;
    console.log(plugin,'filename: ' + filename);
    return filename;
}




//TODO 改写成移动端兼容的版本（还是得考虑直接用Ob解决）
async function getSaveSrc (view: RecorderView, isEnd:boolean){
    //console.log(view.plugin,'has folder now: '+ view.plugin.settings.chosenFolderPathForRecordingFile)
    //check file directory

    //https://github.com/phibr0/obsidian-open-with/blob/84f0e25ba8e8355ff83b22f4050adde4cc6763ea/main.ts#L66-L67
    //由于ob的缓存延迟/或者无法识别文件，没法二次暂停的时候就删除文件，只能用蛮力解决   
    //@ts-ignore
    const basicpath = view.plugin.app.vault.adapter.basePath;    
    const fileDirect = normalize(view.plugin.settings.chosenFolderPathForRecordingFile);   
    const absolutefolderPath = join(basicpath, fileDirect) ;
    const folderStats = fs.statSync(absolutefolderPath);
    //const folder = view.plugin.app.vault.getAbstractFileByPath(fileDirect);
    console.log(view.plugin,'has folder now: '+ folderStats+  folderStats.isDirectory())
    if (!folderStats || !folderStats.isDirectory()){
        await view.plugin.app.vault.createFolder(fileDirect);        
        //consoleLog(plugin,'not exist, creating folder')
    }     
    
    //check file name
    let currentFileName = view.currentRecordingFileName;
    //handleFileName if (!fileName)
    let filePath = join(fileDirect, currentFileName);
    let absoluteFilePath = join(absolutefolderPath, currentFileName);
    filePath = getUniqueFilePath(view.plugin, filePath);//TODO

    //delete old temp
    const tempFileName = currentFileName + "-temp";
    const absoluteTempFilePath = absoluteFilePath + "-temp"; 
    const tempfilePath = filePath + "-temp";   
    //const tempFile = view.plugin.app.vault.getAbstractFileByPath(tempfilePath);
    console.log(view.plugin,'absoluteFempFilePath:' + absolutefolderPath);
    if (fs.existsSync(absoluteTempFilePath)){
        fs.renameSync(absoluteTempFilePath, absoluteTempFilePath + "1")
        //await view.plugin.app.vault.delete(tempFile);
    }
    if (!isEnd){
        currentFileName = tempFileName;
        filePath = tempfilePath;
    }

    console.log(view.plugin,'has unique filename now:' + filePath);

    return {currentFileName, filePath, absoluteFilePath, absoluteTempFilePath}
}

//TODO 改写成移动端兼容的版本（还是得考虑直接用Ob解决）
async function saveRecord(view: RecorderView, chunks:BlobPart[], isEnd:boolean){
    isEnd? new Notice("Adding recording to vault..."): null;
    const src = await getSaveSrc (view, isEnd);
        const currentFileName = src.currentFileName;
        const filePath = src.filePath;
        const absoluteFilePath = src.absoluteFilePath;
        const absoluteTempFilePath = src.absoluteTempFilePath;


    const blobTemp = new Blob(chunks, {
        type: "audio/" + utl.audioExt()
    });    
    //fixedWebMBlob
    const blob = await fixWebmMetaInfo(blobTemp);
    const bufferFile = await blob.arrayBuffer();
    
    await view.plugin.app.vault.createBinary(filePath, bufferFile)
    .then((file) =>{
        if(isEnd){
            new Notice(`Saved to ${filePath}`);
            if (fs.existsSync(absoluteTempFilePath + "1")){fs.unlinkSync(absoluteTempFilePath + "1")}
            new AfterRecordModal(
                view.plugin,true,
                (e) => {
                    utl.saveBlobAsFile(blob, currentFileName);
                },
                ()=>{
                    utl.CopyToClipboard(`\n![[${currentFileName}]]\n`);
                },
                async ()=>{
                    try{
                        fs.unlinkSync(absoluteFilePath);
                        //const trash = require('trash'); (async () => {await trash(absoluteFilePath);})();
                        new Notice(`file ${currentFileName} deleted.`, consts.SUCCESS_NOTICE_TIMEOUT);
                    }catch{
                        new Notice(`![ERROR] by deleting file ${currentFileName}. This recording is still at ${absoluteFilePath}`);
                    }
                },
            ).open();
        }
    })
    .catch((error)=>{
        new Notice(`![ERROR] by saving Recording File to ${filePath}\n\n${error}`);
        console.log(view.plugin,'error:' + error);
        if(isEnd){
            new AfterRecordModal(view.plugin,false,
                (e)=>{
                    utl.saveBlobAsFile(blob, currentFileName);
                }
                ).open();
        }
    });
}