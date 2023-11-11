
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
export const WEB_CODEC_TO_MATROSKA_CODEC: { [key: string]: string } = {
	// .mp3
	'mp3':'A_MPEG/L3',

	// WEBM相关
	'vorbis': 'A_VORBIS',
	'opus': 'A_OPUS',

	// flac
	'flac':'A_FLAC',

	// PCM 编码
	// Matroska 小端格式
	"pcm-u8": "A_PCM/INT/LIT", 
	"pcm-s16": "A_PCM/INT/LIT", 
	"pcm-s24": "A_PCM/INT/LIT", 
	"pcm-s32": "A_PCM/INT/LIT",  
	// Matroska 浮点       
	"pcm-f32": "A_PCM/FLOAT/IEEE",
	// 非线性
	"alaw": "A_MS/ACM",
	"ulaw": "A_MS/ACM",
  
	// AAC 编码
	"mp4a.40.02": "A_AAC/MPEG4/LC",
	"mp4a.40.05": "A_AAC/MPEG4/LC/SBR",
	"mp4a.67": "A_AAC/MPEG2/LC",
}