import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class ContractModule {
  _id?: string
  clientName!: string
  clientEmail!: string
  contractNumber!: string
  description?: string
  startDate!: Date
  expirationDate!: Date
  tipoContrato!: "local" | "internacional" | "aseguradora"
  owner!: "ssv" | "klarida" | "abrah" | "softexpert"
  serviceType!: string
  previousContractPath?: string
  archivos?: {
    fileName: string
    filePath: string
    tamano: number
    storedFileName: string;
    createdAt: Date
  }
  clienteId?: string
}



export class Cliente2{
        _id?: string
        nombre!: string
        apellido!:string
        email!: string
        createAt!: Date
        isActive!: true
        direccion!: string
        contactPerson?: string
        telefono?: string
        documento_Identidad!: string
}


export class Client {
  _id?: string
  Name!: string
  Email!: string
  phone?: string
  LastName!: string
  Address?: string
  Documento_Identidad!: string

}

