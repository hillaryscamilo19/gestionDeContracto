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
  contractType!: "local" | "internacional" | "aseguradora"
  owner!: "ssv" | "klarida" | "abrah" | "softexpert"
  serviceType!: string
  previousContractPath?: string
  archivoPdf?: {
    nombre: string
    ruta: string
    tamano: number
    fechaSubida: Date
  }
  clientId?: string
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
  name!: string
  email!: string
  phone?: string
  lastName!: string
  address?: string
  contactPerson?: string
  createdAt?: Date
  hasActiveContracts: unknown;
  contractCount!: number;
}

