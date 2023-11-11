import { ItemView, WorkspaceLeaf,MarkdownView,Notice, TFile, TFolder, FileSystemAdapter } from "obsidian";
import { join, normalize } from "path";

//import * as WebMMuxer from 'webm-muxer'; //https://github.com/Vanilagy/webm-muxer
import { Muxer, ArrayBufferTarget } from 'webm-muxer';//FileSystemWritableFileStreamTarget
//import fixWebmMetaInfo  from "@w-xuefeng/fix-webm-metainfo";

import RecorderPlusPlugin from "src/main";
import * as consts from "src/consts";
import { AfterRecordModal } from "./UI&Menu/modal";
import * as utl from "./utils";
import { CapturePipeline } from "./CapturePipeline";
import * as uis from "./UI&Menu/uiWidgets";
import { AudioFormat } from "./Settings";



/**
 * main Page of the Recorder
 */
export class RecorderView extends ItemView {
    plugin: RecorderPlusPlugin
    selectedMicrophoneId: string = null;
    selectedAudioBitsperSec: number = 320000;
    
    currentRecordingFileName: string;


    pipeline: CapturePipeline=null;

    //Interval Ids
    timerId: any = null;//number | null = null;
    saveIntervalId: any = null;
    
    //ui
    navBar: HTMLDivElement;
    //currentContentPart: HTMLDivElement;
    selectedTab: string = consts.iconInfo.General;
    lastSelectedTab: string=null; //todo: setting中记录
    contentEl: HTMLElement;

    //config
    audioFormat: AudioFormat = {
        format: 'webm', 
        codec:'opus',
        sampleRate: 44100,
        numberOfChannels:1, //TODO 是否可以检测而非设定？
        bitrate: 320000,
    };

    constructor(
        plugin: RecorderPlusPlugin,
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
        // 2.child: <div class="view-content">
        const containerWrap = this.containerEl.children[1];
        containerWrap.empty();

        //nav-header
        const navContainer = containerWrap.createEl('nav', {cls: `recorder-plus__nav-container`});
        const navWrapper = navContainer.createEl('nav', {cls: `recorder-plus__nav`});
        this.navBar = navWrapper.createDiv('flexbox-left-align recorder-plus-nav-group');
        uis.createNavBar(this);

        // content
        this.contentEl = containerWrap.createDiv('recorder-plus-content');
        //const recorderTitle = headDiv.createEl("h4", { text: "Media Timestamp Audio Recorder" });

        // General Tab:        
        const generalTab = this.contentEl.createDiv(`recorder-plus__content`); //TODO  recorder-plus__selected-tab
        generalTab.id = consts.iconInfo.General;
        createGeneralTab(this.plugin, this, generalTab);

        // Advance Tab:
        const advanceTab = this.contentEl.createDiv(`recorder-plus__content recorder-plus__hidden`);
        advanceTab.id = consts.iconInfo.Advance;
        createAdvanceTab(this, advanceTab);

        // History Tab:
        const viewerTab = this.contentEl.createDiv(`recorder-plus__content recorder-plus__hidden`);
        viewerTab.id = consts.iconInfo.Viewer
    }


    //TODO set everything back
    async onClose() {
        this.pipeline.close();
        this.currentRecordingFileName = null;

        this.timerId = null;//number | null = null;
        this.saveIntervalId = null;
        this.selectedMicrophoneId = null;
    }
}








/**UI Parts */

