import { 
	App, 	
	ButtonComponent, 	
	PluginSettingTab,
	Setting, 
} from 'obsidian';
import { __extends } from 'tslib';
import TimestampPlugin from '../main';



export interface pluginSettings {
	chosenFolderPathForRecordingFile: string;
	recordingFileNamePrefix:string;
	recordingFileNameDateFormat:string;
}


export class TimestampPluginSettingTab extends PluginSettingTab {
	plugin: TimestampPlugin;

	constructor(app: App, plugin: TimestampPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.containerEl.addClass("settings")
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		//recorder//////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////
		//Grouper
		const recorderDiv = createSettingGroup(
			this,
			'Recorder Config',
			"Settings for audio recorder",
			false,
			true
		)

		// Customize save path
		const setting = new Setting(recorderDiv);
		setting.setName('Save Recording To')
		setting.setDesc('Path for recorder file')
		setting.addText((text) => {
			text.setPlaceholder(this.plugin.settings.chosenFolderPathForRecordingFile)
			text.setValue(this.plugin.settings.chosenFolderPathForRecordingFile)
			.onChange(async (value) => {
				this.plugin.settings.chosenFolderPathForRecordingFile = value;
				await  this.plugin.saveSettings();			  
			});
        });


		
		//TODO: recorder record quality

		//TODORecording file name template

		//TODO: bug report/plugin github link with details
		containerEl.createEl("a", {
			href: "https://github.com/architaktus/ObsidianTimestampNotes",
			text: "Plugin GitHub Link: Obsidian Media Timestamp",
			});
	}
}












function createSettingGroup(
    settingTab: TimestampPluginSettingTab,
    title: string, 
    desc?: string, 
    withButton?: boolean, 
    initShow?: boolean
): HTMLDivElement {
    const group = settingTab.containerEl.createEl('div'); //大组div
        const groupHeaderContainer = group.createEl("div", { cls: "header-container" });//大组的抬头
        const groupHeader = groupHeaderContainer.createEl("div", { cls: "text-container" }); //标题模块

            groupHeader.createEl('h4', { text: title, cls: "section-header" }); //标题部分
            if (desc) groupHeader.createEl('div', { text: desc, cls: "setting-item-description" }); //标题说明

        const settingsContainer = group.createEl("div"); //大组的内容container
        group.createEl('br');

    if (withButton) { //下拉按钮
        const ButtonContainer = groupHeaderContainer.createEl("div", { cls: "setting-item-control" });//Button to show/hide group Inhalt
        const groupButton = new ButtonComponent(ButtonContainer);
            //groupButton.setButtonText(desc);
            groupButton.buttonEl.addClass("setting-item-control");
            //大组内容初始值
            if (initShow) {
                settingsContainer.show(); 
            }else {
                settingsContainer.hide();
            }
            groupButton.setCta();
            groupButton.setIcon("chevrons-up-down");

        const toggleState = () => {
            if (settingsContainer.isShown()) {
                settingsContainer.hide();
                groupButton.setIcon("chevrons-up-down");
                groupButton.setCta();
            } else {
                settingsContainer.show();
                groupButton.setIcon("chevrons-down-up");
                groupButton.removeCta();
            }
        }
        groupButton.onClick(() => toggleState());
    }


    return settingsContainer
}