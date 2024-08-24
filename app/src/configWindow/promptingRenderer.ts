import { ipcMain, ipcRenderer } from "electron";
import { Config } from "../shared/Config";
import fs from 'fs';
import path from 'path';

let mainPromptText: HTMLTextAreaElement = document.querySelector("#main-prompt")!;
let summarizePromptText: HTMLTextAreaElement = document.querySelector("#summarize-prompt")!;
let nsfwPromptText: HTMLTextAreaElement = document.querySelector("#nsfw-prompt")!;
let jailbreakPromptText: HTMLTextAreaElement = document.querySelector("#jailbreak-prompt")!;

let nsfwCheckbox: HTMLInputElement = document.querySelector("#nsfw-checkbox")!;
let jailbreakCheckbox: HTMLInputElement = document.querySelector("#jailbreak-checkbox")!;

let descScriptSelect: any = document.querySelector("#description-script-select")!;
let exMessagesScriptSelect: any = document.querySelector("#example-messages-script-select")!;

let scriptSelectorsDiv: HTMLDivElement = document.querySelector("#script-selectors")!;

//init

let config = new Config();

mainPromptText.value = config.mainPrompt;
summarizePromptText.value = config.summarizePrompt;
nsfwPromptText.value = config.nsfwPrompt;
jailbreakPromptText.value = config.jailbreakPrompt;

nsfwCheckbox.checked = config.nsfwPromptEnable;
jailbreakCheckbox.checked = config.jailbreakPromptEnable;

populateSelectWithFileNames(descScriptSelect, './custom/scripts/description', '.js');
descScriptSelect.value = config.selectedDescScript;

populateSelectWithFileNames(exMessagesScriptSelect, './custom/scripts/example messages', '.js');
exMessagesScriptSelect.value = config.selectedExMsgScript;

togglePrompt(nsfwCheckbox, nsfwPromptText);
togglePrompt(jailbreakCheckbox, jailbreakPromptText);

//events

descScriptSelect.addEventListener('change', () =>{

    ipcRenderer.send('config-change', "selectedDescScript", descScriptSelect.value);
})

exMessagesScriptSelect.addEventListener('change', () =>{

    ipcRenderer.send('config-change', "selectedExMsgScript", exMessagesScriptSelect.value);
})

nsfwCheckbox.addEventListener('change', () =>{
    togglePrompt(nsfwCheckbox, nsfwPromptText);
})

jailbreakCheckbox.addEventListener('change', () =>{
    togglePrompt(jailbreakCheckbox, jailbreakPromptText);
})

//functions

function togglePrompt(checkbox: HTMLInputElement, textarea: HTMLTextAreaElement){
    if(checkbox.checked){
        textarea.style.opacity = "1";
        textarea.disabled = false;
    }
    else{
        textarea.style.opacity = "0.5";
        textarea.disabled = true;
    }
}

function populateSelectWithFileNames(selectElement: HTMLSelectElement, folderPath: string, fileExtension: string, ): void {
    let files = fs.readdirSync(folderPath).filter(file => path.extname(file) === fileExtension);

    for(const file of files) {
        var el = document.createElement("option");
        el.textContent = path.parse(file).name;
        el.value = file;
        selectElement.appendChild(el);
    }

}