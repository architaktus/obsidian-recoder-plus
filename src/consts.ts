import { createFormatToCodecMap } from "./Components/utils";

export const RECORDER_VIEW = "recorder-plus-view";
///////////////////////////////////////////////////////////////////////////////////////////////
//Time & Size /////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
export const SUCCESS_NOTICE_TIMEOUT = 1800;

//Debounce Time
export const DEBOUNCE_TIME = 1000;
export const DEBOUNCE_TIME_SHORT = 100;

// Replay Cache size
export const URL_CACHE_MAP_SIZE = 20;

//steaming size
export const CHUNK_SIZE = 10 ** 6 * 4; // 4MB

//Recorder timeslice
export const RECORDER_TIMESCLICE = 1000; //1s

///////////////////////////////////////////////////////////////////////////////////////////////
//Other ///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
export const ERRORS: { [key: string]: string } = {
	"INVALID_URL": "[!error] Invalid Video URL\n\nThe highlighted link is not a valid video url. Please try again with a valid link.",
	"NO_ACTIVE_VIDEO": "[!caution] Select Video!\n\nA video needs to be opened before using this hotkey.\n\nHighlight your video link and input your 'Open video player' hotkey to register a video.",
	"Streaming_Error": "[!error] Streaming Error"
}

// Icons
export const iconA = "chevron-right-square";
export const iconSetting = "chevron-right-square";
//SVG
export enum iconInfo {
	"General"="General",
	"Advance"="Advance",
	"Viewer"="Viewer"
}



//https://en.wikipedia.org/wiki/Audio_file_format
export const AUDIO_EXTENSIONS = [
	//'3gp', 
	'aac', 
	'aa', 
	'aax', 
	'ape', 
	'flac', 
	'm4a', 
	'mp3', 
	'ogg', 'oga','mogg',
	'ra',//'rm',
	'wav',
	'wma',
	'wv',
	//'webm',
];

export const VIDEO_EXTENSIONS = [
	'3gp', '3g2', 
	'avi', 
	'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'm2v', 'm4v',
	//'viv', 
	'rmvb', 
	'rm', 
	'mov','qt', 
	'mp4', 
	'mts', 'm2ts','ts',
	//'gif',
	'vob',
	'flv',
	'mkv',
	'webm',
];


/**
 *  closed, 0
 *  suspend, 1
 *  running, 2
 */
export enum recorderState {
    closed,
    suspend,
    running,
}
/**
 * old 
 * 	undefined, 0
    inactive, 1
    paused, 2
    recording, 3
 * 
 */

// ReadonlyMap 确保映射不会被修改
/*export const WEB_CODEC_TO_MATROSKA_CODEC: ReadonlyMap<string, string> = new Map([
	// .mp3
	['mp3','A_MPEG/L3'],

	// WEBM相关
	['vorbis','A_VORBIS'],
	['opus','A_OPUS'],

	// flac
	['flac','A_FLAC'],

	// PCM 编码
	// Matroska 小端格式
	["pcm-u8", "A_PCM/INT/LIT"], 
	["pcm-s16", "A_PCM/INT/LIT"], 
	["pcm-s24", "A_PCM/INT/LIT"], 
	["pcm-s32", "A_PCM/INT/LIT"],  
	// Matroska 浮点       
	["pcm-f32", "A_PCM/FLOAT/IEEE"],
	// 非线性
	["alaw", "A_MS/ACM"],
	["ulaw", "A_MS/ACM"],
  
	// AAC 编码
	["mp4a.40.02", "A_AAC/MPEG4/LC"],
	["mp4a.40.05", "A_AAC/MPEG4/LC/SBR"],
	["mp4a.67", "A_AAC/MPEG2/LC"],
]);*/


export const WEB_CODEC_TO_CODEC_INFO: { 
	[key: string]: {
		description: string,
		matroskaCodec: string,
		supportFormat: string[],
	} 
} = {
	// .mp3
	'mp3':{
		description: 'mp3',
		matroskaCodec: 'A_MPEG/L3',
		supportFormat: ['mp3', 'mkv'],
	},

	// WEBM相关
	'vorbis': {
		description: 'vorbis',
		matroskaCodec: 'A_VORBIS',
		supportFormat: ['webm', 'mkv'],//'ogg',
	},

	'opus': {
		description: 'opus',
		matroskaCodec: 'A_OPUS',
		supportFormat: ['webm', 'mkv'],//'opus',
	},

	// flac
	'flac':{
		description: 'flac无损压缩',
		matroskaCodec: 'A_FLAC',
		supportFormat: ['flac', 'mkv'],//'opus',
	},

	// PCM 编码
	// Matroska 小端格式
	"pcm-u8": {
		description: 'pcm 8位 编码',
		matroskaCodec: 'A_PCM/INT/LIT',
		supportFormat: ['wav', 'mkv'],
	},
	"pcm-s16": {
		description: 'pcm 16位 整数编码',
		matroskaCodec: 'A_PCM/INT/LIT',
		supportFormat: ['wav', 'mkv'],
	},
	"pcm-s24": {
		description: 'pcm 24位 整数编码',
		matroskaCodec: 'A_PCM/INT/LIT',
		supportFormat: ['wav', 'mkv'],
	},
	"pcm-s32": {
		description: 'pcm 32位 整数编码',
		matroskaCodec: 'A_PCM/INT/LIT',
		supportFormat: ['wav', 'mkv'],
	},
	// Matroska 浮点       
	"pcm-f32": {
		description: 'pcm 32位 浮点编码',
		matroskaCodec: 'A_PCM/FLOAT/IEEE',
		supportFormat: ['wav', 'mkv'],
	},
	// 非线性
	"alaw": {
		description: '',
		matroskaCodec: 'A_MS/ACM',
		supportFormat: ['wav', 'mkv'],
	},
	"ulaw": {
		description: '',
		matroskaCodec: 'A_MS/ACM',
		supportFormat: ['wav', 'mkv'],
	},
  
	// AAC 编码
	"mp4a.40.02": {
		description: '',
		matroskaCodec: 'A_AAC/MPEG4/LC',
		supportFormat: ['m4a', 'mkv'],
	},
	"mp4a.40.05": {
		description: '',
		matroskaCodec: 'A_AAC/MPEG4/LC/SBR',
		supportFormat: ['m4a', 'mkv'],
	},
	"mp4a.67": {
		description: '',
		matroskaCodec: 'A_AAC/MPEG2/LC',
		supportFormat: ['m4a', 'mkv'],
	},
}

//format -> WebCodec (i.e. 'm4a' -> 'mp4a.40.02', 'mp4a.40.05', ...)
export const FORMAT_TO_WEB_CODEC_MAP = createFormatToCodecMap(WEB_CODEC_TO_CODEC_INFO);




/**
 * streamOptions - audioBitsPerSecond
 */
export const AUDIO_BITS_PER_SECOND = new Map<string,number>([
    ['kbps 64', 64000],
    ['kbps 128', 128000],
    ['kbps 192', 192000],
    ['kbps 320', 320000],
    ['kbps 512', 512000],
    ['kbps 1411', 1411000]
]);



export const AUDIO_SAMPLE_RATE = new Map<string,number>([
    ['44.1 kHz', 44100],
    ['48 kHz', 48000],
]);

