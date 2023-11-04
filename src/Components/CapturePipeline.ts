//import * as WebMMuxer from 'webm-muxer'; //https://github.com/Vanilagy/webm-muxer
import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget  } from 'webm-muxer';

//https://stackoverflow.com/questions/73665100/using-web-api-audioencoder-to-output-opus-frames
export class CapturePipeline {
//AudioEncoderConfig
    sampleRate: number;
    codec: string;
    numberOfChannels:number;
    bitrate:number;
//AudioContext
    audioContext: AudioContext;
    source: MediaStreamAudioSourceNode;
    destination: MediaStreamAudioDestinationNode;
        audioTrackProcessor: MediaStreamTrackProcessor;
    mic: MediaStream;
    selecteddeviceId: string = null;
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
     * @param sampleRate  the number of frame samples per sec
     */
    constructor(
        selecteddeviceId:string='default',
        {codec='opus', sampleRate=16000, numberOfChannels=1, bitrate=320000}: AudioEncoderConfig
    ){
      this.sampleRate = sampleRate;
      this.codec = codec;
      this.onrawdata = null;
      this.onencoded = null;
      this.onconnect = null;
      this.selecteddeviceId = selecteddeviceId;
      this.numberOfChannels = numberOfChannels;
      this.bitrate = bitrate;
    }


    async connect(){
        const mic = navigator.mediaDevices.getUserMedia(
            {audio: { deviceId: this.selecteddeviceId}}
        )
        this.audioContext = new (AudioContext)({
            sampleRate: this.sampleRate,
            //numberOfChannels: 1,
            latencyHint: 'interactive'
        })
        this.mic = await mic;
        this.source = this.audioContext.createMediaStreamSource(this.mic);
        this.destination = this.audioContext.createMediaStreamDestination();
        this.destination.channelCount = 1;
        this.source.connect(this.destination)

        // Encoder
            this.muxer = new Muxer({
                target: new ArrayBufferTarget(),
                audio: {
                    codec:'A_OPUS', //todo
                    sampleRate:this.sampleRate, 
                    numberOfChannels:this.numberOfChannels, 
                    //bitDepth:this.bitrate
                },
                firstTimestampBehavior: 'offset'
            });
            this.encoder = new AudioEncoder({
                output: (chunk, metadata) => this.muxer.addAudioChunk(chunk, metadata),//this.handleEncodedData.bind(this),
                error: this.handleEncodingError.bind(this)
            })  
            this.encoder.configure({
                codec: this.codec,
                numberOfChannels: this.numberOfChannels,
                sampleRate: this.sampleRate,
                bitrate:this.bitrate
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

    async onpause(){
        this.source.disconnect(this.destination);

        await this.encoder.flush();
        this.muxer.finalize();
        let { buffer } = this.muxer.target;
        this.onencoded(buffer);
    }

    onresume(){
        this.source.connect(this.destination);
    }
    

    async disconnect(){
      this.source.disconnect();
      this.audioTrackProcessor=null;
      this.mic=null;
      this.source=null;
      this.destination=null;

      await this.encoder.flush();
      this.muxer.finalize();
      let { buffer } = this.muxer.target;
      this.onencoded(buffer);
      this.encoder=null;
      this.muxer=null;
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
    }
  
    handleRawData(audioData:AudioData){
        if(this.onrawdata){
            this.onrawdata(audioData)
        }
        this.encoder.encode(audioData)
        audioData.close()
    }
}