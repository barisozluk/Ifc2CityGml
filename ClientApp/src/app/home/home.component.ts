import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { State, Viewer } from '@dangl/xbim-viewer';
import { TreeviewItem } from 'ngx-treeview';
import { InformationLogModal } from '../information-log-modal/information-log-modal';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    @ViewChild("informationlogmodal") informationlogmodal: InformationLogModal;

    constructor(private http: HttpClient) {}

    isCollapsed: boolean = true;
    iconCollapse = "'fa', 'minus'";

    showFileUploadComponent: boolean = false;

    private viewer: Viewer;
    loadingFile: boolean = false;
    loadComplete: boolean = false;
    progress: number = 0;
    ifcFile: File = null;
    ifcFileName: string = "";
    ifcFileIsValid: boolean = false;

    config: any = {
        hasAllCheckBox: false,
        hasFilter: false,
        hasCollapseExpand: true,
        decoupleChildFromParent: false,
        maxHeight: 395
    };

    spatialStructureList: any [] = [];
    items: TreeviewItem[] = [];

    ngOnInit() {
        
    }

    selectedFileChanged(event: Event) {
        if (event.target instanceof HTMLInputElement) {
            this.loadingFile = true;
            this.ifcFile = event.target.files[event.target.files.length - 1];
            this.ifcFileName = "(" + this.ifcFile.name + ")";
            this.ifcFileIsValid = false; 
            var formData = new FormData();
            formData.append('ifcFile', this.ifcFile);
            var url = '/Api/IfcConversion/IfcToWexbim';
            this.http
                .post(url, formData, { responseType: "blob", observe: "events", reportProgress: true})
                .subscribe((event: HttpEvent<any>)  => {
                    if (event.type == HttpEventType.UploadProgress) {                        
                        this.progress = Math.round(event.loaded / event.total * 100);
                    }
                    else if (event.type == HttpEventType.Response) {   
                        if(event.ok) {                     
                            this.viewer = new Viewer('viewer');
                            this.viewer.background = [0, 0, 0, 0];
                            this.viewer.start();
                            this.loadingFile = false;
                            this.loadComplete = true;
                            this.viewer.load(event.body, 'model');
                            this.progress = 0;
                            this.showFileUploadComponent = false;

                            var url2 = '/Api/IfcConversion/GetSpatialView';
                            this.http.post(url2, formData)
                                    .subscribe( (res: any) => {
                                        console.log(res);
                                        this.spatialStructureList = res;
                                        this.getSpatialStructure();
                                    },
                                    err => {
                                        console.error(err);
                                    })
                        }
                        else{
                            this.loadingFile = false;
                            this.loadComplete = false;
                            this.progress = 0;
                            this.showFileUploadComponent = true;
                            this.ifcFile = null;
                            this.ifcFileName = "";
                            alert('Could not convert this model');
                        }
                    }
                }, error => {
                    this.loadingFile = false;
                    this.loadComplete = false;
                    this.progress = 0;
                    this.showFileUploadComponent = true;
                    this.ifcFile = null;
                    this.ifcFileName = "";
                    alert('Could not convert this model');
                });
        }
    }

    onSelectedChange(selectedItems: string[]) {
        if(selectedItems.length > 0) {
            this.reset();
            selectedItems.forEach( selectedItem => {
                this.viewer.setState(State.HIGHLIGHTED, [parseInt(selectedItem)]);
            });
        }
        else{
            this.reset();
        }
    }

    onShowFileUploadComponent() {
        this.showFileUploadComponent = !this.showFileUploadComponent;
    }

    resetViewerState() {
        this.viewer.resetStates(true);
    }

    validateIFC() {
        var formData = new FormData();
        formData.append('ifcFile', this.ifcFile);
        var url = '/Api/IfcConversion/ValidateIFC';

        this.http
                .post(url, formData)
                .subscribe((res: string) => {
                    if(res.includes("No issues found. IFC file is valid.")){
                        this.ifcFileIsValid = true;
                    }
                    else{
                        this.ifcFileIsValid = false;
                    }

                    this.informationlogmodal.showLog(res);
                });
    }

    validateGML() {

    }

    select() {
        this.viewer.on('pick',
            (args) => {
                this.viewer.setState(State.HIGHLIGHTED, [args.id]);
                this.searchOnTree(args.id);
            });
    }

    hide() {
        this.viewer.on('pick',
            (args) => {
                this.viewer.setState(State.HIDDEN, [args.id]);
            });
    }

    reset() {
        this.viewer.resetStates(true);
    }

    exportGML() {
        var path="assets/gml/a.txt";
        var doc = document.createElement("a");
        doc.href = path;
        doc.download = path;
        doc.click();
        window.URL.revokeObjectURL("a.txt");
    }

    toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;
        this.iconCollapse = this.isCollapsed ? "fa" + "," + "minus" : "fa" + "," + "plus";
    }

    getSpatialStructure() {
        this.spatialStructureList.forEach(spatialStructure => {
            if (spatialStructure.parentId == null) {
                var item = new TreeviewItem({
                    text: spatialStructure.name,
                    value: spatialStructure.id,
                    children: [],
                    collapsed: false,
                    checked: false,
                });

                this.recTree(item);
                this.items.push(item);
            }
        });
    }

    recTree(item: TreeviewItem) {
        this.spatialStructureList.forEach(val => {
            if (item.value == val.parentId) {
                var childItem = new TreeviewItem({
                    text: val.name,
                    value: val.id,
                    children: [],
                    collapsed: false,
                    checked: false,
                });

                if (!item.children) {
                    item.children = [childItem];
                }
                else {
                    item.children.push(childItem);
                }

                this.recTree(childItem);
            }
        });
    }

    searchOnTree(selectedId) {
        this.items.forEach( item => {
            if(item.value == selectedId) {
                item.checked = true;
            }
            else{
                this.recSearchOnTree(selectedId, item.children);
            }
        });
    }

    recSearchOnTree(selectedId, childItems) {
        childItems.forEach(element => {
            if(element.value == selectedId) {
                element.checked = true;
            }
            else{
                if(element.children && element.children.length > 0) {
                    this.recSearchOnTree(selectedId, element.children);
                }
            }
        });
    }
}
