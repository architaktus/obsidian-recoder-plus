//import * as WebMMuxer from 'webm-muxer'; //https://github.com/Vanilagy/webm-muxer
import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget  } from 'webm-muxer';
import dayjs from "dayjs";

import { WEB_CODEC_TO_MATROSKA_CODEC, recorderState } from 'src/consts';
import { RecorderView } from './Recorder';
import { AudioFormat } from './Settings';
import { Notice } from 'obsidian';
import { handleRecordingFileName } from './utils';
import RecorderPlusPlugin from 'src/main';

//https://stackoverflow.com/questions/73665100/using-web-api-audioencoder-to-output-opus-frames

export class CapturePipeline {
    view:RecorderView;
//AudioEncoderConfig
    audioFormat: AudioFormat;
//AudioContext
    audioContext: AudioContext;
    source: MediaStreamAudioSourceNode;
    destination: MediaStreamAudioDestinationNode;
        audioTrackProcessor: MediaStreamTrackProcessor;
    mediaStream: MediaStream;
    selecteddeviceId: string = null;

//time
    recordStartTime: number=0;
    //recordedTimeOnPause: number=0;
    /*get recordedTime (): number {
        return this.audioContext.currentTime;
    }*/
//AudioEncoder
    encoder:AudioEncoder;
    muxer: Muxer<ArrayBufferTarget>;
    onrawdata: (audioData: AudioData) => void;
    onencoded: (buffer: ArrayBuffer) => void; // onencoded: (chunk: EncodedAudioChunk, metadata: EncodedAudioChunkMetadata) => void;//EncodingMetadata
//callback controlls:
    onconnect: ()=>void;

    /**
     * 
     * @param selecteddeviceId 
     * @param codec  valid codec string: flac/mp3/mp4a/opus/vorbis/...
     *      https://www.w3.org/TR/webcodecs-codec-registry/#audio-codec-registry
     * @param AudioEncoderConfig 
     *      sampleRate/采样率/Hz:  频率范围 - 音频的时间分辨率
     *      bitrate/比特率/bps: 每秒传输的比特数 - 音频的空间分辨率
     */
    constructor(
        view:RecorderView,
        selecteddeviceId:string='default',        
        audioFormat: AudioFormat
    ){        
        this.view = view;
        this.onrawdata = null;
        this.onencoded = null;
        this.onconnect = null;
        this.selecteddeviceId = selecteddeviceId;
        this.audioFormat = audioFormat;
    }


    async connect(){
        // AudioContext setup
            // audioContext
            this.audioContext = new (AudioContext)({
                sampleRate: this.audioFormat.sampleRate,
                latencyHint: 'interactive'
            });

            // update the global recorder state
            this.audioContext.onstatechange = () => this.handleStateChange();
            
            // source
            const mediaStream = navigator.mediaDevices.getUserMedia(
                {audio: { deviceId: this.selecteddeviceId}}
            )
            this.mediaStream = await mediaStream;
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // destination
            this.destination = this.audioContext.createMediaStreamDestination();
            this.destination.channelCount = 1;//this.numberOfChannels;

            // connect
            this.source.connect(this.destination)

        // Encoder
            this.muxer = new Muxer({
                target: new ArrayBufferTarget(),
                audio: {
                    codec: WEB_CODEC_TO_MATROSKA_CODEC[this.audioFormat.codec],
                    sampleRate:this.audioFormat.sampleRate, 
                    numberOfChannels:this.audioFormat.numberOfChannels, 
                    bitDepth:this.audioFormat.bitDepth?this.audioFormat.bitDepth:undefined
                },
                firstTimestampBehavior: 'offset'
            });
            this.encoder = new AudioEncoder({
                output: (chunk, metadata) => this.muxer.addAudioChunk(chunk, metadata),//this.handleEncodedData.bind(this),
                error: this.handleEncodingError.bind(this)
            })  
            this.encoder.configure({
                codec: this.audioFormat.codec,
                numberOfChannels: this.audioFormat.numberOfChannels,
                sampleRate: this.audioFormat.sampleRate,
                bitrate:this.audioFormat.bitrate,
            })

        // callback
        this.onconnect? this.onconnect():null

        // audioTrackProcessor: stream audioData -> encode
            this.audioTrackProcessor = new MediaStreamTrackProcessor({
                track: this.destination.stream.getAudioTracks()[0]
            })
            this.audioTrackProcessor.readable.pipeTo(new WritableStream({
                write: this.handleRawData.bind(this)
            }))        

        //


    }

