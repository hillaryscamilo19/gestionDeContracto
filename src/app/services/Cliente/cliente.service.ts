import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Client } from 'src/app/models/contract/contract.module';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiUrl}/clients`

  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl).pipe(
      tap((clients) => console.log("Clientes recibidos:", clients.length)),
      catchError((error) => {
        console.error("Error al obtener clientes:", error)
        return throwError(() => error)
      }),
    )
  }

  getClient(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error al obtener cliente ${id}:`, error)
        return throwError(() => error)
      }),
    )
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client).pipe(
      catchError((error) => {
        console.error("Error al crear cliente:", error)
        return throwError(() => error)
      }),
    )
  }

  updateClient(id: string, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client).pipe(
      catchError((error) => {
        console.error(`Error al actualizar cliente ${id}:`, error)
        return throwError(() => error)
      }),
    )
  }

  deleteClient(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error al eliminar cliente ${id}:`, error)
        return throwError(() => error)
      }),
    )
  }
}
