export function handleAudioRaw (audioData?: AudioData, audioFormat?: AudioFormat) {
    /*if (audioData.format !== 'f32-planar'){
        console.log(`![ERROR] unexpected audio raw Data Format: ${audioData.format}`)
        return;// audioData;
    }*/

    // 选取转换函数
    let convertSample;
    switch (audioFormat.codec) {
        case 'pcm-u8':
            convertSample = floatToUnsignedInt8;
            break;
        case 'pcm-s16':
            convertSample = floatToSignedInt16;
            break;
        /*case 'pcm-s24':
            convertSample = floatToSignedInt24;
            break;*/
        case 'pcm-s32':
            convertSample = floatToSignedInt32;
            break;
        //直接导出，转换f32-planar为标准的非平面 pcm-f32
        case 'pcm-f32':
            //@ts-ignore
            convertSample = sample => sample;
            break;
        default:
            console.log(`![ERROR] Unsupported codec: ${audioFormat.codec}`);
            return;// audioData;
    }

    // audioData -> specific PCM
    //const numberOfFrames = audioData.numberOfFrames;
    //const numberOfChannels = audioData.numberOfChannels;
    //Float32Array 缓存
    const numberOfChannels = 2;
    const toneSamples = generateSineWave(440, 1, 48000);//audioData.sampleRate);
    const numberOfFrames = toneSamples.length;
    const planarData = new Float32Array(numberOfFrames * numberOfChannels);
    for (let i = 0; i < numberOfFrames; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            planarData[channel * numberOfFrames + i] = toneSamples[i];
        }
    }
    const planarData = new Float32Array(audioData.allocationSize({planeIndex: 0}) / Float32Array.BYTES_PER_ELEMENT);
    audioData.copyTo(planarData, {planeIndex: 0});
    let audioSampleArray = new Float32Array(numberOfFrames * numberOfChannels);
    for (let i = 0; i < numberOfFrames; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            let floatSample  = planarData[channel * numberOfFrames + i];
            audioSampleArray[i *numberOfChannels + channel] = convertSample(floatSample);
        }
    }
    return audioSampleArray;
}



//test
function generateSineWave(frequency: number, duration:number, sampleRate:number, amplitude = 1.0) {
    const sampleLength = sampleRate * duration; // 样本总数
    const buffer = new Float32Array(sampleLength);

    for (let i = 0; i < sampleLength; i++) {
        buffer[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
    }

    return buffer;
}
const toneSamples = generateSineWave(440, 1, 44100);
function createMockAudioData(frequency: number, duration:number, sampleRate:number, numberOfChannels: number): AudioData {
    const buffer = generateSineWave(frequency, duration, sampleRate);
    const numberOfFrames = buffer.length;//sampleRate * duration;
    const planarData = new Float32Array(numberOfFrames * numberOfChannels);

    // 对于单声道，复制相同的数据到所有通道
    for (let i = 0; i < numberOfFrames; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            planarData[channel * numberOfFrames + i] = buffer[i];
        }
    }

    return {
        format: 'f32-planar' as AudioSampleFormat,
        duration: duration * 1000000, // 单位微秒
        numberOfChannels: numberOfChannels,
        numberOfFrames: numberOfFrames,
        sampleRate: sampleRate,
        timestamp: performance.now(), // 模拟一个时间戳
        allocationSize: (options:AudioDataCopyToOptions) => planarData.byteLength,
        copyTo: //(destination, options) => destination = planarData,//planarData.copyWithin(0, 0),
        (destination, options) => {
            let frameOffset = options.frameOffset || 0;
            let frameCount = options.frameCount || (numberOfFrames - frameOffset);
            let start = frameOffset * numberOfChannels;
            let end = start + frameCount * numberOfChannels;
            (destination as Float32Array).set(planarData.subarray(start, end));
        },
        clone:null,
        close:null,
    };
}
const mockAudioData = createMockAudioData(440, 1, 44100, 2);
////////////////////////////////////////////////////////////
// handle PCM
export function handleAudioRaw (audioData?: AudioData, audioFormat?: AudioFormat) {
    audioData = mockAudioData
    if (audioData.format !== 'f32-planar'){
        console.log(`![ERROR] unexpected audio raw Data Format: ${audioData.format}`)
        return;// audioData;
    }

    // 选取转换函数
    let convertSample;
    switch (audioFormat.codec) {
        case 'pcm-u8':
            convertSample = floatToUnsignedInt8;
            break;
        case 'pcm-s16':
            convertSample = floatToSignedInt16;
            break;
        /*case 'pcm-s24':
            convertSample = floatToSignedInt24;
            break;*/
        case 'pcm-s32':
            convertSample = floatToSignedInt32;
            break;
        //直接导出，转换f32-planar为标准的非平面 pcm-f32
        case 'pcm-f32':
            //@ts-ignore
            convertSample = sample => sample;
            break;
        default:
            console.log(`![ERROR] Unsupported codec: ${audioFormat.codec}`);
            return;// audioData;
    }

    // audioData -> specific PCM
    const numberOfFrames = audioData.numberOfFrames;
    const numberOfChannels = audioData.numberOfChannels;
    //Float32Array 缓存
    const planarData = new Float32Array(audioData.allocationSize({planeIndex: 0}) / Float32Array.BYTES_PER_ELEMENT);
    audioData.copyTo(planarData, {planeIndex: 0});
    let audioSampleArray = new Float32Array(numberOfFrames * numberOfChannels);
    for (let i = 0; i < numberOfFrames; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            let floatSample  = planarData[channel * numberOfFrames + i];
            audioSampleArray[i *numberOfChannels + channel] = convertSample(floatSample);
        }
    }
    return audioSampleArray;
}





