import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubjectService } from '../../subject/subject.service';
import { QuestionService } from '../question.service';
import { HelperService } from 'src/app/universal/helper.service';
import { CollegeYear, IQuestion, SchoolCLass, Semisters } from '../question.model';
import { UserSettingService } from '../../user-setting.service';
import introJs from 'intro.js';
import { IUser, InstitutionType } from 'src/app/modules/authentication/auth.model';
import { AuthService } from 'src/app/modules/authentication/auth.service';
import * as moment from 'moment';
import { AppConstant } from 'src/app/universal/app-constant';


@Component({
  selector: 'add-questions',
  templateUrl: './add-questions.component.html',
  styleUrls: ['./add-questions.component.scss']
})
export class AddQuestionsComponent implements OnInit {
  mcqFormGroup: FormGroup;
  aboutQuestionFg: FormGroup;

  currentUser: IUser;
  subjects: any;
  InstitutionType = InstitutionType;
  Year = CollegeYear;
  SchoolCLass = SchoolCLass;
  Semisters = Semisters;
  optionsForm: FormGroup;
  addSubjectFg: FormGroup;
  docxText: string;
 
  get optionControls() {
    return (this.mcqFormGroup.get('options') as FormArray).controls;
  }

  constructor(
    private formBuilder: FormBuilder
    , private questionSvc: QuestionService
    , private userSettingSvc: UserSettingService
    , private subjectSvc: SubjectService
    , private helperSvc: HelperService  
    , private authSvc: AuthService
  ) {
    this.mcqFormGroup = this.formBuilder.group({
      questionText: [null, Validators.required],
      options: this.formBuilder.array([]) // Initialize the options array
    });

    this.aboutQuestionFg = this.formBuilder.group({
      subject:  [null, Validators.required],
      // institutionType:  [null, Validators.required],
      collegeYear: [null, Validators.required],
      scchoolClass: [null, Validators.required]
    });

    this.addSubjectFg = this.formBuilder.group({
      name: [null, Validators.required],
    });
   }

  async ngOnInit() {
    this.addOption();

    this.helperSvc.presentLoader('Fteching institution type')

    try {
      await this._getCurrentUser();
      
    } catch (error) {
      
    } finally {
      this.helperSvc.dismissLoader();
    }

    await this._getAllSubjects();

    if(!this.currentUser.tourVisited) {
      this.startTour();
    }

  }


  addOption() {
    const optionFormGroup = this.formBuilder.group({
      text: [null, Validators.required],
      isOptionCorrect: [null, Validators.required]
    }); 
    (this.mcqFormGroup.get('options') as FormArray).push(optionFormGroup);
  }

  updateOptionSelection(selectedIndex: number) {
    const optionsArray = this.mcqFormGroup.get('options') as FormArray;
    const selectedOption = optionsArray.at(selectedIndex);
  
    if (selectedOption) {
      optionsArray.controls.forEach((option, index) => {
        if (index !== selectedIndex) {
          option.patchValue({ isOptionCorrect: false });
        } else {
          const isOptionCorrectControl = option.get('isOptionCorrect');
          if (isOptionCorrectControl) {
            const isOptionCorrect = isOptionCorrectControl.value;
            if (!isOptionCorrect) {
              option.patchValue({ isOptionCorrect: true });
            }
          }
        }
      });
    }
  }
  

  async onAddSubjectClicked(data: any) {
    this.helperSvc.presentLoader('Adding subject')

    
    //TODO: subject name should be saved in lowercase
    try {
      const resp = await this.subjectSvc.addSubject(data);   
      await this._getAllSubjects();
      if(resp.status) {
        this.helperSvc.presentAlert(resp.message, 'success');
      } else {
        this.helperSvc.presentAlert(resp.message, 'warning');
      }

    } catch (error) {
      
    }  finally {
      this.helperSvc.dismissLoader();    
    }
  }

  async onSubmitClicked(mcq: any) {
    if(!this.aboutQuestionFg.controls['subject'].value) {
      return;   
    }

    if(this.currentUser?.institution.type == InstitutionType.COLLEGE &&
         this.aboutQuestionFg.controls['collegeYear'].value == null) {
      this.helperSvc.presentAlert('Please select Year', 'warning');
      return;   
    } 

    if(this.currentUser?.institution.type == InstitutionType.SCHOOL && 
      this.aboutQuestionFg.controls['scchoolClass'].value == null) {
      this.helperSvc.presentAlert('Please select Class', 'warning');
      return;   
    }  

    const date = moment().format('MM/DD/YY');

    const  options:any = JSON.stringify(this.mcqFormGroup.value.options); 
    const question: IQuestion = {
      text: mcq.questionText,
      createdBy: this.currentUser,
      updatedBy: null,
      createdOn: date,
      subject: this.aboutQuestionFg.controls['subject'].value,
      options: options,
      institutionType: this.currentUser?.institution.type,
      collegeYear: this.aboutQuestionFg.controls['collegeYear'].value,
      scchoolClass: this.aboutQuestionFg.controls['scchoolClass'].value,
    }
    console.log(question);
    
    this.helperSvc.presentLoader('Adding Question');    
    try {
      const resp = await this.questionSvc.addQuestion(question);
      if(resp.status) {
        this.helperSvc.presentAlert(resp.message, 'success');
      }
    } catch (error) {
      
    } finally {
      this.helperSvc.dismissLoader();    
    }
    
    this.mcqFormGroup.reset();
      
  }

    
    startTour() {
      const intro = introJs();
      let steps = [
        {
          intro: " Welcome! Let's start tour"
        },
        {
          element: '#select-subject',
          intro: " Select subject "
        }
        
      ];

      if(this.currentUser?.institution.type == InstitutionType.SCHOOL) {
        const school = {
          element: '#select-class',
          intro: " Select class "
        }
        steps.push(school);
      }

      if(this.currentUser?.institution.type == InstitutionType.COLLEGE) {
        const college = {
          element: '#select-year',
          intro: " Select college year"
        }
        steps.push(college);
      }

      steps.push(
        {
          element: '#add-question',
          intro: " Add question "
        }
      );

      intro.setOptions({
        showProgress: true,
        steps: steps,
        exitOnOverlayClick: false,
        // Add event listener for when the tour is completed
        
      });
  
      intro.oncomplete(() =>  {
        this.currentUser.tourVisited = true;
         this.authSvc.updateTourStatus(this.currentUser )
      });
      
      intro.onexit( () => {
        this.currentUser.tourVisited = true;
        this.authSvc.updateTourStatus(this.currentUser ) 
      });
  
      intro.start();
    
    }
 
 

  private async _getCurrentUser() {
    let user: any = await this.userSettingSvc.getCurrentUser();
    user = await this.authSvc.getCurrentUser(user.id);
    this.currentUser = user;
    console.log(this.currentUser);
    
  }

  private async _getAllSubjects() {
    this.subjects = await this.subjectSvc.getAllSubjects();
  }  

  isElementVisible = () => true; // Default visibility function, always returns true

}
