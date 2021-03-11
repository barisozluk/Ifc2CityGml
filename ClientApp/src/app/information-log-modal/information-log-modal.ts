import { OnInit, OnDestroy, AfterViewInit, Component, ElementRef, ViewChild, Output, EventEmitter } from "@angular/core";

declare var $: any 

@Component({
    selector: 'informationlogmodal',
    templateUrl: './information-log-modal.html',
    styleUrls: ['./information-log-modal.scss']
})
export class InformationLogModal implements OnInit {

    @ViewChild('logModal') logModal:ElementRef;
    log: string = "";

    constructor() { }

    ngOnInit() {

    }

    showLog(log: string) {
        this.log = log;
        $(this.logModal.nativeElement).modal('show');
    }
}