//save
export async function saveWaveFile (view: RecorderView, isEnd:boolean){
    const testBuffer = utl.handleAudioRaw(undefined, view.audioFormat);
    view.audioDataBuffer = [];
    view.audioDataBuffer.push(testBuffer);
    view.audioDataBuffer.push(testBuffer);
    //拼接成一个数组
    let allSamples = [].concat(...view.audioDataBuffer);
    // WaveFile 实例
    let wav = new WaveFile();

    //新WAV 文件
    //通道数、采样率、位深度、样本数据
    const {numberOfChannels, sampleRate, codec} = view.audioFormat
    const bitDepth = getBitDepthFromCodec(codec);
    console.log(`depth: ${bitDepth}`)
    wav.fromScratch(/*numberOfChannels*/ 2, sampleRate, bitDepth, allSamples);//'32f'
    console.log('scratch+')
    let wavBuffer = wav.toBuffer();
    await saveRecord(view, wavBuffer.buffer,isEnd);
}
















export class CapturePipeline {
    view:RecorderView;
    audioFormat: AudioFormat;
    audioContext: AudioContext;
    source: MediaStreamAudioSourceNode;
    destination: MediaStreamAudioDestinationNode;
        audioTrackProcessor: MediaStreamTrackProcessor;
    mediaStream: MediaStream;
    selecteddeviceId: string = null;
    recordStartTime: number=0;
    encoder:AudioEncoder;
    onrawdata: (audioData: AudioData) => void;
    onconnect: ()=>void;
    constructor(
        view:RecorderView
    ){        
        this.view = view;
        this.onrawdata = null;
        this.onconnect = null;
        this.selecteddeviceId = view.selectedMicrophoneId;
        this.audioFormat = view.audioFormat;
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
        const { channelCount, sampleRate } = this.mediaStream.getAudioTracks()[0].getSettings();
        this.view.audioFormat.sampleRate = sampleRate;
        if (!this.view.audioFormat.numberOfChannels){
            this.view.audioFormat.numberOfChannels= channelCount;
        }

        this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

        // destination
        this.destination = this.audioContext.createMediaStreamDestination();
        this.destination.channelCount = this.view.audioFormat.numberOfChannels;

        // connect
        this.source.connect(this.destination);

        // audioTrackProcessor: stream audioData -> encode
        this.audioTrackProcessor = new MediaStreamTrackProcessor({
            track: this.destination.stream.getAudioTracks()[0]
        })
        if(this.audioFormat.format === 'wav'){
            this.audioTrackProcessor.readable.pipeTo(new WritableStream({
                write: this.rawDataToPCM.bind(this)
            }))  
        }

        // callback
        this.onconnect? this.onconnect():null
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

        if(this.audioFormat.format === 'wav'){
            saveWaveFile(this.view, true);
        }

        //close timer/clear time
        this.view.currentRecordingFileName = null;
        this.recordStartTime = 0;
        this.view.timerId = null;
        this.view.saveIntervalId = null;
        this.view.selectedMicrophoneId = null;
    }

