import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from '@angular/common';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {ButtonModule} from 'primeng/button';
import {Router, RouterModule} from '@angular/router';
import {AliasService} from '../../services/alias.service';
import {Alias, NewAlias} from '../../electron';
import {CardModule} from 'primeng/card';

@Component({
  selector: 'app-add-alias',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    RouterModule,
    CardModule,
  ],
  templateUrl: './add-alias.component.html',
  styleUrl: './add-alias.component.scss'
})
export class AddAliasComponent {
  router = inject(Router);
  aliasService = inject(AliasService);

  aliasForm: FormGroup = new FormGroup({
    aliasName: new FormControl(''),
    aliasCommand: new FormControl(''),
    aliasComment: new FormControl(''),
  });

  handleCancelClicked() {
    this.router.navigate(['../dashboard']);
  }

  saveAlias(): void {
    if (this.aliasForm.invalid) {
      return;
    }
    const newAlias: NewAlias = {
      name: this.aliasForm.get('aliasName')?.value,
      command: this.aliasForm.get('aliasCommand')?.value,
      comment: this.aliasForm.get('aliasComment')?.value,
    };
    console.log('Sending add alias request:', newAlias);
    this.aliasService.addAlias(newAlias);
  }

}
