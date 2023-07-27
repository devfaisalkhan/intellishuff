import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { IUser, UserRole } from 'src/app/modules/authentication/auth.model';
import { UserConstant } from 'src/app/modules/user/user-constant';
import { UserSettingService } from 'src/app/modules/user/user-setting.service';
import { AppConstant } from 'src/app/universal/app-constant';
import { HelperService } from 'src/app/universal/helper.service';
import { NgxPubSubService } from 'src/app/universal/pub-sub';

@Component({
  selector: 'navbar',
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" routerLink="/home">
        <img src="assets/images/logo-bg.png" alt="" />
      </a>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li
            class="nav-item"
            (click)="onMenuNavigated('admin')"
            *ngIf="isAdmin"
            HoverDirective
            [hoverText]="'admin'"
            routerLink="/admin"
            routerLinkActive="active"
          >
            <a class="nav-link">
              <i class="fas fa-user-shield"></i>
            </a>
          </li>

          <li
            class="nav-item"
            (click)="onMenuNavigated('home')"
            HoverDirective
            [hoverText]="'home'"
            routerLink="/home"
            routerLinkActive="active"
          >
            <a class="nav-link">
              <i class="fas fa-home"></i>
            </a>
          </li>

          <li
            class="nav-item"
            (click)="onMenuNavigated('contact')"
            HoverDirective
            [hoverText]="'contact'"
            routerLink="/contact"
            routerLinkActive="active"
          >
            <a class="nav-link">
              <i class="fas fa-envelope"></i>
            </a>
          </li>

          <li class="nav-item dropdown" role="menu">
            <a
              class="nav-link dropdown-toggle"
              id="navbarDropdownMenuLink"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              {{ currentUser?.name }}
              <!-- <i class="fas fa-user"></i> -->
            </a>

            <div class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
              <li class="nav-item">
                <a
                  class="nav-link"
                  [class.active]="activePage == 'edit-profile'"
                  [routerLink]="['/edit-profile']"
                  [queryParams]="{ id: currentUser?.id }"
                  queryParamsHandling="merge"
                  style="color: var(--color-primary);"
                >
                  Profile
                  <i class="fas fa-user"></i>
                </a>
              </li>

              <li class="nav-item">
                <a class="nav-link text-danger" (click)="onLogOutClicked()">
                  Logout
                  <i class="fas fa-sign-out-alt"></i>
                </a>
              </li>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  `,
  styleUrls: ['./navbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent implements OnInit {
  currentUser: IUser;
  activePage: string = 'home';
  isAdmin: boolean = false;

  constructor(
    private userSettingSvc: UserSettingService,
    private helperSvc: HelperService,
    private router: Router,
    private pubSub: NgxPubSubService,
    private cdRef: ChangeDetectorRef,
    private pubsubSvc: NgxPubSubService
  ) {
    this.pubsubSvc.subscribe(
      UserConstant.EVENT_USER_PROFILE_UPDATED,
      async (user: IUser) => {
        if (AppConstant.DEBUG) {
          console.log('AppComponent: EVENT_USER_PROFILE_UPDATED: params', user);
        }

        await this.userSettingSvc.removeCurrentUser();
        await this.userSettingSvc.putCurrentUser(user);
        await this._getCurrentUser();
      }
    );
  }

  async ngOnInit() {
    this.router.events.subscribe(async (val) => {
      if (val instanceof NavigationStart) {
        const urls = val.url.split('/').filter((u) => u.length);
        if (urls.length) {
          this.activePage = val.url.split('/')[1] as any;
        }
      }
    });
    await this._getCurrentUser();
  }

  onMenuNavigated(url) {
    this.activePage = url;
  }

  async onLogOutClicked() {
    const resp = await this.helperSvc.presentConfirmDialogue(
      'Are you sure',
      'You want to Logout?',
      'warning'
    );
    if (!resp) {
      return;
    }

    this.pubSub.publishEvent(UserConstant.EVENT_USER_LOGGEDOUT, {
      clearCache: true,
    });
  }

  private async _getCurrentUser() {
    this.currentUser = <any>await this.userSettingSvc.getCurrentUser();
    this.currentUser.roles.filter((r) => {
      if (r.role.includes('admin')) {
        this.isAdmin = true;
      }
    });

    this.currentUser.name = this.currentUser.name.toUpperCase();
  }
}