        //PCM        
        async rawDataToPCM(audioData:AudioData){
            this.onrawdata(audioData); //f32-planar                
            audioData.close();
        }
    }

在view类下
    view.pipeline.onrawdata = async (audioData) => {
        const audioSampleArray = utl.handleAudioRaw(audioData, view.audioFormat);
        if(audioSampleArray.length > 0){
            view.audioDataBuffer.push(audioSampleArray);
        }
    }
其中handleAudioRaw函数主要用途是生成一个js缓冲区，并吧浮点数映射到其他范围（如16位整数）
const planarData = new Float32Array(audioData.allocationSize({planeIndex: 0}) / Float32Array.BYTES_PER_ELEMENT);
audioData.copyTo(planarData, {planeIndex: 0});
之后用audioDataBuffer生成WAV。

情景：现在生成的WAV文件只有杂音。已知前文各个步骤中：从开始到生成audioData部分、以及handleAudioRaw的映射之后直到生成WAV的部分都是没有问题的，请分析可能出现问题的地方并提供调试的方法












        //this.audioFormat.format === 'wav'
        else {
            let processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            //connect
            this.source.connect(processor);
            processor.connect(this.audioContext.destination);

            processor.onaudioprocess = (e) => {
                this.onrawdata(e.inputBuffer);
            }
        }

/*export function handleAudioRaw (audioBuffer: AudioBuffer, audioFormat: AudioFormat) {
    // 选取转换函数
    let convertSample;
    switch (audioFormat.codec) {
        case 'pcm-u8':
            convertSample = floatToUnsignedInt8;
            break;
        case 'pcm-s16':
            convertSample = floatToSignedInt16;
            break;
        case 'pcm-s32':
            convertSample = floatToSignedInt32;
            break;
        //直接导出，转换f32-planar为标准的非平面 pcm-f32
        case 'pcm-f32':
            //@ts-ignore
            convertSample = sample => sample;
            break;
        default:
            console.log(`![ERROR] Unsupported codec: ${audioFormat.codec}`);
            return;// audioData;
    }

    // audioData -> specific PCM
    const numberOfFrames = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    console.log(`frames = ${numberOfFrames}, channels = ${numberOfChannels}, duration: ${audioBuffer.duration}`)
    //Float32Array 缓存
    let audioSampleArray = new Float32Array(numberOfFrames * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
        let singleChannelData = audioBuffer.getChannelData(channel);
        console.log('原始音频样本:', singleChannelData.slice(0, 10));
        for (let i = 0; i < numberOfFrames; i++) {
            let floatSample  = singleChannelData[i];
            audioSampleArray[i *numberOfChannels + channel] = convertSample(floatSample);
        }
    }
    console.log('转换后音频样本:', audioSampleArray.slice(0, 10));
    return audioSampleArray;
}*/
















