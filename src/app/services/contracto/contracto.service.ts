import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContractoService {
constructor(private http: HttpClient) {}
private apiUrl = `${environment.apiUrl}/contratos`


getContratos(): Observable<any[]> {
  console.log("Obteniendo contratos desde:", this.apiUrl)
  
  return this.http.get<any[]>(this.apiUrl).pipe(
    
    tap((contratos) => console.log("Contratos recibidos:", contratos.length)),
    catchError((error) => {
      console.error("Error al obtener contratos:", error)
      return throwError(() => error)
    }),
  )
}

getContrato(id: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    catchError((error) => {
      console.error(`Error al obtener contrato ${id}:`, error)
      return throwError(() => error)
    }),
  )
}


crearContrato(formData: FormData): Observable<any> {

  console.log("Creando contrato en:", this.apiUrl)
  return this.http.post<any>(this.apiUrl, formData).pipe(
    
    tap((response) => console.log("Contrato creado:", response)),
    catchError((error) => {
      console.error("Error al crear contrato:", error)
      return throwError(() => error)
    }),
  )
}

actualizarContrato(id: string, formData: FormData | any): Observable<any> {

  if (typeof id !== "string") {
    console.error("Error: ID must be a string, received:", id)
    return throwError(() => new Error("ID must be a string"))
  }

  return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(
    tap((response) => console.log("Contrato actualizado:", response)),
    catchError((error) => {
      console.error(`Error al actualizar contrato ${id}:`, error)
      return throwError(() => error)
    }),
  )
}

eliminarContrato(id: string): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
    catchError((error) => {
      console.error(`Error al eliminar contrato ${id}:`, error)
      return throwError(() => error)
    }),
  )
}

descargarPdf(id: string): Observable<Blob> {
  return this.http
    .get(`${this.apiUrl}/${id}/pdf`, {
      responseType: "blob",
    })
    .pipe(
      catchError((error) => {
        console.error(`Error al descargar PDF del contrato ${id}:`, error)
        return throwError(() => error)
      }),
    )
}
}
