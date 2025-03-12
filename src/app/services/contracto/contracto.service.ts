import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContractModule } from 'src/app/models/contract/contract.module';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContractoService {

  private apiUrl = `${environment.apiUrl}/contratos`;

  constructor(private http: HttpClient) { }

  getContratos(): Observable<ContractModule[]> {
    return this.http.get<ContractModule[]>(this.apiUrl);
  }

  getContrato(id: string): Observable<ContractModule> {
    return this.http.get<ContractModule>(`${this.apiUrl}/${id}`);
  }

  crearContrato(contrato: ContractModule): Observable<ContractModule> {
    return this.http.post<ContractModule>(this.apiUrl, contrato);
  }

  actualizarContrato(id: string, contrato: ContractModule): Observable<ContractModule> {
    return this.http.put<ContractModule>(`${this.apiUrl}/${id}`, contrato);
  }

  eliminarContrato(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
