import {
	ButtonComponent,
    Setting,
} from 'obsidian';

import { RecorderPlusPluginSettingTab } from '../Settings';
import { iconInfo } from 'src/consts';
import { RecorderView } from '../Recorder';
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// Modal Elements//////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
export function createHeading(parent:HTMLElement, level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', text:string, cls?:string):HTMLHeadingElement {
    const divTitle = parent.createDiv("modalHeading");	
    const heading = divTitle.createEl(level,{cls}, (el:HTMLHeadElement)=> {
        el.setText(text);
    });
    return heading;
}


export function createCheckBox(parent:HTMLElement, text:string, defaultChecked: boolean, checkBoxEvent: ()=> void, cls?:string):HTMLElement {
    const checkboxLabel = parent.createEl("label");
    checkboxLabel.addClass('horizontal-align-margin');
    const checkbox = createInput(checkboxLabel, "checkbox");	
    checkbox.checked = defaultChecked;
    checkboxLabel.appendText(text);
    checkbox.addEventListener('change', checkBoxEvent)

    return checkboxLabel;
}


export function createInput(parent: HTMLElement, type: string, width?: string, cls?: string, defaultValue?:string, placeholder?: string): HTMLInputElement {
	const input = parent.createEl("input", { type, cls }, (el) => {
		if (width) {
			el.style.width = width;
		}
		if(defaultValue){
			el.value = defaultValue;
		} else if (placeholder) {
			el.placeholder = placeholder;
		}
	});
	return input;
}


/*export function createOutput(parent: HTMLElement, width?: string, cls?: string): HTMLOutputElement {
	const output = parent.createEl("output", { type:'file', cls }, (el) => {
		if (width) {
			el.style.width = width;
		}
	});
	return output;
}*/

export function createModalButton(parent:HTMLElement, text:string, onClickEvent: EventListener): HTMLButtonElement{
	const button=parent.createEl('button',{text},(el)=>{
		el.onClickEvent(onClickEvent);
	})
	return button;
}

export function createSelect(parent:HTMLElement, options: string[], callback:(buttonTypeSelection:string)=>void, defaultSelection?:string, defaultOptionText?: string): HTMLSelectElement{
	const selectEl = document.createElement('select');
	
	// 添加默认选项
    let index = options.indexOf(defaultSelection);    
	if (defaultSelection && index === -1){                      //非标准选项...
        const defaultSelectionValue = defaultSelection;
		const defaultOption = document.createElement('option');
		defaultOption.textContent = defaultSelectionValue;
		defaultOption.value = defaultSelectionValue;
		defaultOption.selected = true;
		selectEl.appendChild(defaultOption);
	}else if (!defaultSelection && defaultOptionText) {         //无默认选项
		const defaultOption = document.createElement('option');
		defaultOption.textContent = defaultOptionText;
		defaultOption.value = "";
		defaultOption.disabled = true;
		defaultOption.selected = true;
		selectEl.appendChild(defaultOption);
	}

	options.forEach(optionItem =>{
		const optionEl = document.createElement('option');
		optionEl.value= optionItem;
		optionEl.textContent = optionItem;
        if (index > -1 && optionItem === defaultSelection) {    //默认选项
            optionEl.selected = true;
        }
		selectEl.appendChild(optionEl);
	});

    

	selectEl.addEventListener('change',(e)=>{
		const buttonTypeSelection = (e.target as HTMLSelectElement).value;
		callback(buttonTypeSelection);
	});

	parent.appendChild(selectEl);
	return selectEl;
}





