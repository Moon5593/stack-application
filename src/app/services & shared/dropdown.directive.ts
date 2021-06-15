import { Directive, ElementRef, HostBinding, EventEmitter, HostListener, OnInit, Output, Input } from '@angular/core';

@Directive({
    selector: '[appDropdown]'
})
export class DropdownDirective implements OnInit{

    @Input() isOpen = false;
    @Output() toggleState = new EventEmitter<boolean>();

    @HostListener('click') toggleOpen(){
        this.isOpen = !this.isOpen;
        this.toggleState.emit(this.isOpen);
    }

    @HostListener('document:click', ['$event'])
    @HostListener('document:touchstart', ['$event'])
    handleOutsideClick(event) {
      if (!this.eRef.nativeElement.contains(event.target)) {
        this.isOpen = false;
        this.toggleState.emit(this.isOpen);
      }
    }

    constructor(private eRef: ElementRef){}

    ngOnInit(){

    }

}
