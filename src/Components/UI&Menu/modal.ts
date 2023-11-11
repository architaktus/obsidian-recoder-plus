
import { ButtonComponent,Editor, Modal, Notice, } from 'obsidian';
import * as ui from './uiWidgets';
import RecorderPlusPlugin from 'src/main';


///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// open a window after record//////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
export class AfterRecordModal extends Modal {
	plugin: RecorderPlusPlugin;
	saveFileCallBack:(e:Event)=>void;
	copylinkCallBack:()=>void;
	deleteCallBack: ()=>void;
	saveSuccess:boolean;
	constructor(
		plugin: RecorderPlusPlugin,
		saveSuccess: boolean,
		saveFileCallBack:(e:Event)=>void,
		copylinkCallBack?:()=>void,
		deleteCallBack?:()=>void,
	){
		super(plugin.app);
		this.plugin = plugin;
		this.saveFileCallBack= saveFileCallBack;
		this.copylinkCallBack = copylinkCallBack;
		this.deleteCallBack = deleteCallBack;
		this.saveSuccess = saveSuccess;
	}
	onOpen() {
		this.createModalUI();
	}

	onClose() {
		const { modalEl } = this;
		modalEl.empty();
	}

	createModalUI(){
		const { modalEl, contentEl } = this;		
		modalEl.append(contentEl);

		//Title
		ui.createHeading(contentEl, 'h2', 'Recording File is Backed!' );
		const divA = contentEl.createDiv();
		const note=divA.createEl('p', "modalPart remark-text");
			if (this.saveSuccess){
				note.textContent =	'Recording saved in Vault. Next?';
			} else {
				note.textContent =	'Recording CANNOT be saved in Vault. Next?';
			}
			
		//confirm part
		const divC = contentEl.createDiv('flexbox-right-align');		
			//another direct part
			if (this.saveSuccess){
				const butonDelete = new ButtonComponent(divC);
				butonDelete.buttonEl.appendText('delete this Recording');
				butonDelete.onClick((e)=>{
					new ConfirmModal(
						this.plugin, 
						"Recording will be delete and CANNOT be recovered! Are you sure?",
						()=>{
							this.deleteCallBack();
							this.close();
						},
						undefined, 'delete', false, false
					).open();
				})
			}
			


			const buttonDownloadLink = new ButtonComponent(divC);
			if (this.saveSuccess){
				buttonDownloadLink.buttonEl.appendText('save to another place');
			} else {
				buttonDownloadLink.buttonEl.appendText('Try with different directory');
			}
			buttonDownloadLink.setCta();
			buttonDownloadLink.onClick((e)=>{
				this.saveFileCallBack(e);
			});

			if (this.saveSuccess){
				const buttonConfirmWrap = new ButtonComponent(divC);
				buttonConfirmWrap.buttonEl.appendText('copy a wiki link')
				buttonConfirmWrap.setCta();
				buttonConfirmWrap.onClick(async ()=>{
					this.copylinkCallBack();
					this.close();
				});
			}

			/*const buttonCopy = new ButtonComponent(divC)   
			buttonCopy.buttonEl.appendText('copy audio file into clipboard')
			buttonCopy.onClick(async ()=>{
				this.copyCallBack();
				this.close();
			});*/

			//buttonConfirmWrap.setCta();
			const buttonCancelWrap = new ButtonComponent(divC)
			buttonCancelWrap.buttonEl.appendText('cancel')
			buttonCancelWrap.onClick(()=>{	
				if (this.saveSuccess){
					this.close();
				} else {
					new ConfirmModal(
						this.plugin, 
						"your Recording will be LOST! Are you sure?",
						()=>{this.close()},
						undefined, 'Let it go', false, false
					).open();
				}
			});		
	}
}



///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// open a window to choose local file//////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
export class ConfirmModal extends Modal {
	plugin: RecorderPlusPlugin;
	confirmTitle:string;
	confirmCallBack:()=>void;
	confirmText:string='';
	confirmButtonText:string;
	highlightConfirmButton?: boolean=false;
	openSettingTab:boolean=false;
	constructor(
		plugin: RecorderPlusPlugin,
		confirmTitle:string,
		confirmCallBack:()=>void,
		confirmText?:string,
		confirmButtonText?:string,
		highlightConfirmButton?:boolean,
		openSettingTab?:boolean,
	){
		super(plugin.app);
		this.plugin = plugin;
		this.confirmTitle = confirmTitle;
		this.confirmText = confirmText;
		this.confirmButtonText = confirmButtonText;
		this.highlightConfirmButton = highlightConfirmButton;
		this.openSettingTab = openSettingTab;
		this.confirmCallBack = confirmCallBack;
	}
	onOpen() {
		this.createModalUI();
	}

	onClose() {
		const { modalEl } = this;
		modalEl.empty();
	}

	createModalUI(){
		const { modalEl, contentEl } = this;		
		modalEl.append(contentEl);
		//Title
		ui.createHeading(contentEl, 'h2', this.confirmTitle );
		const divA = contentEl.createDiv();
		const noteInputPath=divA.createEl('p', "modalPart remark-text");
			noteInputPath.textContent =	this.confirmText;
		//confirm part
		const divB = contentEl.createDiv('flexbox-right-align');
		
			if(this.openSettingTab){
				const buttonSettingTab = new ButtonComponent(divB)   
				buttonSettingTab.buttonEl.appendText('Open SettingTab')
				buttonSettingTab.onClick(()=>{
					this.plugin.app.setting.open();
					this.plugin.app.setting.openTabById("obsidian-media-timestamp");
					this.close();
				});
			}
			
			const buttonConfirmWrap = new ButtonComponent(divB)   
			buttonConfirmWrap.buttonEl.appendText(this.confirmButtonText?this.confirmButtonText:'Comfirm')
			buttonConfirmWrap.onClick(async ()=>{
				this.confirmCallBack();
				this.close();
			});

			const buttonCancelWrap = new ButtonComponent(divB)
			buttonCancelWrap.buttonEl.appendText('Cancel')
			buttonCancelWrap.onClick(()=>{			
				this.close();
			});

			//highlight
			if(this.highlightConfirmButton){
				buttonConfirmWrap.setCta();
			} else {
				buttonCancelWrap.setCta();
			}		
		
	}
}