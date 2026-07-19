import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../../services/api.service';
import { BeneficiariesViewComponent } from './beneficiaries.component';

describe('BeneficiariesViewComponent', () => {
  let fixture: ComponentFixture<BeneficiariesViewComponent>;
  let component: any;
  let apiService: {
    getBeneficiaries: ReturnType<typeof vi.fn>;
    addBeneficiary: ReturnType<typeof vi.fn>;
    verifyBeneficiary: ReturnType<typeof vi.fn>;
    deleteBeneficiary: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    apiService = {
      getBeneficiaries: vi.fn().mockReturnValue(of({ data: { beneficiaries: [] } })),
      addBeneficiary: vi.fn().mockReturnValue(of({
        data: {
          beneficiaryId: '513edda2-b4fb-4b87-ab54-b670afece5da',
          maskedEmail: 'so••••@gmail.com'
        }
      })),
      verifyBeneficiary: vi.fn().mockReturnValue(of({
        message: 'Beneficiary verified and activated successfully'
      })),
      deleteBeneficiary: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [BeneficiariesViewComponent],
      providers: [{ provide: ApiService, useValue: apiService }]
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficiariesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requests a code and remains in verification instead of adding immediately', () => {
    component.openAddModal();
    component.addForm = {
      fullName: 'Test Recipient',
      nickName: 'Rent',
      accountId: '3e80cf56-6d73-48d2-9a7a-df3074bd179f'
    };

    component.handleAddSubmit(new Event('submit'));
    fixture.detectChanges();

    expect(apiService.addBeneficiary).toHaveBeenCalledWith({
      fullName: 'Test Recipient',
      nickName: 'Rent',
      accountId: '3e80cf56-6d73-48d2-9a7a-df3074bd179f'
    });
    expect(apiService.verifyBeneficiary).not.toHaveBeenCalled();
    expect(component.verificationStep()).toBe(2);
    expect(component.showAddModal()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Verify beneficiary');
  });

  it('only closes and refreshes the list after a six-digit code is verified', () => {
    component.openAddModal();
    component.addForm = {
      fullName: 'Test Recipient',
      nickName: 'Rent',
      accountId: '3e80cf56-6d73-48d2-9a7a-df3074bd179f'
    };
    component.handleAddSubmit(new Event('submit'));

    component.verifyOtpCode = '12345';
    component.handleVerifySubmit(new Event('submit'));
    expect(apiService.verifyBeneficiary).not.toHaveBeenCalled();
    expect(component.showAddModal()).toBe(true);

    component.verifyOtpCode = '123456';
    component.handleVerifySubmit(new Event('submit'));

    expect(apiService.verifyBeneficiary).toHaveBeenCalledWith({
      beneficiaryId: '513edda2-b4fb-4b87-ab54-b670afece5da',
      otp: '123456'
    });
    expect(component.showAddModal()).toBe(false);
    expect(component.pageMessage()).toContain('verified and activated');
    expect(apiService.getBeneficiaries).toHaveBeenCalledTimes(2);
  });
});