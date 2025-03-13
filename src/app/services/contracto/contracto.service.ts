import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContractModule } from 'src/app/models/contract/contract.module';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContractoService {
  private apiUrl = `${environment.apiUrl}/contratos`

  constructor(private http: HttpClient) {}

  getContratos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl)
  }

  getContrato(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
  }

  crearContrato(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData)
  }

  actualizarContrato(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData)
  }

  eliminarContrato(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
  }

  descargarPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: "blob",
    })
  }
}