function createGeneralTab(plugin: RecorderPlusPlugin, view: RecorderView, parent: HTMLDivElement){
        //const line_break = configDiv.createEl("br");
    const mainRecorderDiv = parent.createEl("div");
    mainRecorderDiv.style.textAlign = "center";

    const recordButton = mainRecorderDiv.createEl("button", { text: "Record", cls: "startRecord"  });
        recordButton.innerText = "Start"; 
        recordButton.onclick = async ()=> {
            switch(view.plugin.recorderState){
                case consts.recorderState.closed:                   
                    try {                                            
                        // use WebCodecs method
                        view.pipeline = new CapturePipeline(
                            view,
                            view.selectedMicrophoneId,
                            view.audioFormat,
                        )
                        //view.pipeline.onrawdata
                        view.pipeline.onencoded = async (buffer) => {
                            saveRecord(view, buffer, true)
                            console.log('buffer encoded')
                        }
                        await view.pipeline.connect();
                    }catch(error) {
                        console.log(error);
                        new Notice (`![ERROR] by starting Recorder.\n${error}`); 
                    }
                    break;
                case consts.recorderState.running:
                    view.pipeline.pause();
                    new Notice('Record paused', consts.SUCCESS_NOTICE_TIMEOUT); 
                    break;
                case consts.recorderState.suspend:
                    view.pipeline.resume();                        
                    new Notice('Record continue', consts.SUCCESS_NOTICE_TIMEOUT); 
                    break;
            }

            updateTimerShowState(view, view.plugin.recorderState, recordTimer);
            updateRecordButtonTextBasedOnState(view.plugin.recorderState, recordButton);
            updateRecordstateText(view.plugin.recorderState, recordState);
        };
    const stopRecord = mainRecorderDiv.createEl("button", { text: "Stop", cls: "stopRecord"  });
    //stopRecord.setAttribute("disabled", "true");
    stopRecord.onclick = async () => {
            if (!view.plugin.recorderState || view.plugin.recorderState === consts.recorderState.closed){
                return;
            } else {                
                view.pipeline.close();

                updateRecordButtonTextBasedOnState(view.plugin.recorderState, recordButton);
                updateRecordstateText(view.plugin.recorderState, recordState);
                updateTimerShowState(view, view.plugin.recorderState, recordTimer);
            } 
        }   

        //TODO 放在Viewer的最下端，即作为各个Tab的父级的兄弟节点 bottom=0
        const stateDiv = parent.createDiv("flexbox-left-align");
        const recordState = stateDiv.createEl('p', "recorder-note remark-text");
        const recordTimer = stateDiv.createEl('p', "recorder-note remark-text");

        updateRecordstateText(plugin.recorderState, recordState);
        updateTimerShowState(view, plugin.recorderState, recordTimer);    
}



/*
                        view.pipeline.onrawdata = async (audioData) => {
                            rawLength += audioData.numberOfFrames * 2;
                            if(audioData.numberOfFrames > audioSampleArray.length){
                                audioSampleArray = new Float32Array(audioData.numberOfFrames)
                            }
                            audioData.copyTo(audioSampleArray, {planeIndex: 0});
                            console.log(audioSampleArray.length)
                            const rms = Math.sqrt(audioSampleArray
                                .map(x => x*x)
                                .reduce((a,b) => a+b) / audioSampleArray.length);
                            volumeBar.style.width = (rms * 500) + 'px'
                        }
*/

async function createAdvanceTab(view: RecorderView, parent: HTMLDivElement){
    const configDiv = parent.createEl("div");
    configDiv.style.textAlign = "center";    

    //const audio_tag = mainRecorderDiv.createEl("audio");        
    const microphones = await utl.getDevices();
    createSelectMc(
        microphones, 
        (id)=>{view.selectedMicrophoneId = id;},
        configDiv);
    createSelectAudioBitperSec(
        (rate)=>{view.audioFormat.bitrate = Number(rate);},
        configDiv
        );
    
    /*TODO
    createSelectSampleRate(
        (sampleRate)=>{view.audioFormat.sampleRate = Number(sampleRate);},
        configDiv
    );

    createSelectCodec(
        (codec:string)=>{
            view.audioFormat.codec = codec;
            if(     codec === "pcm-u8"
            ){
                view.audioFormat.bitDepth = Number(codec.slice(-1));
            }
            if(     codec === "pcm-s16"
                ||  codec === "pcm-s24"
                ||  codec === "pcm-s32"
                ||  codec === "pcm-f32"
            ){
                view.audioFormat.bitDepth = Number(codec.slice(-2));
            }
        },
        configDiv
    );

    createSelectFileFormat(
        (format)=>{view.audioFormat.format = format;},
        configDiv
    );

    //筛选createSelectFileFormat 可选项
    //每次codec更新都调用。 add id， search replace

    */
}



/**
 * UI: choose a mic as input
 * @param optionsMap 
 * @param callback 
 * @param parent 
 * @returns 
 */
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





function updateRecordButtonTextBasedOnState(state: number, button: HTMLElement): void {
    //TODO recordButton.innerText 改成 icon
    switch(state){
        case consts.recorderState.running:
            button.innerText = "Recording: Click to Pause";
            break;
        case consts.recorderState.suspend:
            button.innerText = "paused: Click to Resume";
            break;
        case consts.recorderState.closed:
        default:
            button.innerText = "Start";
    }
}


function updateRecordstateText(state: number, note: HTMLElement): void {
    switch(state){
        case consts.recorderState.running:
            note.innerText = "Recording";
            break;
        case consts.recorderState.suspend:
            note.innerText = "paused";
            break;
        case consts.recorderState.closed:
        default:
            note.innerText = "ready";
    }
}

//TODO 开始似乎有延迟？
function updateTimerShowState(view: RecorderView, state: number, timerEl: HTMLElement): void {
    switch(state){
        case consts.recorderState.running:
            timerEl.show();
            utl.timer(view, timerEl);
            break;
        case consts.recorderState.suspend:
            utl.pauseTimer(view);
            break;
        case consts.recorderState.closed:
        default:
            utl.timerSetToZero(timerEl);
            utl.pauseTimer(view);
            timerEl.hide();
    }
}



