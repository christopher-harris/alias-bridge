import {Component, DestroyRef, inject, signal, WritableSignal} from '@angular/core';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {ButtonModule} from 'primeng/button';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {tablerBrandGithub, tablerLogin, tablerMail} from '@ng-icons/tabler-icons';
import {AuthActions} from '../../state/app/auth/auth.actions';
import {Store} from '@ngrx/store';
import {PanelModule} from 'primeng/panel';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {MessageModule} from 'primeng/message';
import {Observable} from 'rxjs';
import {authFeature} from '../../state/app/auth/auth.reducer';
import {AsyncPipe} from '@angular/common';
import {FirebaseError} from 'firebase-admin';
import {Actions, ofType} from '@ngrx/effects';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sign-in',
  imports: [
    ButtonModule,
    NgIcon,
    PanelModule,
    InputTextModule,
    PasswordModule,
    ReactiveFormsModule,
    MessageModule,
    AsyncPipe,
  ],
  templateUrl: './sign-in.dialog.html',
  styleUrl: './sign-in.dialog.scss',
  providers: [
    DialogService
  ],
  viewProviders: [
    provideIcons({tablerBrandGithub, tablerLogin, tablerMail})
  ]
})
export class SignInDialog {
  store = inject(Store);
  dialogService = inject(DialogService);
  ref = inject(DynamicDialogRef);
  actions = inject(Actions);
  destroyRef = inject(DestroyRef);

  authError$: Observable<FirebaseError> = this.store.select(authFeature.selectError);

  showEmailSignInForm = false;

  action: WritableSignal<'login' | 'register'> = signal('login');

  emailSignInForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  constructor() {
    this.actions.pipe(
      ofType(AuthActions.authSuccess),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.ref.close());
  }

  handleUserClickedGithubLogin() {
    this.store.dispatch(AuthActions.userClickedGitHubAuth());
  }

  toggleEmailSignInForm() {
    this.showEmailSignInForm = !this.showEmailSignInForm;
  }

  handleEmailSignIn() {
    console.log('Logging in with email:', this.emailSignInForm.value);
    if (this.emailSignInForm.valid) {
      this.store.dispatch(AuthActions.signInEmailUser({email: this.emailSignInForm.value.email, password: this.emailSignInForm.value.password}));
    }
  }

  handleRegisterNewUser() {
    console.log('Registering new user:', this.emailSignInForm.value);
    if (this.emailSignInForm.valid) {
      this.store.dispatch(AuthActions.registerEmailUser({email: this.emailSignInForm.value.email, password: this.emailSignInForm.value.password}));
    }
  }

  toggleAction(selectedAction: 'login' | 'register') {
    this.action.set(selectedAction);
  }
}
