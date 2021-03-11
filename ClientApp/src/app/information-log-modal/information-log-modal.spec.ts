import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InformationLogModal } from './information-log-modal';


describe('InformationLogModal', () => {
  let component: InformationLogModal;
  let fixture: ComponentFixture<InformationLogModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InformationLogModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InformationLogModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
