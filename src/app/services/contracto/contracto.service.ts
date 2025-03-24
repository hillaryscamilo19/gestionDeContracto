import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContractoService {
  private modalInstance: any;
constructor(private http: HttpClient) {}
  private apiUrl = "http://10.0.0.15:6970/api"
  private fileUrl = 'http://10.0.0.15:6970/api/';

  getContratos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Contrato`);
  }

  getContrato(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Contrato${id}`);
  }

  crearContrato(contrato: any, archivo?: File): Observable<any> {
    const formData = new FormData();
    
    Object.keys(contrato).forEach(key => {
      formData.append(key, contrato[key]);
    });
    
    if (archivo) {
      formData.append('archivo', archivo, archivo.name);
    }
    
    return this.http.post<any>(`${this.apiUrl}/Contrato/create`, formData);
  }

  getEmpresasPropietario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/EmpresasPropietario`).pipe(
      catchError((error) => {
        console.error("Error al obtener empresas propietario:", error)
        return throwError(() => new Error("Error al cargar empresas propietario. Por favor intente nuevamente."))
      }),
    )
  }

  // Implementación del método para obtener tipos de contrato
  getTiposContrato(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/TiposContrato`).pipe(
      catchError((error) => {
        console.error("Error al obtener tipos de contrato:", error)
        return throwError(() => new Error("Error al cargar tipos de contrato. Por favor intente nuevamente."))
      }),
    )
  }


  actualizarContrato(id: string | number, contrato: any, archivo?: File): Observable<any> {
    const formData = new FormData();
    
    Object.keys(contrato).forEach(key => {
      formData.append(key, contrato[key]);
    });
    
    if (archivo) {
      formData.append('archivo', archivo, archivo.name);
    }
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
  }

  eliminarContrato(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/Contrato/${id}`);
  }


  descargarPdf(storedFileName: string, nombreCliente: string): void {

    const link = document.createElement('a');
    link.href = `${this.apiUrl}/archivos/download/${storedFileName}`;
    link.download = `Contrato_${nombreCliente || 'Descarga'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  obtenerPdfBlob(id: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/Contrato/${id}/pdf/download`, {
      responseType: 'blob'
    });
  }
  visualizarPdf(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Contrato/${id}/pdf/view`);
  }
}
