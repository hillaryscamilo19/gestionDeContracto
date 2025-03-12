import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getConfiguracion(): Observable<RTCConfiguration> {
    return this.http.get<RTCConfiguration>(`${this.apiUrl}/configuracion`);
  }

  actualizarConfiguracion(config: RTCConfiguration): Observable<RTCConfiguration> {
    return this.http.put<RTCConfiguration>(`${this.apiUrl}/configuracion`, config);
  }

  enviarCorreoPrueba(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar-prueba`, { email });
  }
}
