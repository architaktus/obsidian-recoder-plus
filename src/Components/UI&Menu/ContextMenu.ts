import { 
    MarkdownView,
    Menu,
    MenuItem,
    Notice,
    Platform,
    View, 
 } from "obsidian";

import TimestampPlugin from "../../main";

import { onElement,} from '../EventListener';
import * as consts from '../../consts';
import * as utils from "../utils";
import { buttonTextConverter, parseButtonText, parseButtonTextFromEmbed, replaceMediaElement } from "../ButtonRender/ButtonTools";
import { PromptModal } from "./modal";
import { buttonToken, textToken, EditorInternal } from "../../interface";

/*export function registerOnPaneMenu() {            
        // Save the original method        
        VideoView.prototype.onPaneMenu = (menu:Menu, ...args:unknown[]) => {
            addMenuItem(
                menu, 
                () => {
                plugin.app.setting.openTabById("obsidian-timestamp");
                },
                'Open Settings',
                consts.iconSetting
            );
        }

        const originalMethod = VideoView.prototype.onPaneMenu;
        VideoView.prototype.onPaneMenu = (menu:Menu, ...args:unknown[]) => {
            addMenuItem(
                menu, 
                () => {
                this.app.setting.openTabById("obsidian-timestamp");
                },
                'Open Settings',
                consts.iconSetting
            );
            
            return originalMethod.call(this, menu, ...args);
            }

        this.register(() => {
            VideoView.prototype.onPaneMenu = originalMethod;
        });
    }*/





/**
 * For register right click menu on editor/当前页面的右键菜单
 */
export function registerContextMenu(plugin:TimestampPlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on('editor-menu', (menu: Menu, editor: EditorInternal, view: MarkdownView) => {
            if (!editor) {return;}
            let textToken: textToken;
            let buttonToken:buttonToken={
                link:'',
                timeInfo:{},
                buttonType: 'callout'
            };
            let targetText = editor.getSelection();
            // Case 1: No Selection -> get Link unter Cursor
            if (targetText.length === 0) { 
                textToken = editor.getClickableTokenAt(editor.getCursor());
                if (!textToken){return;} 
                // external-link: "[](...)"
                else if (textToken && textToken.type === "external-link") {
                    targetText = textToken.text;
                    plugin.settings.debug ? console.log("TimestampPlugin->Listener->ContextMenu->Case 1->token:" + targetText): null;
                }
            } 
            // Case 2: with Selection -> convert Content (should be exactly a Link)
            else {                 
                plugin.settings.debug ? console.log("TimestampPlugin->Listener->ContextMenu->Case 2->Selection:" + targetText): null;
                buttonToken.link = targetText.trim() ;
                buttonToken.buttonTitle = '';
            }              
            const nonProtocolPart = utils.splitUrl(targetText).nonProtocolPart;
            const protocolPart = utils.splitUrl(targetText).protocolPart;
            
            //文件路径则送入原文
            if (!protocolPart || protocolPart === 'file'){
                buttonToken = utils.handleLinkofFileType(buttonToken, targetText);
            }            
            //app路径则正则筛选->文件路径
            else if (protocolPart === 'app'){
                buttonToken = utils.handleLinkofAppType(buttonToken, nonProtocolPart);
            }
            //内部路径的外部链接形式 (不排除把路径复制出来的情况...)
            else if (protocolPart === 'obsidian'){
                buttonToken = utils.handleLinkofObsidianType(plugin, buttonToken, nonProtocolPart);
            }
            //网络路径
            else {
                buttonToken.link = targetText.trim(); 
            }  
            buttonToken.noteTitle = plugin.settings.noteTitle;
            const itemText = buttonTextConverter(plugin, buttonToken)
                menu.addItem((item) => {
                    item.setIcon(consts.iconA)//'open'
                        .setTitle('Timestamp: play in Viewer')
                        .onClick(() => {
                            utils.activateView(plugin,buttonToken);
                        })
                }).addItem((item) => {
                    item.setIcon(consts.iconA)
                        .setTitle('Timestamp: convert Link into Button (Callout)')
                        .onClick(() => {
                            // @ts-ignore
                            //window.open(token.text, '_blank', 'external')			
                                if (targetText){
                                    editor.replaceSelection(itemText)
                                } else{
                                    textToken.start.line = textToken.start.line + 1;
                                    textToken.start.ch = 0;
                                    editor.replaceRange(itemText,textToken.start)//,undefined,textToken.text)
                                }								
                        })
                }).addItem((item) => {
                  item.setIcon(consts.iconA)
                      .setTitle('Convert into Button ephemerally')
                      .onClick(async() => {
                        replaceMediaElement(plugin, undefined, buttonToken);
                      })
              });    
        })
    )
}










