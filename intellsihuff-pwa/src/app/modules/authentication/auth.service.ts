import { BaseService } from 'src/app/universal/base.service';
import { IRegister, IUser, Ilogin, UserRole, UserStatus } from './auth.model';
import { IResponse } from 'src/app/universal/shared.model';
import { HttpHeaders } from '@angular/common/http';

export class AuthService extends BaseService {
  /**
   *
   */
  constructor() {
    super();
  }

  uploadLogo( image) {
    return this.postData<any>({
      url: `institution/uploadLogo`,
      body: {
        file: image
      },
    });
  }

  getAllUsers() {
    return this.getData<IUser[]>({
      url: `user/getAllUsers`,
    });
  }

  async getCurrentUser(id: number) {
    const token = await this.userSettingSvc.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.getData<IUser>({
      url: `user/getCurrentUser?id=${id}`,
      httpHeaders: headers
    });
  }

  regsiter(args: IRegister) {
    return this.postData<IResponse<any>>({
      url: `user/register`,
      body: {
        ...args,
      },
    });
  }

  login(args: Ilogin) {
    return this.postData<IUser>({
      url: `user/login`,
      body: {
        ...args,
      },
    });
  }

  changeRole(args: IUser, role: UserRole) {
    return this.postData({
      url: `user/changeRole`,
      body: {
        user: args,
        role: role,
      },
    });
  }

  changeStatus(args: IUser, status: UserStatus) {
    return this.postData({
      url: `user/changeStatus`,
      body: {
        user: args,
        status: status,
      },
    });
  }

  sendMail(args: { to: string; subject: string }) {
    return this.postData<IResponse<any>>({
      url: `user/sendMail`,
      body: {
        ...args,
      },
    });
  }

  updateTourStatus(args: IUser) {
    return this.postData({
      url: `user/updateTourStatus`,
      body: {
        ...args,
      },
    });
  }

  logoutEverywhere(username?) {
    return new Promise(async (resolve, reject) => {
      // const loginType = await this.userSettingSvc.getLoggedInMethod();
      // switch(loginType) {
      //     case LoginType.GOOGLE:
      //       await this.googleAuthSvc.logout();
      //     break;
      //     case LoginType.FACEBOOK:
      //       await this.facebookAuthSvc.logout();
      //     break;
      // }

      if (!username) {
        username = await this.userSettingSvc.getCurrentUser();
      }

      if (!username) {
        return;
      }

      try {
      } catch (e) {} //ignore...

      await Promise.all([
        // this.userSettingSvc.removeUserProfileLocal(username),
        this.userSettingSvc.removeAccessToken(),
        this.userSettingSvc.removeCurrentUser(),
        this.userSettingSvc.removeLoggedInMethod(),
        this.userSettingSvc.removeCurrentUserPassword(),
      ]);

      // this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDOUT);
      resolve(null);
    });
  }
}
