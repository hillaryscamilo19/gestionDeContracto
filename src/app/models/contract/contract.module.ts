import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class ContractModule {
  _id!: string; 
  clienteEmail: any;
  clienteNombre: any;
  numeroContrato: any;
  descripcion: any;
  fechaInicio!: string | number | Date;
  fechaVencimiento!: string | number | Date;
  pdfUrl!: string;
}
