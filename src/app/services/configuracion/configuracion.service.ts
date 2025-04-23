import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Enviar notificación de nuevo contrato
  enviarNotificacionNuevoContrato(contratoId: string, destinatarios: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/email/nuevo-contrato`, {
      contratoId,
      destinatarios
    });
  }

  // Enviar notificación de contrato por vencer
  enviarNotificacionVencimiento(contratoId: string, destinatarios: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/email/vencimiento`, {
      contratoId,
      destinatarios
    });
  }

  // Enviar contrato por correo
  enviarContratoPorCorreo(contratoId: string, destinatarios: string[], mensaje: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/email/enviar-contrato`, {
      contratoId,
      destinatarios,
      mensaje
    });
  }
}