    async pause(){
        //this.source.disconnect(this.destination);
        this.audioContext.suspend();
        //this.recordedTimeOnPause = dayjs().valueOf();   

        await this.encoder.flush();       
        //this.muxer.finalize(); //cannot finalize here, as it lead to the end of recording
        let { buffer } = this.muxer.target; //TODO 看看如果不finalize 是否可以导出buffer保存
        this.onencoded(buffer);
    }

    resume(){
        //this.source.connect(this.destination);
        this.audioContext.resume();
    }
    

    async close(){
        // Close media stream/ audio context/...
        await this.audioContext.close();
        this.source.disconnect();
        this.audioTrackProcessor=null;
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream=null;
        this.source=null;
        this.destination=null;

        //save file
        await this.encoder.flush();
        this.muxer.finalize();
        let { buffer } = this.muxer.target;
        this.onencoded(buffer);
        this.encoder=null;
        this.muxer=null;

        //close timer/clear time
        this.view.currentRecordingFileName = null;
        this.recordStartTime = 0;
        //this.recordedTimeOnPause = 0;
        this.view.timerId = null;
        this.view.saveIntervalId = null;
        this.view.selectedMicrophoneId = null;
    }

    handleEncodedData(chunk: EncodedAudioChunk, metadata: EncodedAudioChunkMetadata){//EncodingMetadata


        

        /*
        if(this.onencoded){
            this.onencoded(chunk, metadata)
        }
        const data = new ArrayBuffer(chunk.byteLength)
        chunk.copyTo(data);*/
    }
    handleEncodingError(e:Error){
        console.log(e);
            //console.error(`error recording stream: ${e.type} - ${e.error.name}`);
        this.close();
        new Notice ('Recording Error');
    }
  
    handleRawData(audioData:AudioData){
        if(this.onrawdata){
            this.onrawdata(audioData)
        }
        this.encoder.encode(audioData)
        audioData.close()
    }

    handleStateChange(){
        console.log(this.view.plugin.recorderState);
        switch (this.audioContext.state){
            case 'closed': this.view.plugin.recorderState = recorderState.closed; break;
            case 'suspended': 
            this.view.plugin.recorderState = recorderState.suspend; 
                break;
            case 'running': 
                this.recordStartTime = dayjs().valueOf();
                this.view.plugin.recorderState = recorderState.running; 
                //filename
                this.view.currentRecordingFileName = handleRecordingFileName(this.view.plugin, this.view);
                new Notice(`Recording!\n \
                    ${this.view.currentRecordingFileName}.${this.audioFormat.format},\n \
                    with codec ${this.audioFormat.codec}, ${this.audioFormat.bitrate/1000}bps, ${this.audioFormat.sampleRate/1000}kHz, Channel x ${this.audioFormat.numberOfChannels}, ${this.audioFormat.bitDepth?this.audioFormat.bitDepth:null}`);
                break;
        }
    }
}



/**
 * TODO check 文件大小
 * 
 * TODO 把和pipeline无关的内容全部取出
 * 
 * TODO 改成文件大小？到达一定大小，则connect新的destination，断开旧的，前者开始新文件，后者生成第一个文件
 *                         view.saveIntervalId = setInterval(async () => {
                            if (view.chunks.length > 0) { 
                                //await saveRecord(view, view.chunks, false);
                                //view.ticker++;
                            }
*/                            /*if (view.ticker > 3 ){
                                //>30min, clear chunks, then use ffmpeg to join everything. but would be too big for a plugin..
                                chunks = [];
                                view.chunksIndex++;
                            }*/
/*                        }, 10 * 60 * 1000); // 10min
 */