///////////////////////////////////////////////////////////////////////////////////////////////
//Event Listener: registerDocument//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////	
//from copy image and url context menu

/**
 * 
 * @param plugin for element right click kontext menu
 * @param document 
 */
export function registerDocument(plugin:TimestampPlugin, document: Document) {
    plugin.register(
        onElement(
            document,
            "contextmenu" as keyof HTMLElementEventMap,
            "button.media-timestamp-button", 
            onClickButton.bind(plugin) //Listener
        )
    )

    plugin.register(
        onElement(
            document,
            "contextmenu" as keyof HTMLElementEventMap, //Event
            "video, audio, a.external-link, img", //, .callout
                /*selector //cm-hmd-embed cm-hmd-internal-link （.cm-url, .cm-underline, .cm-url.cm-underline, .cm-hmd-embed, .cm-hmd-internal-link, a.external-link）
                    onClik 只能对img audio video button等对象起作用
                */
            onRightClick.bind(plugin) //Listener
        )
    )

    /*plugin.register(
        onElement(
            document,
            "contextmenu" as keyof HTMLElementEventMap, //Event
            "video, audio, a.external-link", 
                //selector //cm-hmd-embed cm-hmd-internal-link （.cm-url, .cm-underline, .cm-url.cm-underline, .cm-hmd-embed, .cm-hmd-internal-link, a.external-link）
                //似乎对这些都不起作用
            plugin.lastHoveredLink.bind(plugin) //Listener
        )
    )*/
        
    if (Platform.isDesktop) {							/////////////////////电脑	
     /* plugin.register(
        onElement(
          document,
          "mouseover" as keyof HTMLElementEventMap,
          ".cm-link, .cm-hmd-internal-link",
          plugin.storeLastHoveredLinkInEditor.bind(plugin)
        )
      );

      plugin.register(
        onElement(
          document,
          "mouseover" as keyof HTMLElementEventMap,
          "a.internal-link",
          plugin.storeLastHoveredLinkInPreview.bind(plugin)
        )
      );*/
    } /*else {										/////////////////////手机平板等
      plugin.register(
        onElement(
          document,
          "touchstart" as keyof HTMLElementEventMap,
          "img",
          plugin.startWaitingForLongTap.bind(plugin)
        )
      );

      plugin.register(
        onElement(
          document,
          "touchend" as keyof HTMLElementEventMap,
          "img",
          plugin.stopWaitingForLongTap.bind(plugin)
        )
      );

      plugin.register(
        onElement(
          document,
          "touchmove" as keyof HTMLElementEventMap,
          "img",
          plugin.stopWaitingForLongTap.bind(plugin)
        )
      );
    }*/
    function onRightClick(event: MouseEvent) {		
        event.preventDefault();       
        makeContextMenuForEl(plugin, event); 	
    }
    function onClickButton(event: MouseEvent) {		
      event.preventDefault();      
      makeButtonContextMenu(plugin, event); 	
  }
}


























export function addMenuItem(menu: Menu, event: ()=>void, title:string, icon?:string){
    menu.addItem((item:MenuItem)=> item
    .setIcon(icon?icon:undefined)
    .setTitle(title)
    .onClick(event)
  );
}



/* onClick可能的内容
	async () => {
	try {
		const button = document.createElement("button");
		button.innerText = medianame;
		let blob: Blob;
		if (mediaType === "audio"){
			blob = await loadVideoBlob(mediaSrc);								
		}else if (mediaType === "video")
		{
			blob = await loadVideoBlob(mediaSrc);
		} else {
			new Notice("Error getting Blob");
		}
		button.addEventListener("click", () => {

			this.activateView(URL.createObjectURL(blob), this.editor);
		});									
		new Notice("Success");
	} catch {
		new Notice("Error, could not create Button!");
	}
	}*/






export function registerEscapeButton(menu: Menu, event: keyof HTMLElementEventMap, document: Document = activeDocument) {
	menu.register(
		onElement(
      document,
      event,
      "*",
      (e: KeyboardEvent) => {
        if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        menu.hide();
        }}
		)
	);
	}




















  /**
 * right click on Element (video/audio/..) --> SHOULD ONLY have a type (app://) and must be playable as it shows
 * @param plugin 
 * @param target 
 * @param menu 
 * @param event 
 */
