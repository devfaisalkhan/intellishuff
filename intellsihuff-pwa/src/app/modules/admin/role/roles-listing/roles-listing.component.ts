import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoleService } from '../role.service';
import { BasePage } from 'src/app/universal/base.page';
import { IRole } from '../role.model';
import { SweetAlertIcon } from 'src/app/universal/shared.model';

@Component({
  selector: 'roles-listing',
  templateUrl: './roles-listing.component.html',
  styleUrls: ['./roles-listing.component.scss'],
})
export class RolesListingComponent extends BasePage implements OnInit {
  @ViewChild('closeModalBtn') closeModalBtn: ElementRef;

  roleFormGroup: FormGroup;
  roles: IRole[];
  editMode = false;

  constructor(
    private formBuilder: FormBuilder,
    private roleSvc: RoleService,
  ) {
    super();
    this.roleFormGroup = this.formBuilder.group({
      role: [null, Validators.required],
    });
  }

  async ngOnInit() {
    await this._getAllRoles();
  }

  clodeModal() {
    this.editMode = false;
    this.roleFormGroup.reset();
  }

  onEditRoleClicked(role) {
    this.editMode = true;
    this.roleFormGroup.patchValue({ role: role.role });
  }

  async onAddRoleClicked(data) {
    this.helperSvc.presentLoader('Adding role');
    try {
      const resp = await this.roleSvc.addRole(data);

      if (resp.status) {
        this.helperSvc.presentAlert(resp.message, SweetAlertIcon.SUCCESS);
        this._closeModal();
        await this._getAllRoles();
      } else {
        this.helperSvc.presentAlert(resp.message, SweetAlertIcon.WARNING);
      }
    } catch (error) {
    } finally {
      this.helperSvc.dismissLoader();
    }
  }

  trackByRoles(index, role: IRole) {
    return role ? role.id : undefined;
  }

  private async _getAllRoles() {
    const roles = await this.roleSvc.getAll();
    this.roles = roles.data as any;
  }

  private _closeModal() {
    this.roleFormGroup.reset();
    this.closeModalBtn.nativeElement.click();
  }
}