//TODO 改写成移动端兼容的版本（还是得考虑直接用Ob解决）
/**
 * save
 * @param view 
 * @param buffer 
 * @param isEnd 
 */
async function saveRecord(view: RecorderView, buffer:ArrayBuffer, isEnd:boolean){
    let fileName: string = utl.getSaveFileName(view);
    let filePath: string;
    let tempFileName = fileName + "-Temp";

    //has old temp?
    const fileDirect = normalize(view.plugin.settings.chosenFolderPathForRecordingFile);

    const tempfilePath = utl.getSaveSrc(view, tempFileName).replace(/\\/g,'/');
    const tempfile = view.plugin.app.vault.getAbstractFileByPath(tempfilePath);

    //filename 
    if(isEnd){
        new Notice("Adding recording to vault...")
    }else{
        fileName = tempFileName;
        if(!!tempfile){
            fileName = fileName +"1"
        }
    }

    filePath = utl.getSaveSrc(view, fileName);
    

    const blob = new Blob([buffer], 
        {type: "audio/" + view.audioFormat.format}
    );

    
    // Blob -> single ArrayBuffer
    //const bufferFile = await blob.arrayBuffer();
    
    let file: TFile;
    try {
        file = await view.plugin.app.vault.createBinary(filePath, buffer);
        console.log(`file.path: ${file.path}`);
        //delete old temp
        if(!!tempfile){
            await view.plugin.app.vault.delete(tempfile); 
            fileName = fileName.slice(0, -1);
            filePath = utl.getSaveSrc(view, fileName);
            await view.plugin.app.vault.rename(file, filePath);
        } 
        if (isEnd){
            new Notice(`Saved to ${filePath}`);

            //post recording config
            new AfterRecordModal(
                view.plugin,true,
                (e) => {
                    utl.saveBlobAsFile(blob, view.currentRecordingFileName);
                },
                ()=>{
                    utl.CopyToClipboard(`\n![[${view.currentRecordingFileName}]]\n`);
                },
                async ()=>{
                    try{
                        await view.plugin.app.vault.delete(file); 
                        //const trash = require('trash'); (async () => {await trash(absoluteFilePath);})();
                        new Notice(`file ${view.currentRecordingFileName} deleted.`, consts.SUCCESS_NOTICE_TIMEOUT);
                    }catch{
                        new Notice(`![ERROR] by deleting file ${view.currentRecordingFileName}. This recording remains at ${filePath}`);
                    }
                },
            ).open();            
        }
    } catch(error){
        new Notice(`![ERROR] by saving Recording File to ${filePath}\n\n${error}`);
        console.log(view.plugin,'error:' + error);
        if(isEnd){
            new AfterRecordModal(view.plugin,false,
                (e)=>{
                    utl.saveBlobAsFile(blob, view.currentRecordingFileName);
                }
                ).open();        
        }
    }
}














/**
 * backup
export class RecorderView extends ItemView {
    plugin: TimestampPlugin
    recorder: MediaRecorder = null;
    mediaStream: MediaStream;
    chunks: BlobPart[] = [];
    selectedMicrophoneId: string = null;
    selectedAudioBitsperSec: number = 320000;
    
    currentRecordingFileName: string;
    recordStartTime: number=0;
    recordedTimeOnPause: number=0;
    recordedTimeTemp: number=0;

    pipeline: CapturePipeline=null;

    //Interval Ids
    timerId: any = null;//number | null = null;
    saveIntervalId: any = null;

    get recordedTime (): number {
        if (this.recordStartTime <= 0) return 0;
        if (this.plugin.recorderState === consts.recorderState.recording){
            console.log(`record start time: ${this.recordStartTime/1000}, recorded temp: ${this.recordedTimeTemp/1000}, total time: ${(this.recordedTimeTemp + (dayjs().valueOf()-this.recordStartTime))/1000}`);
            return (this.recordedTimeTemp + (dayjs().valueOf()-this.recordStartTime))/1000;
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
        let rawLength = 0;
        let encodedLength = 0;
        let audioSampleArray = new Float32Array(0)


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
                            //this.ticker = 0;
                            //this.chunksIndex = 0;
                                console.log(`webM method`);
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
                            //    if (this.ticker > 3 ){
                            //        //>30min, clear chunks, then use ffmpeg to join everything. but would be too big for a plugin..
                            //        chunks = [];
                            //        this.chunksIndex++;
                            //    }
                            }, 10 * 60 * 1000); // 10min
                        }catch(error) {
                            console.log(error);
                            new Notice (`![ERROR] by starting Recorder.\n${error}`); 
                        }
                        break;
                    case 'recording':
                        if ('AudioEncoder' in window){

                        }else {
                            this.recorder.pause();
                        }
                        new Notice('Record paused', consts.SUCCESS_NOTICE_TIMEOUT); 
                        await saveRecord(this, this.chunks, false);
                        break;
                    case 'paused':
                        if ('AudioEncoder' in window){

                        }else {
                            this.recorder.resume();
                        }
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
*/

