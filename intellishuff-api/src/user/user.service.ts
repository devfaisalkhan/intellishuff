import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILoginParams, IRegistrationParams, IResponse, IUser, UserRole, UserStatus } from './user.model';
import { MailerService } from '@nestjs-modules/mailer';
import { AppConstant } from 'src/universal/app.constant';
import { User } from './user.entity';
import { HelperService } from 'src/universal/helper.service';

@Injectable()
export class UserService {
    /**
     *
     */
    userStatus = UserStatus;
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        private mailerService: MailerService
        , private helperSvc: HelperService
    ) {
        
        
    }

    async getUserByEmail(email):Promise<IUser> {
        const user = this.userRepo.findOne( { 
            where: { email: email },
            relations: ['institution']
        });

        if(!user) {
            return null;
        }
        return user;
    }

    async updateTourStatus(user: IUser) {
        if(!user) {
            return;
        }

        await this.userRepo.update(user.id, user);
        return user;
    }

    async getAllUsers() {
        const users = await this.userRepo.find();
        if(!users) {
            return;
        }
        return users;
    }

    async register(data: IRegistrationParams): Promise<IResponse> {
        let newOrUpdated: any = {...data} ;

        if(newOrUpdated.id) {
            const user = await this.getUserByEmail(data.email);
            if (!user) {
                return {
                    status: false,
                    message: 'User not found',
                };
            }

            // Update the user properties
            const institution = {
                type: data.institution.type,
                name: data.institution.name
            }
            newOrUpdated.name = data.name;
            newOrUpdated.password = data.password;
            newOrUpdated.institution = {...institution};

            console.log('newOrUpdated',newOrUpdated)
            await this.userRepo.save<User>(newOrUpdated, {reload: true});

            return {
                status: true,
                message: 'User updated successfully',
            };
        }
        const isAnyParamEmpty: boolean = this.helperSvc.checkEmptyParams(data);
        if(isAnyParamEmpty) {
            return {
                status: false,
                message: 'Please fill form',
            };
        }
        
        const user = await this.getUserByEmail(newOrUpdated.email);
        if(user) {
            return {
                status: false,
                message: 'user already exist'
            };
        }
        const institution = {
            type: data.institution.type,
            name: data.institution.name
        }
        newOrUpdated.institution = institution;
        console.log('newOrUpdated', newOrUpdated);

        await this.userRepo.save<User>(newOrUpdated);
        console.log('hello');

        return {
            status: true,
            message: 'User registered successfully',
        };
    }
    
    async login(data: ILoginParams):Promise<IResponse> {
        const user = await this.getUserByEmail(data.email);
        
        if(!user) {
            return {
                status: false,
                message: 'wrong email or password'
            };  
        }

        if(user.status !== this.userStatus.APPROVED ) {
            return {
                status: false,
                message: 'user not approved'
            };   
        }

        if(data.email == user.email && data.password == user.password) {
            
            return {
                data: user,
                status: true,
                message: 'successfully logged in'
            };
            
        } else {
            return {
                status: false,
                message: 'wrong email or password'
            };
        }    
       
    }

    async changeRole(data: IUser, role: UserRole) {
        let user =  await this.getUserByEmail(data.email);

        if(role) {
            user.role = role;
        }

        await this.userRepo.update(user.id, user);
        return user;
    }

    async changeStatus(data: IUser, status: UserStatus) {
        let user =  await this.getUserByEmail(data.email);

        if(status) {
            user.status = status;
        }

        await this.userRepo.update(user.id, user);
        return user;
    }

    async getCurrentUser(id): Promise<IUser> {
        const user = await this.userRepo.findOne( { 
            where: { id: id  },
            relations: ['institution']
         });
        
        if(!user) {
            return null;
        }
        return user;
    }

    async _sendMail(to, subject, template?, context?) {
        let result: { response, messageId, accepted: string[], rejected: string[], envelopeTime, messageTime };
        try {
          result = await this.mailerService.sendMail({
            to: to, // list of receivers
            from: AppConstant.DEFAULT_EMAIL_USERNAME, // sender address
            subject: subject, // Subject line
            text: 'welcome', // plaintext body
            html: '<b>welcome</b>', // HTML body content
          });
        } catch(e) {
          throw e;
        }
    
        return result;
    }
    
}