///Uint8Array 缓存版本
export function handleAudioRaw (audioData: AudioData, audioFormat: AudioFormat) {
    if (audioData.format !== 'f32-planar'){
        console.log(`![ERROR] unexpected audio raw Data Format: ${audioData.format}`)
        return;// audioData;
    }

    // 选取转换函数
    let convertSample;
    switch (audioFormat.codec) {
        case 'pcm-u8':
            convertSample = floatToUnsignedInt8;
            break;
        case 'pcm-s16':
            convertSample = floatToSignedInt16;
            break;
        //case 'pcm-s24':
        //    convertSample = floatToSignedInt24;
        //    break;
        case 'pcm-s32':
            convertSample = floatToSignedInt32;
            break;
        //直接导出，转换f32-planar为标准的非平面 pcm-f32
        case 'pcm-f32':
            //@ts-ignore
            convertSample = sample =>  sample * 0x7FFFFFFF; // 将 [-1, 1] 范围的浮点数转换为 32 位整数
            break;
        default:
            console.log(`![ERROR] Unsupported codec: ${audioFormat.codec}`);
            return;// audioData;
    }

    // audioData -> specific PCM
    const numberOfFrames = audioData.numberOfFrames;
    const numberOfChannels = audioData.numberOfChannels;
    console.log(`audio type = ${audioData.format}, frames = ${numberOfFrames}, channels = ${numberOfChannels}, duration: ${audioData.duration}`)
     
    // 根据编码确定缓冲区大小
     let bytesPerSample;
    switch (audioFormat.codec) {
        case 'pcm-u8':
            bytesPerSample = 1;
            break;
        case 'pcm-s16':
            bytesPerSample = 2;
            break;
        case 'pcm-s32':
        case 'pcm-f32':
            bytesPerSample = 4;
            break;
        default:
            bytesPerSample = 1; // 默认大小
            break;
    }
    
    //Uint8Array 缓存
    let audioSampleArray = new Uint8Array(numberOfFrames * numberOfChannels * bytesPerSample);

    for (let channel = 0; channel < numberOfChannels; channel++) {
        // each channel: one Plane https://www.w3.org/TR/webcodecs/#enumdef-audiosampleformat
        const planarDataOnPlane = new Float32Array(audioData.allocationSize({planeIndex: channel}) / Float32Array.BYTES_PER_ELEMENT);
        audioData.copyTo(planarDataOnPlane, {planeIndex: channel});
        console.log('原始音频样本:', planarDataOnPlane.slice(0, 10));

        for (let i = 0; i < numberOfFrames; i++) {
            let floatSample  = planarDataOnPlane[i];//[channel * numberOfFrames + i];
            //audioSampleArray[i *numberOfChannels + channel] = convertSample(floatSample);
            let convertedSample = convertSample(floatSample);
            let byteIndex = (i*numberOfChannels+channel)*bytesPerSample;
            if (bytesPerSample === 1) {
                audioSampleArray[byteIndex++] = convertedSample;
            } else if (bytesPerSample === 2) {
                audioSampleArray[byteIndex++] = convertedSample & 0xFF;
                audioSampleArray[byteIndex++] = (convertedSample >> 8) & 0xFF;
            } else if (bytesPerSample === 4) {
                audioSampleArray[byteIndex++] = convertedSample & 0xFF;
                audioSampleArray[byteIndex++] = (convertedSample >> 8) & 0xFF;
                audioSampleArray[byteIndex++] = (convertedSample >> 16) & 0xFF;
                audioSampleArray[byteIndex++] = (convertedSample >> 24) & 0xFF;
            }
        }
    }
    console.log('转换后音频样本:', audioSampleArray.slice(0, 10));

    return audioSampleArray;
}