export function makeContextMenuForEl (plugin:TimestampPlugin, event: MouseEvent){
    const menu = new Menu();
    const target = (event.target as HTMLElement);
    const mediaType = target.localName; //HTML元素 span/ img/ a/ video/ audio		
	plugin.settings.debug ? console.log("TimestampPlugin->Listener->Document->Click Event->Contextmenu->onClick->mediaType:" + mediaType): null;    
    
    //Menu item 1
    const menuTitleItemReplace = "Convert into Button ephemerally";    
    addMenuItem(
        menu, 
        async() => replaceMediaElement(plugin, target), 
        menuTitleItemReplace, 
        consts.iconA
    );         
        
    //Menu item 2
    //ButtonToken
    let buttonToken:buttonToken={
        link:'',
        timeInfo:{},
        buttonType: 'callout'        
        };
    buttonToken = parseButtonTextFromEmbed(target, buttonToken);
    buttonToken.noteTitle = plugin.settings.noteTitle;
    let itemText = '';      
    
    

    const menuTitleItemCopy = "Convert into Button & Copy";
    menu.addItem((item:MenuItem)=> {
        const childMenu = item
            .setIcon(consts.iconA)
            .setTitle(menuTitleItemCopy)
            .setSubmenu()   
        consts.BUTTON_TYPE_OPTIONS.forEach((buttonType)=>{
            buttonToken.buttonType = buttonType;
            itemText = buttonTextConverter(plugin, buttonToken);
            const menuTitleCallout = `Turn into a Button (${buttonType})`;         
            addMenuItem(
                childMenu, 
                async() => utils.CopyToClipboard(itemText), 
                menuTitleCallout, 
                //consts.iconA
            )
        })
    });
    plugin.settings.debug ? console.log("TimestampPlugin->Listener->Document->Click Event->Contextmenu->onClick->itemText:" + itemText): null;
    
    //menu.addSeparator;
    registerEscapeButton(menu, "keydown" as keyof HTMLElementEventMap);
    menu.showAtPosition({ x: event.pageX, y: event.pageY });
    //plugin.app.workspace.trigger("timestamp-plugin:contextmenu", menu); //自定义事件,TODO 停止视频？
}














/**
 * on right click "edit button"
 * @param plugin 
 * @param event 
 * @param buttonToken 
 */
export function makeButtonContextMenu(plugin: TimestampPlugin, event: MouseEvent, buttonToken?: buttonToken){
  const menu = new Menu();
  const target = (event.target as HTMLElement);
  target.innerText
  let buttonTokenParsed:buttonToken={
    link:'',
    timeInfo:{},
		buttonType: 'callout',
	};
  if(buttonToken){
    buttonTokenParsed = buttonToken;
  }else{
    const buttonTokenArray = parseButtonText(plugin, target.title, plugin.settings.buttonRules, 'callout'); 
    if (buttonTokenArray.length > 0){
      buttonTokenParsed = buttonTokenArray[0];
    };
    //TODO 合并各处buttonsettings不同的名字； 2.此处目前存在没法确定是什么buttonType的问题
  }
  //console.log('*********************************'+buttonTokenParsed.totalText)

  
  //Menu Item
    //edit
    addMenuItem(
      menu, 
      async() => {
        new PromptModal(plugin, plugin.editor, 'config-button', utils.activateView.bind(this), buttonTokenParsed, target).open();
      },
      'edit button',
      consts.iconA
    );
    
    //delete TODO:删除前提示

    //copy
    if (buttonTokenParsed.link){
      addMenuItem(
        menu, 
        async() => {
          utils.CopyToClipboard(buttonTokenParsed.link);
        },
        'copy link',
        consts.iconA
      );
    }
    addMenuItem( //TODO 问题同上，目前无法确定buttonType
      menu, 
      async() => {
        utils.CopyToClipboard(buttonTokenParsed.totalText);
      },
      'copy this timestamp',
      consts.iconA
    );


  registerEscapeButton(menu, "keydown" as keyof HTMLElementEventMap);
  menu.showAtPosition({ x: event.pageX, y: event.pageY });
  //plugin.app.workspace.trigger("timestamp-plugin:contextmenu", menu); //自定义事件,TODO 停止视频？
}