////////////////////////////////////////////////////////////////////////////////////////////////
//分组 模板//////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
export function confirmDiv(parent: HTMLElement, confirmText: string, onConfirmcallback:()=>void, highlightConfirmButton?:boolean, confirmButtonText?:string, hasHeading?:boolean){
    const divConfirm = parent.createDiv();
	if(hasHeading){
        createHeading(divConfirm, 'h3', "WARNING!", 'flexbox-right-align' );
    }

	const divA = divConfirm.createDiv();
	const noteInputPath=divA.createEl('p', "modalPart remark-text flexbox-right-align");
	noteInputPath.textContent =	confirmText;

	const divB = divConfirm.createDiv('flexbox-right-align');
    const buttonConfirmWrap = new ButtonComponent(divB)
    buttonConfirmWrap.buttonEl.appendText(confirmButtonText?confirmButtonText:'Confirm')
    buttonConfirmWrap.onClick(()=>{			
        onConfirmcallback();
    });

    const buttonCancelWrap = new ButtonComponent(divB)
    buttonCancelWrap.buttonEl.appendText('Cancel')
    buttonCancelWrap.onClick(()=>{			
        divConfirm.hide();
    });

    //highlight
    if(highlightConfirmButton){
        buttonCancelWrap.setCta();
    } else {
        buttonCancelWrap.setCta();
    }

	/*
    const buttonConfirm = createModalButton(
		divB, 
		confirmButtonText?confirmButtonText:'Confirm', 
		()=>{			
			onConfirmcallback();
		})
    const buttonCancel = createModalButton(
		divB, 
		'Cancel', 
		()=>{				
			divConfirm.hide();
		}
	)	*/
    return divConfirm;
}



////////////////////////////////////////////////////////////////////////////////////////////////
//UI for Recorder View//////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

export class RecorderViewContentTab {
	navBar: HTMLDivElement;
	navBarButton: HTMLButtonElement;
	contentEl: HTMLDivElement;
	selectedTab:string;
	tabName:string;
	constructor(
		navBar: HTMLDivElement,
		parent: HTMLDivElement,
		tabName: string, 
		selectedTab: string,
	){
		this.selectedTab = selectedTab;
		this.tabName = tabName;
		this.navBar = navBar;

		this.navBarButton.onclick=this.navBarButtonOnClick;
		this.contentEl = parent.createEl(
			'div',
			{
				cls:'recorder-plus-tab', 
				attr:{
					id:tabName,
				} 
			});
		this.contentEl.style.display = 'none';
	}

	//contents

	navBarButtonOnClick(){
		if(this.selectedTab === this.tabName){
			return;
		} else {
			
		}
	}
}

export function createNavBar(view: RecorderView){
	const navBar = view.navBar;
	for(const tabName in iconInfo){
		const navBarButton = navBar.createEl(
			'button', 
			{
				cls:'recorder-plus__nav-button',
				text: tabName,
			}
		);
		navBarButton.id = tabName;
		navBarButton.onclick=() => updateView(view, tabName);
		if(tabName === view.selectedTab){
			navBarButton.addClass('recorder-plus__selected-button')
		}
	}
	updateView(view, view.selectedTab);
}

export function updateView(view: RecorderView, clickedName: string){
	
	if(view.selectedTab === clickedName){
		view.lastSelectedTab = view.selectedTab;		
		return;
	} else {
		//lastselection
		view.lastSelectedTab = view.selectedTab;
		view.selectedTab = clickedName;
		const lastButton = view.navBar.querySelector(`#${view.lastSelectedTab}`);			
		lastButton.removeClass('recorder-plus__selected-button');
		const lastTab = view.contentEl.querySelector(`#${view.lastSelectedTab}`);
		lastTab.addClass('recorder-plus__hidden');
		//console.log(`current:${clickedName}, last: ${lastTab.id}, last.class: ${lastTab.className}`);
		//console.log(`lastSelectedTab:${view.lastSelectedTab}`);

		const currentButton = view.navBar.querySelector(`#${clickedName}`);
		currentButton.addClass('recorder-plus__selected-button');
		const currentContent = view.contentEl.querySelector(`#${clickedName}`);
		currentContent.removeClass('recorder-plus__hidden');//recorder-plus__selected-tab
	}
}