//f32Array
export function handleAudioRaw (audioData: AudioData, audioFormat: AudioFormat) {
    if (audioData.format !== 'f32-planar'){
        console.log(`![ERROR] unexpected audio raw Data Format: ${audioData.format}`)
        return;// audioData;
    }

    // 选取转换函数
    let convertSample;
    switch (audioFormat.codec) {
        case 'pcm-u8':
            convertSample = floatToUnsignedInt8;
            break;
        case 'pcm-s16':
            convertSample = floatToSignedInt16;
            break;
        //case 'pcm-s24':
        //    convertSample = floatToSignedInt24;
        //    break;
        case 'pcm-s32':
            convertSample = floatToSignedInt32;
            break;
        //直接导出，转换f32-planar为标准的非平面 pcm-f32
        case 'pcm-f32':
            //@ts-ignore
            convertSample = sample => sample;
            break;
        default:
            console.log(`![ERROR] Unsupported codec: ${audioFormat.codec}`);
            return;// audioData;
    }

    // audioData -> specific PCM
    const numberOfFrames = audioData.numberOfFrames;
    const numberOfChannels = audioData.numberOfChannels;
    console.log(`audio type = ${audioData.format}, frames = ${numberOfFrames}, channels = ${numberOfChannels}, duration: ${audioData.duration}`)
    //Float32Array 缓存
    let audioSampleArray = new Float32Array(numberOfFrames * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
        // each channel: one Plane https://www.w3.org/TR/webcodecs/#enumdef-audiosampleformat
        const planarDataOnPlane = new Float32Array(audioData.allocationSize({planeIndex: channel}) / Float32Array.BYTES_PER_ELEMENT);
        audioData.copyTo(planarDataOnPlane, {planeIndex: channel});
        console.log('原始音频样本:', planarDataOnPlane.slice(0, 10));

        for (let i = 0; i < numberOfFrames; i++) {
            let floatSample  = planarDataOnPlane[i];//[channel * numberOfFrames + i];
            audioSampleArray[i *numberOfChannels + channel] = convertSample(floatSample);
        }
    }
    console.log('转换后音频样本:', audioSampleArray.slice(0, 10));

    return audioSampleArray;
}


// 32位浮点数映射到32位整数范围
function floatToSignedInt32 (float32Value:number) {
    return Math.floor(float32Value * 2147483647.0); 
}

/*
// 32位浮点数映射到24位整数范围
function floatToSignedInt24(float32Value:number) {
    let int24Value = Math.floor(float32Value * 8388607.0);
    let byteArray = new Uint8Array(3);
    byteArray[0] = int24Value & 0xFF;
    byteArray[1] = (int24Value >> 8) & 0xFF;
    byteArray[2] = (int24Value >> 16) & 0xFF;
    return byteArray;
}*/

// 32位浮点数映射到16位整数范围
function floatToSignedInt16(float32Value:number) {
    return Math.floor(float32Value * 32767.0);
}

// 32位浮点数映射到24位整数范围
function floatToUnsignedInt8(float32Value:number) {
    return Math.floor((float32Value + 1.0) * 127.5);
}












//参考 https://github.com/2fps/recorder/blob/master/src/transform/transform.ts#L75
/**
 * 
 * @param audioFormat 
 * @param littleEndian 
 * @returns 
 */
export function getEncodeFormat(audioFormat: AudioFormat, littleEndian: boolean = true): ((bytes: Float32Array) => DataView|Float32Array) {
    const bitDepth = audioFormat.bitDepth
    switch(audioFormat.codec){
        case ('pcm-u8'): 
            return (bytes:Float32Array)=> {
                //将比特数（bit）转换为字节数（byte）
                let dataLength = bytes.length * (bitDepth / 8),
                    buffer = new ArrayBuffer(dataLength),
                    data = new DataView(buffer);

                // 写入采样数据
                for (let i = 0; i < bytes.length; i++) {
                    // 范围[-1, 1]
                    let s = Math.max(-1, Math.min(1, bytes[i]));
                    // 8位采样位划分成2^8=256份，它的范围是0-255;
                    // 8位，映射到 [0, 255]
                    let u8Value = Math.floor((s + 1.0) * 127.5);//(s + 1) * 127.5;
                    data.setInt8(i, u8Value);
                }
                return data;
            }
        case ('pcm-s16'): 
            return (bytes:Float32Array)=> {
                let offset = 0,
                    dataLength = bytes.length * (bitDepth / 8),
                    buffer = new ArrayBuffer(dataLength),
                    data = new DataView(buffer);
                // 写入采样数据
                for (let i = 0; i < bytes.length; i++, offset += 2) {
                    let s = Math.max(-1, Math.min(1, bytes[i]));
                    // 16位的划分的是2^16=65536份，范围是-32768到32767
                    // f32数据范围在[-1,1]，换成16位的话，只需对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
                    let int16Value = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    data.setInt16(offset, int16Value, littleEndian);
                }
                return data;
            }
        case ('pcm-s32'):
            return (bytes:Float32Array)=> {
                let offset = 0,
                    dataLength = bytes.length * (bitDepth / 8),
                    buffer = new ArrayBuffer(dataLength),
                    data = new DataView(buffer);
                for (let i = 0; i < bytes.length; i++, offset += 4) {
                    let s = Math.max(-1, Math.min(1, bytes[i]));
                    // 32位的划分的是2^32=4294967296份，范围是-2147483648到2147483647
                    // f32数据范围在[-1,1]，转换成32位整数，可得范围在[-4294967296,2147483647]的数据。
                    let int32Value = s < 0 ? s * 0x80000000 : s * 0x7FFFFFFF;
                    data.setInt32(offset, int32Value, littleEndian);
                }
                return data;
            }
        case ('pcm-f32'):
            return (bytes:Float32Array)=> {
                return bytes;
            }
    }
}