/**
 * configure recorder: on-states
 * @param this 
 */
/*
function recorderConfig (this: RecorderView){
    this.recorder.onstart = async (e) => {
        new Notice(`Recording!\nBit/s: ${this.selectedAudioBitsperSec/1000}, Format: ${utl.audioExt()}`, consts.SUCCESS_NOTICE_TIMEOUT);  
        this.recordStartTime = dayjs().valueOf();
        //filename
        this.currentRecordingFileName = utl.handleRecordingFileName(this.plugin, this);        
    }     
    this.recorder.onpause = (e) => {
        this.recordedTimeOnPause = dayjs().valueOf();
        this.recordedTimeTemp = this.recordedTimeTemp + this.recordedTimeOnPause-this.recordStartTime;
    } //TODO  保存临时文件 
    this.recorder.onresume = (e) =>{
        this.recordStartTime = dayjs().valueOf();
    }                        
    this.recorder.onstop = async (e) =>{
        if (this.recordedTimeOnPause > this.recordStartTime){ //pause then stop
            this.recordedTimeTemp = this.recordedTimeTemp;
        } else { // start/(pause-resume) then stop
            this.recordedTimeTemp = this.recordedTimeTemp + dayjs().valueOf()-this.recordStartTime;
        }
        await saveRecord(this, this.chunks, true);        

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
}*/
/**
 * save
 * @param view 
 * @param chunks 
 * @param isEnd 
 */
/*
async function saveRecord(view: RecorderView, chunks:BlobPart[], isEnd:boolean){
    let fileName: string = utl.getSaveFileName(view);
    let filePath: string;
    let tempFileName = fileName + "-Temp";

    //has old temp?
    const fileDirect = normalize(view.plugin.settings.chosenFolderPathForRecordingFile);

    const tempfilePath = utl.getSaveSrc(view, tempFileName).replace(/\\/g,'/');
    const tempfile = view.plugin.app.vault.getAbstractFileByPath(tempfilePath);

    //filename 
    if(isEnd){
        new Notice("Adding recording to vault...")
    }else{
        fileName = tempFileName;
        if(!!tempfile){
            fileName = fileName +"1"
        }
    }

    filePath = utl.getSaveSrc(view, fileName);

    const blobTemp = new Blob(chunks, {
        type: "audio/" + utl.audioExt()
    });
    
    //fixedWebMBlob
    const blob = blobTemp;
    //const blob = await fixWebmMetaInfo(blobTemp);
    const bufferFile = await blob.arrayBuffer();
    let file: TFile;
    try {
        file = await view.plugin.app.vault.createBinary(filePath, bufferFile);
        console.log(`file.path: ${file.path}`);
        //delete old temp
        if(!!tempfile){
            await view.plugin.app.vault.delete(tempfile); 
            fileName = fileName.slice(0, -1);
            filePath = utl.getSaveSrc(view, fileName);
            await view.plugin.app.vault.rename(file, filePath);
        } 
        if (isEnd){
            new Notice(`Saved to ${filePath}`);

            //post recording config
            new AfterRecordModal(
                view.plugin,true,
                (e) => {
                    utl.saveBlobAsFile(blob, view.currentRecordingFileName);
                },
                ()=>{
                    utl.CopyToClipboard(`\n![[${view.currentRecordingFileName}]]\n`);
                },
                async ()=>{
                    try{
                        await view.plugin.app.vault.delete(file); 
                        //const trash = require('trash'); (async () => {await trash(absoluteFilePath);})();
                        new Notice(`file ${view.currentRecordingFileName} deleted.`, consts.SUCCESS_NOTICE_TIMEOUT);
                    }catch{
                        new Notice(`![ERROR] by deleting file ${view.currentRecordingFileName}. This recording remains at ${filePath}`);
                    }
                },
            ).open();            
        }
    } catch(error){
        new Notice(`![ERROR] by saving Recording File to ${filePath}\n\n${error}`);
        console.log(view.plugin,'error:' + error);
        if(isEnd){
            new AfterRecordModal(view.plugin,false,
                (e)=>{
                    utl.saveBlobAsFile(blob, view.currentRecordingFileName);
                }
                ).open();        
        }
    }
}
*/