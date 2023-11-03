
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


export const HOST = '127.0.0.1'
export const LOCAL_MEDIA_ROUTE = 'localmedia'

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



export enum recorderState {
    undefined = '0',
    inactive = 'inactive',
    paused = 'paused',
    recording = 'recording',
}