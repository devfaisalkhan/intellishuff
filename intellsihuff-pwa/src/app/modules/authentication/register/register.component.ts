import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IRegistrationParams, IUser, InstitutionType, UserRole } from '../auth.model';
import { AuthService } from '../auth.service';
import { HelperService } from 'src/app/universal/helper.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { IResponse, Icon } from 'src/app/universal/shared.model';
import { AppConstant } from 'src/app/universal/app-constant';
import { UserConstant } from '../../user/user-constant';
import { BasePage } from 'src/app/universal/base.page';

@Component({
  selector: 'register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent extends BasePage implements OnInit {
  id: number;
  formGroup: FormGroup;
  user: IUser;
  showPassword = false;

  InstitutionType = InstitutionType;
  get fg() {
    return this.formGroup.controls;
  }
  constructor(
    private formBuilder: FormBuilder,
    private authSvc: AuthService,
    private route: ActivatedRoute,
  ) {
    super();
    this.formGroup = formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      institutionName: ['', Validators.required],
      institutionType: ['', Validators.required],
    });
  }

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.id = params['id'];
    });

    if (this.id) {
      this.helperSvc.presentLoader('Fetching User');
      try {
        this.user = await this.authSvc.getCurrentUser(this.id);

        if (this.user) {
          this._populateFormGroup();
        }
      } catch (error) {
      } finally {
        this.helperSvc.dismissLoader();
      }
    }

    if (AppConstant.DEBUG) {
      this._preFill();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLoginClicked() {
    this.router.navigate(['/login']);
  }

  async onFormSubmitted(data: IRegistrationParams) {
    // const loader = await this.helperSvc.loader;
    // await loader.present();
    const institution = {
      name: this.fg['institutionName'].value,
      type: this.fg['institutionType'].value,
    };

    const params = {
      email: data.email,
      name: data.name,
      roles: [],
      password: data.password,
      status: data.status,
      institution: institution,
    };

    try {
      const resp: IResponse<any> = await this.authSvc.regsiter(params);
      if (resp.status) {
        this.formGroup.reset();
        this.helperSvc.presentAlert(resp.message, Icon.SUCCESS);

        this.router.navigate(['/login']);
      } else {
        this.helperSvc.presentAlert(resp.message, Icon.WARNING);
      }
    } catch (error) {
    } finally {
      this.helperSvc.dismissLoader();
    }
  }

  private _populateFormGroup() {
    this.fg['name'].setValue(this.user.name);
    this.fg['email'].setValue(this.user.email);
    this.fg['password'].setValue(this.user.password);
    this.fg['institutionName'].setValue(this.user.institution?.name);
    this.fg['institutionType'].setValue(this.user.institution?.type);
  }

  private _preFill() {
    this.fg['name'].setValue('hello');
    this.fg['email'].setValue('hello@hello');
    this.fg['password'].setValue('password');
    this.fg['institutionName'].setValue('hello');
    this.fg['institutionType'].setValue(InstitutionType.COLLEGE);
  }
}