//参考 https://github.com/2fps/recorder/blob/master/src/transform/transform.ts#L75
/**
 * 
 * @param audioFormat 
 * @param littleEndian 
 * @returns 
 */
export function getEncodeFormat(audioFormat: AudioFormat): ((bytes: Float32Array) => Uint8Array|Int16Array|Int32Array|Float32Array) {
    const bitDepth = audioFormat.bitDepth
    switch(audioFormat.codec){
        case ('pcm-u8'): 
            return (bytes:Float32Array)=> {
                //将比特数（bit）转换为字节数（byte）
                let data = new Uint8Array(bytes.length);

                // 写入采样数据
                for (let i = 0; i < bytes.length; i++) {
                    // 范围[-1, 1]
                    let s = Math.max(-1, Math.min(1, bytes[i]));
                    // 8位采样位划分成2^8=256份，它的范围是0-255;
                    // 8位，映射到 [0, 255]
                    data[i] = Math.floor((s + 1.0) * 127.5);//(s + 1) * 127.5;
                }
                return data;
            }
        case ('pcm-s16'): 
            return (bytes:Float32Array)=> {
                let data = new Int16Array(bytes.length);
                // 写入采样数据
                for (let i = 0; i < bytes.length; i++) {
                    let s = Math.max(-1, Math.min(1, bytes[i]));
                    // 16位的划分的是2^16=65536份，范围是-32768到32767
                    // f32数据范围在[-1,1]，换成16位的话，只需对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
                    data[i] = Math.floor(s < 0 ? s * 0x8000 : s * 0x7FFF);                    
                }
                return data;
            }
        case ('pcm-s32'):
            return (bytes:Float32Array)=> {
                let data = new Int32Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) {
                    let s = Math.max(-1, Math.min(1, bytes[i]));
                    // 32位的划分的是2^32=4294967296份，范围是-2147483648到2147483647
                    // f32数据范围在[-1,1]，转换成32位整数，可得范围在[-4294967296,2147483647]的数据。
                    data[i] = Math.floor(s < 0 ? s * 0x80000000 : s * 0x7FFFFFFF);
                }
                return data;
            }
        case ('pcm-f32'):
            return (bytes:Float32Array)=> {
                return bytes;
            }
    }
}












            // 创建一个用于收集音频数据片段的数组
            const drawData = this.onrawdata;
            // 创建一个TransformStream来处理PCM数据并生成WAV格式
            const transformer = new TransformStream({
                async transform(audioData, controller) {

                // 将音频数据片段添加到数组中
                //audioChunks.push(audioData);
                drawData(audioData);
                // 将PCM数据转换为WAV格式
                //const wavData = convertPCMToWAV(pcmData);
            
                // 仅传递音频数据，不做处理
                controller.enqueue(audioData);
                },
            });

            this.audioTrackProcessor.readable
            .pipeThrough(transformer)
            .pipeTo(new WritableStream({
                // 在结束时处理累积的音频数据
                close() {
                  // 将所有音频数据片段合并并转换为WAV格式
                  //const completeAudio = combineAudioChunks(audioChunks);
                  //const wavData = convertChunksToWAV(completeAudio);
                }
              }));
            /*this.audioTrackProcessor.readable.pipeTo(new WritableStream({
                write: this.rawDataToPCM.bind(this)
            }))*/ 